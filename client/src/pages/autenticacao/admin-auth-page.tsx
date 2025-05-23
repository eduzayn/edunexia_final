import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useLocation } from "wouter";
import { SchoolIcon, ShieldIcon } from "@/components/ui/icons";
import { queryClient } from "@/lib/queryClient";
import { Eye, EyeOff } from "lucide-react";

// Form schema
const loginSchema = z.object({
  username: z.string().min(3, "Nome de usuário é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminAuthPage() {
  const { user, loginMutation, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  
  // Efeito para verificar e limpar qualquer autenticação existente
  useEffect(() => {
    const prepareAuthState = async () => {
      if (user) {
        try {
          console.log("Usuário já autenticado, fazendo logout para limpar estado do portal admin");
          
          // Limpar cache e fazer logout se o usuário já estiver autenticado
          await logoutMutation.mutateAsync();
          
          // Limpar todas as queries em cache para garantir um estado limpo
          queryClient.removeQueries();
          
          console.log("Autenticação anterior limpa com sucesso");
        } catch (error) {
          console.error("Erro ao limpar autenticação anterior:", error);
        }
      }
    };
    
    prepareAuthState();
  }, []);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    console.log("Tentando login como admin com portalType:", "admin");
    
    try {
      // Mantemos o username exatamente como foi digitado pelo usuário
      await loginMutation.mutateAsync({
        username: data.username,
        password: data.password,
        portalType: "admin",
      });
      
      // Login bem-sucedido, vamos esperar os dados serem atualizados antes de navegar
      console.log("Login bem-sucedido, redirecionando para dashboard administrativo");
      
      // O redirecionamento agora é feito diretamente pela função de login
      // que usa window.location.href para garantir um redirecionamento completo
      // Isso evita problemas com o estado de autenticação no navegador
    } catch (error) {
      console.error("Erro no login:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Auth Form Column */}
      <div className="flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:w-1/2 xl:w-2/5">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-6">
            <Link to="/" className="flex items-center text-2xl font-bold text-primary">
              <SchoolIcon className="h-8 w-8 mr-2" />
              EdunexIA
            </Link>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Acesso ao Portal Administrativo
            </h2>
            <div className="mt-4 flex items-center">
              <div className="flex items-center justify-center rounded-full h-12 w-12 text-[#3451B2] bg-blue-100">
                <ShieldIcon className="h-8 w-8" />
              </div>
              <p className="ml-4 text-gray-600">
                Área restrita para administradores do sistema.
              </p>
            </div>
          </div>

          <div className="mb-6">
            <div className="p-4 border border-blue-100 rounded-md bg-blue-50">
              <p className="text-sm text-blue-800">
                <strong>Área restrita.</strong> Acesso permitido somente para administradores autorizados do sistema. Esta área fornece controle total sobre a plataforma.
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuário</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="superadmin" 
                        {...field} 
                      />
                    </FormControl>
                    <div className="text-xs text-blue-600 mt-1">
                      <strong>Dica:</strong> Use "superadmin" como nome de usuário ou seu e-mail completo
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••" 
                          {...field} 
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showPassword ? "Ocultar senha" : "Mostrar senha"}
                        </span>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">Lembrar-me</FormLabel>
                    </FormItem>
                  )}
                />
                
                <Button 
                  variant="link" 
                  className="p-0 text-sm text-primary hover:text-primary-dark"
                >
                  Esqueceu a senha?
                </Button>
              </div>
              
              <Button 
                type="submit" 
                variant="primaryLight"
                className="w-full" 
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Entrando..." : "Entrar"}
              </Button>
              
              <p className="text-center text-xs text-gray-500 mt-2">
                Esta área é exclusiva para administradores.{" "}
                <Button 
                  variant="link" 
                  className="p-0 text-xs" 
                  onClick={() => navigate("/portal-selection")}
                >
                  Voltar para seleção de portal
                </Button>
              </p>
            </form>
          </Form>
        </div>
      </div>
      
      {/* Hero Image/Content Column */}
      <div className="hidden lg:block relative lg:w-1/2 xl:w-3/5">
        <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-[#1E3A8A] to-[#3451B2]">
          <div className="flex flex-col justify-center items-center h-full px-12 text-white">
            <div className="max-w-md text-center">
              <ShieldIcon className="h-16 w-16 mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">
                Portal Administrativo EdunexIA
              </h2>
              <p className="text-lg mb-8">
                Acesso centralizado para a administração completa da plataforma educacional. 
                Controle de usuários, instituições, cursos e toda a infraestrutura do sistema.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-left">
                  <h3 className="font-bold mb-2">Administração Central</h3>
                  <p className="text-sm opacity-90">Controle total sobre a plataforma e seus subsistemas.</p>
                </div>
                <div className="text-left">
                  <h3 className="font-bold mb-2">Banco de Dados Mestre</h3>
                  <p className="text-sm opacity-90">Gestão dos dados que alimentam todos os portais.</p>
                </div>
                <div className="text-left">
                  <h3 className="font-bold mb-2">Relatórios e Análises</h3>
                  <p className="text-sm opacity-90">Acesso a informações e métricas de todos os portais.</p>
                </div>
                <div className="text-left">
                  <h3 className="font-bold mb-2">Configurações Avançadas</h3>
                  <p className="text-sm opacity-90">Controle das permissões e regras de todo o sistema.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}