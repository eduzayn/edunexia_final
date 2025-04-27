import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import NavbarMain from "@/components/layout/navbar-main";
import FooterMain from "@/components/layout/footer-main";
import { PageTransition } from "@/components/ui/page-transition";

// Schema de validação para o formulário de cadastro
const registrationSchema = z.object({
  name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
  confirmPassword: z.string(),
  phone: z.string().min(10, "Telefone inválido"),
  instituitionType: z.enum(["school", "college", "university", "company", "polo", "other"]),
  document: z.string().min(11, "CPF/CNPJ inválido"),
  documentType: z.enum(["cpf", "cnpj"]),
  plan: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "Você deve aceitar os termos de uso",
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

export default function RegisterPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      instituitionType: "school",
      document: "",
      documentType: "cnpj",
      termsAccepted: false,
    },
  });

  async function onSubmit(data: RegistrationFormValues) {
    setIsSubmitting(true);
    try {
      // Formato dos dados para envio à API
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        instituitionType: data.instituitionType,
        document: data.document.replace(/[^\d]/g, ""), // Remove caracteres não numéricos
        documentType: data.documentType,
        plan: data.plan || null,
      };

      const response = await apiRequest("/api/public/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Verifique seu email para ativar sua conta.",
      });

      setLocation('/registration-success');
    } catch (error: any) {
      console.error("Erro durante o cadastro:", error);
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro durante o cadastro. Por favor, tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavbarMain />
      
      <main className="flex-grow pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <PageTransition>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Cadastro da Instituição</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Informações da Instituição</h3>
                      
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome da Instituição</FormLabel>
                            <FormControl>
                              <Input placeholder="Digite o nome da instituição" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="documentType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Documento</FormLabel>
                              <ToggleGroup
                                type="single"
                                value={field.value}
                                onValueChange={(value) => {
                                  if (value) field.onChange(value as "cpf" | "cnpj");
                                }}
                                className="justify-start"
                              >
                                <ToggleGroupItem value="cpf">CPF</ToggleGroupItem>
                                <ToggleGroupItem value="cnpj">CNPJ</ToggleGroupItem>
                              </ToggleGroup>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="document"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {form.watch("documentType") === "cpf" ? "CPF" : "CNPJ"}
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder={
                                    form.watch("documentType") === "cpf" 
                                      ? "Digite o CPF" 
                                      : "Digite o CNPJ"
                                  }
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="instituitionType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Instituição</FormLabel>
                            <Select 
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo de instituição" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="school">Escola</SelectItem>
                                <SelectItem value="college">Faculdade</SelectItem>
                                <SelectItem value="university">Universidade</SelectItem>
                                <SelectItem value="company">Empresa</SelectItem>
                                <SelectItem value="polo">Polo Educacional</SelectItem>
                                <SelectItem value="other">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Selecione o tipo que melhor descreve sua instituição
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Informações de Contato</h3>
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="Digite o email institucional" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Este email será usado para acessar a plataforma
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="(00) 00000-0000" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Credenciais de Acesso</h3>
                      
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showPassword ? "text" : "password"} 
                                  placeholder="Digite sua senha"
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <EyeOffIcon className="h-4 w-4" />
                                  ) : (
                                    <EyeIcon className="h-4 w-4" />
                                  )}
                                  <span className="sr-only">
                                    {showPassword ? "Esconder senha" : "Mostrar senha"}
                                  </span>
                                </Button>
                              </div>
                            </FormControl>
                            <FormDescription>
                              Mínimo de 8 caracteres
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showConfirmPassword ? "text" : "password"} 
                                  placeholder="Confirme sua senha"
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                  {showConfirmPassword ? (
                                    <EyeOffIcon className="h-4 w-4" />
                                  ) : (
                                    <EyeIcon className="h-4 w-4" />
                                  )}
                                  <span className="sr-only">
                                    {showConfirmPassword ? "Esconder senha" : "Mostrar senha"}
                                  </span>
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <FormField
                      control={form.control}
                      name="termsAccepted"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Aceito os Termos de Uso e Política de Privacidade
                            </FormLabel>
                            <FormDescription>
                              Ao marcar esta caixa, você concorda com nossos <a href="/terms" className="text-primary hover:underline">Termos de Uso</a> e <a href="/privacy" className="text-primary hover:underline">Política de Privacidade</a>.
                            </FormDescription>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="w-full" 
                        size="lg" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Processando..." : "Finalizar Cadastro"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex flex-col text-sm text-muted-foreground">
                <p>Já possui uma conta? <a href="/autenticacao/auth-page" className="text-primary hover:underline">Faça login</a></p>
                
                <p className="mt-8">Todas as informações pessoais fornecidas durante o cadastro serão tratadas de acordo com a nossa Política de Privacidade e com a Lei Geral de Proteção de Dados (LGPD). Ao se cadastrar, você consente com a coleta, armazenamento e processamento dos seus dados pessoais para os fins específicos de prestação dos serviços educacionais e funcionalidades da plataforma.</p>
              </CardFooter>
            </Card>

            <div className="mt-10 bg-muted p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Política de Privacidade - Resumo</h3>
              
              <div className="space-y-4 text-sm">
                <p><strong>Coleta de Dados:</strong> A Edunexia coleta informações pessoais durante o cadastro na plataforma, incluindo nome, e-mail, telefone, endereço e dados de acesso. Também podemos coletar informações sobre como você utiliza a plataforma, incluindo dados de acesso, interações e preferências.</p>
                
                <p><strong>Uso dos Dados:</strong> As informações coletadas são utilizadas para fornecer, manter e melhorar nossos serviços educacionais, processar transações, enviar comunicações relevantes, personalizar sua experiência e cumprir obrigações legais.</p>
                
                <p><strong>Proteção de Dados:</strong> Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição não autorizada.</p>
                
                <p><strong>Seus Direitos:</strong> Você tem o direito de acessar, corrigir, atualizar ou solicitar a exclusão de seus dados pessoais a qualquer momento, conforme previsto na LGPD.</p>
                
                <p><strong>Contato:</strong> Para questões relacionadas à privacidade de seus dados, entre em contato conosco pelo e-mail: privacidade@edunexia.com.br</p>
              </div>
            </div>
          </PageTransition>
        </div>
      </main>
      
      <FooterMain />
    </div>
  );
} 