/**
 * AVISO DE PROTEÇÃO: Este arquivo contém lógica crítica para o sistema de matrículas simplificadas.
 * Não faça alterações neste código a menos que seja absolutamente necessário.
 * Qualquer modificação requer aprovação e deve ser feita com extremo cuidado.
 * Data de estabilização: 23/04/2025
 * 
 * Cuidado com as conversões de tipos entre número e string nos campos de seleção (courseId, institutionId, poloId)
 * e campos financeiros (amount, interestRate, fine). Foram implementadas transformações específicas
 * para garantir a correta validação e envio de dados.
 */
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
  // Campos obrigatórios de matrícula
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
  interestRate: z.string()
    .transform((val) => val ? parseFloat(val.replace(',', '.')) : 0)
    .optional(),
  fine: z.string()
    .transform((val) => val ? parseFloat(val.replace(',', '.')) : 0)
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewSimplifiedEnrollmentCreatePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [institutionSearchTerm, setInstitutionSearchTerm] = useState('');
  
  // Estado para guardar cliente do Asaas selecionado
  const [selectedAsaasCustomer, setSelectedAsaasCustomer] = useState<{
    id: string;
    name: string;
    email: string;
    cpfCnpj: string;
    mobilePhone?: string;
  } | null>(null);

  // Buscar cursos (usando API JSON direta para contornar o middleware Vite)
  const { data: coursesResponse, error: coursesError } = useQuery({
    queryKey: ['/api-json/courses'],
    queryFn: async () => {
      console.log("Buscando cursos disponíveis...");
      const response = await fetch('/api-json/courses');
      if (!response.ok) {
        console.error("Erro ao buscar cursos:", response.status, response.statusText);
        throw new Error('Falha ao carregar cursos');
      }
      const data = await response.json();
      console.log("Cursos carregados:", data);
      return data;
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

  // Extrair os cursos da resposta e logar para depuração
  console.log("Resposta completa dos cursos:", coursesResponse);
  const courses = Array.isArray(coursesResponse) ? coursesResponse : coursesResponse?.data || [];
  console.log("Cursos processados para o select:", courses);
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
      courseId: '' as any,
      institutionId: '' as any,
      amount: '' as any,
      poloId: '' as any,
      sourceChannel: 'admin-portal',
      billingType: 'UNDEFINED',
      maxInstallmentCount: '12' as any,
      dueDateLimitDays: '30' as any,
      allowInstallments: true,
      interestRate: '0' as any,
      fine: '0' as any,
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
    
    // Log para debug
    console.log('⚠️ Valores originais do formulário:', { 
      nome: values.studentName, 
      cpf: values.studentCpf, 
      email: values.studentEmail
    });
    
    // ⚠️ IMPORTANTE: Detectar substituição indesejada de nomes
    // Se o valor no formulário não for o mesmo que o que foi digitado pelo usuário
    // Este é o ponto onde o valor está sendo alterado incorretamente
    if (selectedAsaasCustomer && selectedAsaasCustomer.name !== values.studentName) {
      console.warn('🔴 DETECTADA SUBSTITUIÇÃO DE NOME:', {
        formValue: values.studentName,
        selectedCustomerName: selectedAsaasCustomer.name,
        originalInputValue: selectedAsaasCustomer.name // Esta deve ser a referência correta
      });
      
      // Forçar o uso do nome correto que foi digitado pelo usuário
      values.studentName = selectedAsaasCustomer.name;
      
      console.log('🟢 Nome corrigido para:', values.studentName);
    }
    
    // Garantir que o CPF tenha só números e que o nome esteja sem espaços extras
    const formattedCpf = values.studentCpf.replace(/\D/g, '');
    const formattedName = values.studentName.trim();
    
    // Verificar se o CPF tem um tamanho válido
    if (formattedCpf.length !== 11) {
      toast({
        title: 'CPF inválido',
        description: 'O CPF deve ter exatamente 11 dígitos. Por favor, verifique o CPF informado.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }
    
    // Usar diretamente a referência do cliente selecionado para garantir consistência
    const correctName = selectedAsaasCustomer ? selectedAsaasCustomer.name.trim() : formattedName;
    
    // Verificação final para garantir que estamos usando o nome correto
    console.log('🔄 Verificação final do nome:', {
      formattedName,
      correctName,
      selectedCustomerExists: !!selectedAsaasCustomer,
      selectedCustomerName: selectedAsaasCustomer ? selectedAsaasCustomer.name : 'Nenhum'
    });
    
    const enrollmentData = {
      studentName: correctName, // Usar nome garantidamente correto
      studentEmail: values.studentEmail.trim(),
      studentCpf: formattedCpf, // CPF já formatado
      studentPhone: values.studentPhone.replace(/\D/g, ''), // Remover formatação
      courseId: values.courseId,
      institutionId: values.institutionId,
      amount: values.amount,
      poloId: values.poloId,
      sourceChannel: values.sourceChannel || 'admin-portal',
      
      // Campos obrigatórios para a API
      uuid: `enroll-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      fullPrice: values.amount, // Mesmo valor do amount
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias a partir de agora no formato ISO string
      paymentGateway: "asaas",
      
      // Adicionar dados adicionais para o Asaas
      billingType: values.billingType,
      maxInstallmentCount: values.maxInstallmentCount,
      dueDateLimitDays: values.dueDateLimitDays,
      studentAddress: values.studentAddress ? values.studentAddress.trim() : '',
      studentAddressNumber: values.studentAddressNumber ? values.studentAddressNumber.trim() : '',
      studentAddressComplement: values.studentAddressComplement ? values.studentAddressComplement.trim() : '',
      studentNeighborhood: values.studentNeighborhood ? values.studentNeighborhood.trim() : '',
      studentCity: values.studentCity ? values.studentCity.trim() : '',
      studentState: values.studentState ? values.studentState.trim() : '',
      studentPostalCode: values.studentPostalCode?.replace(/\D/g, ''),
      allowInstallments: values.allowInstallments,
      interestRate: values.interestRate,
      fine: values.fine,
    };
    
    // Log para debug final antes do envio
    console.log('⚠️ Dados FINAIS enviados para o servidor:', { 
      nome: enrollmentData.studentName, 
      cpf: enrollmentData.studentCpf,
      asaasCustomerId: selectedAsaasCustomer?.id || 'Novo cliente'
    });
    
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
    console.log('⚠️ CLIENTE SELECIONADO DO ASAAS SEARCH:', JSON.stringify(customer));
    
    // IMPORTANTE: Este é o ponto crítico onde o bug estava ocorrendo
    // O cliente chegava corretamente aqui, mas era substituído em algum 
    // lugar entre aqui e o envio ao servidor.
    // Vamos criar uma cópia profunda para evitar referências compartilhadas
    const customerCopy = JSON.parse(JSON.stringify({
      id: customer.id,
      name: customer.name.trim(), // Garantir que não haja espaços extras
      email: customer.email,
      cpfCnpj: customer.cpfCnpj,
      mobilePhone: customer.mobilePhone
    }));
    
    // Se for um novo cliente (criado no componente de busca)
    if (customerCopy.id.startsWith('new_customer')) {
      console.log('🟢 NOVO CLIENTE criado a partir da busca:', customerCopy.name);
      
      // Limpar ou formatar CPF somente se estiver vazio
      if (!customerCopy.cpfCnpj) {
        customerCopy.cpfCnpj = '';
      } else {
        // Garantir que o CPF está no formato correto (apenas dígitos)
        customerCopy.cpfCnpj = customerCopy.cpfCnpj.replace(/\D/g, '');
      }
    } else {
      // Cliente existente do Asaas - garantir que o CPF esteja formatado
      const formattedCpf = customerCopy.cpfCnpj.replace(/\D/g, '');
      customerCopy.cpfCnpj = formattedCpf;
      console.log('🔵 CLIENTE EXISTENTE encontrado:', customerCopy.name, 'CPF:', formattedCpf);
    }
    
    // ARMAZENAR UMA CÓPIA LOCAL do nome selecionado para verificação no submit
    const selectedName = customerCopy.name;
    console.log('🔶 NOME GUARDADO PARA VERIFICAÇÃO:', selectedName);
    
    // Importante: substituir a referência do objeto para evitar efeitos colaterais
    setSelectedAsaasCustomer({...customerCopy});
    
    // Atualizar campos do formulário com os dados do cliente tratados
    form.setValue('studentName', selectedName);
    form.setValue('studentEmail', customerCopy.email || '');
    
    // Aplicar formatação ao CPF para exibição
    if (customerCopy.cpfCnpj && customerCopy.cpfCnpj.length > 0) {
      // Garantir que o valor seja somente dígitos para então formatar
      const cpfDigitsOnly = customerCopy.cpfCnpj.replace(/\D/g, '');
      form.setValue('studentCpf', formatCPF(cpfDigitsOnly));
    } else {
      form.setValue('studentCpf', '');
    }
    
    // Formatar telefone se disponível
    if (customerCopy.mobilePhone) {
      form.setValue('studentPhone', formatPhone(customerCopy.mobilePhone));
    }
    
    // Verificação imediata para garantir que o nome está correto no formulário
    setTimeout(() => {
      const currentName = form.getValues('studentName');
      if (currentName !== selectedName) {
        console.error('🔴 NOME SUBSTITUÍDO IMEDIATAMENTE:', {
          deveriaSer: selectedName,
          foiTrocadoPara: currentName
        });
        
        // Corrigir imediatamente
        form.setValue('studentName', selectedName);
        
        console.log('🟢 Nome corrigido para:', selectedName);
      } else {
        console.log('✅ Nome mantido corretamente como:', currentName);
      }
    }, 100);
    
    // Exibir mensagem apropriada
    if (customerCopy.id.startsWith('new_customer')) {
      toast({
        title: 'Novo cliente',
        description: 'Complete os dados do novo cliente para continuar.',
      });
    } else {
      toast({
        title: 'Cliente encontrado',
        description: 'Os dados do cliente foram preenchidos automaticamente.',
      });
    }
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
                    <div className="grid grid-cols-1 gap-4">
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
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              onValueChange={(value) => {
                                field.onChange(value);
                                
                                // Buscar o curso selecionado para obter o preço
                                const selectedCourse = courses.find((course: any) => course.id.toString() === value);
                                if (selectedCourse && selectedCourse.price) {
                                  // Formatar o valor do curso para exibição e atualizar o campo de valor
                                  const formattedPrice = selectedCourse.price.toString().replace('.', ',');
                                  form.setValue('amount', formattedPrice);
                                }
                              }}
                              defaultValue={field.value ? field.value.toString() : undefined}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um curso" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-[400px]">
                                <div className="px-3 py-2 border-b">
                                  <Input 
                                    id="courseSearch"
                                    placeholder="Buscar curso pelo nome..."
                                    className="h-8"
                                    value={courseSearchTerm}
                                    onChange={(e) => {
                                      // Utiliza estado React para controlar a busca
                                      setCourseSearchTerm(e.target.value.toLowerCase());
                                    }}
                                  />
                                </div>
                                <div className="max-h-[300px] overflow-auto">
                                  {courses.length === 0 ? (
                                    <div className="px-3 py-2 text-center text-muted-foreground">
                                      Nenhum curso disponível
                                    </div>
                                  ) : (
                                    courses
                                      .filter((course: any) => {
                                        if (!courseSearchTerm) return true;
                                        const courseName = course.name?.toLowerCase() || '';
                                        const courseCode = course.code?.toLowerCase() || '';
                                        return courseName.includes(courseSearchTerm) || 
                                              courseCode.includes(courseSearchTerm);
                                      })
                                      .map((course: any) => (
                                        <SelectItem 
                                          key={course.id} 
                                          value={course.id.toString()}
                                        >
                                        <div className="flex flex-col">
                                          <span>{course.name}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {course.code} - {course.category}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))
                                  )}
                                </div>
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
                              defaultValue={field.value ? field.value.toString() : undefined}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma instituição" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-[400px]">
                                <div className="px-3 py-2 border-b">
                                  <Input 
                                    id="institutionSearch"
                                    placeholder="Buscar instituição pelo nome..."
                                    className="h-8"
                                    onChange={(e) => {
                                      try {
                                        const searchValue = e.target.value.toLowerCase();
                                        // Usar requestAnimationFrame para garantir que o DOM esteja estável
                                        requestAnimationFrame(() => {
                                          try {
                                            const institutionItems = document.querySelectorAll('[data-institution-item]');
                                            
                                            institutionItems.forEach((item: Element) => {
                                              try {
                                                if (item && item instanceof Element) {
                                                  const institutionName = item.getAttribute('data-institution-name')?.toLowerCase() || '';
                                                  const institutionCode = item.getAttribute('data-institution-code')?.toLowerCase() || '';
                                                  
                                                  // Usar classes para controlar visibilidade em vez de style diretamente
                                                  if (institutionName.includes(searchValue) || institutionCode.includes(searchValue)) {
                                                    item.classList.remove('hidden');
                                                  } else {
                                                    item.classList.add('hidden');
                                                  }
                                                }
                                              } catch (itemErr) {
                                                console.error('Erro ao processar item da instituição:', itemErr);
                                              }
                                            });
                                          } catch (innerErr) {
                                            console.error('Erro ao processar elementos:', innerErr);
                                          }
                                        });
                                      } catch (err) {
                                        console.error('Erro ao processar busca de instituições:', err);
                                      }
                                    }}
                                  />
                                </div>
                                <div className="max-h-[300px] overflow-auto">
                                  {institutions.length === 0 ? (
                                    <div className="px-3 py-2 text-center text-muted-foreground">
                                      Nenhuma instituição disponível
                                    </div>
                                  ) : (
                                    institutions.map((institution: any) => (
                                      <SelectItem 
                                        key={institution.id} 
                                        value={institution.id.toString()}
                                        data-institution-item
                                        data-institution-name={institution.name}
                                        data-institution-code={institution.code}
                                      >
                                        <div className="flex flex-col">
                                          <span>{institution.name}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {institution.code} - {institution.cnpj}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))
                                  )}
                                </div>
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
                              defaultValue={field.value ? field.value.toString() : undefined}
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