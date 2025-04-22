import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AsaasCustomerSearch } from '@/components/admin/crm/asaas-customer-search';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from '@/hooks/use-toast';
import { createSimplifiedEnrollment } from '../../../services/new-simplified-enrollment-service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

// Esquema de validação
const formSchema = z.object({
  studentName: z.string().min(3, { message: 'Nome do aluno deve ter pelo menos 3 caracteres' }),
  studentEmail: z.string().email({ message: 'E-mail inválido' }),
  studentCpf: z.string()
    .min(11, { message: 'CPF deve ter 11 dígitos' })
    .max(14, { message: 'CPF inválido' })
    .refine((cpf) => {
      // Remove caracteres não numéricos
      const cpfNumbers = cpf.replace(/\D/g, '');
      return cpfNumbers.length === 11;
    }, { message: 'CPF inválido' }),
  studentPhone: z.string()
    .min(10, { message: 'Telefone deve ter pelo menos 10 dígitos' })
    .refine((phone) => {
      // Remove caracteres não numéricos
      const phoneNumbers = phone.replace(/\D/g, '');
      return phoneNumbers.length >= 10 && phoneNumbers.length <= 11;
    }, { message: 'Telefone inválido' }),
  studentAddress: z.string().optional(),
  studentAddressNumber: z.string().optional(),
  studentAddressComplement: z.string().optional(),
  studentNeighborhood: z.string().optional(),
  studentCity: z.string().optional(),
  studentState: z.string().optional(),
  studentPostalCode: z.string().optional(),
  courseId: z.string().min(1, { message: 'Selecione um curso' }).transform(Number),
  institutionId: z.string().min(1, { message: 'Selecione uma instituição' }).transform(Number),
  amount: z.string()
    .min(1, { message: 'Informe o valor da matrícula' })
    .transform((val) => parseFloat(val.replace(',', '.'))),
  poloId: z.string().optional().transform((val) => val ? Number(val) : null),
  sourceChannel: z.string().optional(),
  billingType: z.enum(['UNDEFINED', 'BOLETO', 'CREDIT_CARD', 'PIX'], { 
    message: 'Selecione uma forma de pagamento válida' 
  }).default('UNDEFINED'),
  maxInstallmentCount: z.string()
    .transform((val) => val ? parseInt(val) : 1)
    .optional(),
  dueDateLimitDays: z.string()
    .transform((val) => val ? parseInt(val) : 7)
    .optional(),
  allowInstallments: z.boolean().default(true),
  interestRate: z.string().optional(),
  fine: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewSimplifiedEnrollmentCreatePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Estado para guardar cliente do Asaas selecionado
  const [selectedAsaasCustomer, setSelectedAsaasCustomer] = useState<{
    id: string;
    name: string;
    email: string;
    cpfCnpj: string;
    mobilePhone?: string;
  } | null>(null);

  // Buscar cursos (usando API JSON direta para contornar o middleware Vite)
  const { data: coursesResponse } = useQuery({
    queryKey: ['/api-json/courses'],
    queryFn: async () => {
      const response = await fetch('/api-json/courses');
      if (!response.ok) throw new Error('Falha ao carregar cursos');
      return response.json();
    },
  });

  // Buscar instituições (usando API JSON direta para contornar o middleware Vite)
  const { data: institutionsResponse } = useQuery({
    queryKey: ['/api-json/institutions'],
    queryFn: async () => {
      const response = await fetch('/api-json/institutions');
      if (!response.ok) throw new Error('Falha ao carregar instituições');
      return response.json();
    },
  });

  // Buscar polos (usando API JSON direta para contornar o middleware Vite)
  const { data: polosResponse } = useQuery({
    queryKey: ['/api-json/polos'],
    queryFn: async () => {
      const response = await fetch('/api-json/polos');
      if (!response.ok) throw new Error('Falha ao carregar polos');
      return response.json();
    },
  });

  const courses = coursesResponse?.data || [];
  const institutions = institutionsResponse?.data || [];
  const polos = polosResponse?.data || [];

  // Inicializar formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentName: '',
      studentEmail: '',
      studentCpf: '',
      studentPhone: '',
      studentAddress: '',
      studentAddressNumber: '',
      studentAddressComplement: '',
      studentNeighborhood: '',
      studentCity: '',
      studentState: '',
      studentPostalCode: '',
      courseId: '',
      institutionId: '',
      amount: '',
      poloId: '',
      sourceChannel: 'admin-portal',
      billingType: 'UNDEFINED',
      maxInstallmentCount: '12',
      dueDateLimitDays: '30',
      allowInstallments: true,
      interestRate: '0',
      fine: '0',
    },
  });

  // Mutation para criar matrícula
  const createEnrollmentMutation = useMutation({
    mutationFn: createSimplifiedEnrollment,
    onSuccess: (data) => {
      toast({
        title: 'Matrícula criada com sucesso',
        description: 'A nova matrícula foi criada e pode ser gerenciada na lista de matrículas.',
      });
      
      // Invalidar cache para atualizar lista
      queryClient.invalidateQueries({ queryKey: ['/api/v2/simplified-enrollments'] });
      
      // Redirecionar para a página de detalhes
      navigate(`/admin/crm/new-simplified-enrollments/${data.data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar matrícula',
        description: error.message || 'Ocorreu um erro ao criar a matrícula. Tente novamente.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    },
  });

  // Submit handler
  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);
    
    const enrollmentData = {
      studentName: values.studentName,
      studentEmail: values.studentEmail,
      studentCpf: values.studentCpf.replace(/\D/g, ''), // Remover formatação
      studentPhone: values.studentPhone.replace(/\D/g, ''), // Remover formatação
      courseId: values.courseId,
      institutionId: values.institutionId,
      amount: values.amount,
      poloId: values.poloId,
      sourceChannel: values.sourceChannel || 'admin-portal',
      // Adicionar dados adicionais para o Asaas
      billingType: values.billingType,
      maxInstallmentCount: values.maxInstallmentCount,
      dueDateLimitDays: values.dueDateLimitDays,
      studentAddress: values.studentAddress,
      studentAddressNumber: values.studentAddressNumber,
      studentAddressComplement: values.studentAddressComplement,
      studentNeighborhood: values.studentNeighborhood,
      studentCity: values.studentCity,
      studentState: values.studentState,
      studentPostalCode: values.studentPostalCode?.replace(/\D/g, ''),
      allowInstallments: values.allowInstallments,
      interestRate: parseFloat(values.interestRate || '0'),
      fine: parseFloat(values.fine || '0'),
    };
    
    // Se tiver um cliente Asaas selecionado, incluir o ID
    if (selectedAsaasCustomer) {
      Object.assign(enrollmentData, {
        asaasCustomerId: selectedAsaasCustomer.id
      });
    }
    
    createEnrollmentMutation.mutate(enrollmentData);
  };

  // Formatação de CPF
  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  // Formatação de telefone
  const formatPhone = (value: string) => {
    value = value.replace(/\D/g, '');
    if (value.length <= 10) {
      return value
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      return value
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
  };

  // Formatação de CEP
  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  };
  
  // Função para lidar com a seleção de cliente do Asaas
  const handleAsaasCustomerSelect = (customer: {
    id: string;
    name: string;
    email: string;
    cpfCnpj: string;
    mobilePhone?: string;
  }) => {
    setSelectedAsaasCustomer(customer);
    
    // Atualizar campos do formulário com os dados do cliente Asaas
    form.setValue('studentName', customer.name);
    form.setValue('studentEmail', customer.email);
    form.setValue('studentCpf', customer.cpfCnpj);
    
    if (customer.mobilePhone) {
      form.setValue('studentPhone', customer.mobilePhone);
    }
    
    // Exibir mensagem de sucesso
    toast({
      title: 'Cliente encontrado',
      description: 'Os dados do cliente foram preenchidos automaticamente.',
      variant: 'default',
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/crm/new-simplified-enrollments')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para lista
        </Button>
      </div>

      <div className="flex flex-col space-y-4 mb-6">
        <h1 className="text-2xl font-bold">Nova Matrícula Simplificada</h1>
        <p className="text-muted-foreground">
          Preencha os dados abaixo para criar uma nova matrícula simplificada.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Matrícula</CardTitle>
          <CardDescription>
            Informe os dados do aluno e do curso para criar a matrícula.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                  <TabsTrigger value="payment">Opções de Pagamento</TabsTrigger>
                  <TabsTrigger value="address">Endereço</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Dados do Aluno</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="studentName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo*</FormLabel>
                            <FormControl>
                              <AsaasCustomerSearch 
                                value={field.value} 
                                onChange={field.onChange}
                                onCustomerSelect={handleAsaasCustomerSelect}
                                placeholder="Digite o nome do aluno para buscar ou criar"
                                description="Digite para buscar alunos existentes no Asaas"
                                isRequired
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="studentEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail*</FormLabel>
                            <FormControl>
                              <Input placeholder="E-mail do aluno" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="studentCpf"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CPF*</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="CPF do aluno"
                                {...field}
                                value={formatCPF(field.value)}
                                maxLength={14}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="studentPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone*</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="(00) 00000-0000"
                                {...field}
                                value={formatPhone(field.value)}
                                maxLength={15}
                              />
                            </FormControl>
                            <FormDescription>
                              Formato: (XX) XXXXX-XXXX
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Dados do Curso</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="courseId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Curso*</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um curso" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {courses.map((course: any) => (
                                  <SelectItem key={course.id} value={course.id.toString()}>
                                    {course.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="institutionId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instituição*</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma instituição" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {institutions.map((institution: any) => (
                                  <SelectItem key={institution.id} value={institution.id.toString()}>
                                    {institution.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="poloId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Polo (opcional)</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um polo (opcional)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {polos.map((polo: any) => (
                                  <SelectItem key={polo.id} value={polo.id.toString()}>
                                    {polo.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor*</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Valor da matrícula"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9,.]/g, '');
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Informe o valor em reais (ex: 1200,00)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="payment" className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Opções de Pagamento</h3>
                    
                    <FormField
                      control={form.control}
                      name="billingType"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Forma de Pagamento</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="UNDEFINED" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Múltiplas opções (o aluno escolhe)
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="BOLETO" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Apenas Boleto
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="CREDIT_CARD" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Apenas Cartão de Crédito
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="PIX" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Apenas PIX
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="allowInstallments"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Permitir parcelamento
                            </FormLabel>
                            <FormDescription>
                              Permite que o aluno escolha pagar em parcelas
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    {form.watch("allowInstallments") && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="maxInstallmentCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número máximo de parcelas</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="12"
                                  min="1"
                                  max="24"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Máximo de parcelas permitidas (máx. 24)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="dueDateLimitDays"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prazo limite para pagamento (dias)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="30"
                                  min="1"
                                  max="365"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Número de dias para vencimento do pagamento
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                          className="col-span-full"
                        >
                          {showAdvancedOptions ? "Ocultar" : "Mostrar"} Opções Avançadas
                        </Button>
                        
                        {showAdvancedOptions && (
                          <>
                            <FormField
                              control={form.control}
                              name="interestRate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Taxa de juros (%)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      max="5"
                                      placeholder="0"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Taxa de juros mensal (%) para atraso
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="fine"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Multa por atraso (%)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      max="10"
                                      placeholder="0"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Percentual de multa por atraso (%)
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="address" className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Endereço do Aluno</h3>
                    <FormDescription className="mb-4">
                      <strong>Todos os campos de endereço são completamente opcionais.</strong> O Asaas não exige esses dados para o cadastro básico do cliente, mas fornecer essas informações pode facilitar processos futuros.
                    </FormDescription>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="studentPostalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CEP</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="00000-000"
                                {...field}
                                value={formatCEP(field.value || '')}
                                maxLength={9}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="studentAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Endereço</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Rua, Avenida, etc."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="studentAddressNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Número"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="studentAddressComplement"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Complemento</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Apto, Bloco, etc."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="studentNeighborhood"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bairro</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Bairro"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="studentCity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cidade</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Cidade"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="studentState"
                        render={({ field }) => (
                          <FormItem className="col-span-1">
                            <FormLabel>Estado</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o estado" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="AC">Acre</SelectItem>
                                <SelectItem value="AL">Alagoas</SelectItem>
                                <SelectItem value="AP">Amapá</SelectItem>
                                <SelectItem value="AM">Amazonas</SelectItem>
                                <SelectItem value="BA">Bahia</SelectItem>
                                <SelectItem value="CE">Ceará</SelectItem>
                                <SelectItem value="DF">Distrito Federal</SelectItem>
                                <SelectItem value="ES">Espírito Santo</SelectItem>
                                <SelectItem value="GO">Goiás</SelectItem>
                                <SelectItem value="MA">Maranhão</SelectItem>
                                <SelectItem value="MT">Mato Grosso</SelectItem>
                                <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                                <SelectItem value="MG">Minas Gerais</SelectItem>
                                <SelectItem value="PA">Pará</SelectItem>
                                <SelectItem value="PB">Paraíba</SelectItem>
                                <SelectItem value="PR">Paraná</SelectItem>
                                <SelectItem value="PE">Pernambuco</SelectItem>
                                <SelectItem value="PI">Piauí</SelectItem>
                                <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                                <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                                <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                                <SelectItem value="RO">Rondônia</SelectItem>
                                <SelectItem value="RR">Roraima</SelectItem>
                                <SelectItem value="SC">Santa Catarina</SelectItem>
                                <SelectItem value="SP">São Paulo</SelectItem>
                                <SelectItem value="SE">Sergipe</SelectItem>
                                <SelectItem value="TO">Tocantins</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/crm/new-simplified-enrollments')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Criar Matrícula
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}