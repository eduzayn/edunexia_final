import { createContext, ReactNode, useContext, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser, LoginData } from "@shared/schema";
// Interface para a resposta da API de login
interface LoginResponse {
  success: boolean;
  token: string;
  id: number;
  username: string;
  fullName: string;
  email: string;
  portalType: string;
  role: string;
  [key: string]: any; // Permite campos adicionais
}
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { buildApiUrl } from "../lib/api-config";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { getNavigationPath } from "../lib/url-utils";

// Definir as rotas da API para padronizar todas as chamadas
// Note: Todas as rotas devem usar caminhos relativos sem domínio, para funcionar em produção
// Mudamos de volta para /api/ pois agora temos handlers específicos para produção
const API_ROUTES = {
  LOGIN: "/api/login", 
  LOGOUT: "/api/logout",
  USER: "/api/user",
  REGISTER: "/api/register"
};

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<LoginResponse, Error, LoginData>;
  logoutMutation: UseMutationResult<{}, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

// Cria um contexto de autenticação com valores padrão para evitar o erro de null
const defaultLoginMutation = {
  mutate: () => {},
  mutateAsync: async () => ({} as SelectUser),
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null,
  data: null,
  status: "idle",
  failureCount: 0,
  failureReason: null,
  reset: () => {},
  context: undefined,
  variables: undefined,
  isIdle: true,
  isLoading: false,
};

const defaultLogoutMutation = {
  mutate: () => {},
  mutateAsync: async () => ({} as any),
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null,
  data: null,
  status: "idle",
  failureCount: 0,
  failureReason: null,
  reset: () => {},
  context: undefined,
  variables: undefined,
  isIdle: true,
  isLoading: false,
};

const defaultRegisterMutation = {
  mutate: () => {},
  mutateAsync: async () => ({} as SelectUser),
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null,
  data: null,
  status: "idle",
  failureCount: 0,
  failureReason: null,
  reset: () => {},
  context: undefined,
  variables: undefined,
  isIdle: true,
  isLoading: false,
};

const defaultAuthContext: AuthContextType = {
  user: null,
  isLoading: false,
  error: null,
  loginMutation: defaultLoginMutation as unknown as UseMutationResult<LoginResponse, Error, LoginData>,
  logoutMutation: defaultLogoutMutation as unknown as UseMutationResult<{}, Error, void>,
  registerMutation: defaultRegisterMutation as unknown as UseMutationResult<SelectUser, Error, InsertUser>,
};

export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  // Verificar primeiro se há um token disponível antes de fazer a consulta
  // Isso reduz as chamadas desnecessárias ao servidor
  const hasToken = !!localStorage.getItem('auth_token');
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: [API_ROUTES.USER],
    queryFn: getQueryFn({ on401: "returnNull" }),
    // Não executar a consulta se não houver token disponível
    enabled: hasToken,
  });

  const [, setLocation] = useLocation();
  
  const loginMutation = useMutation<LoginResponse, Error, LoginData>({
    mutationFn: async (credentials: LoginData) => {
      // Garantir que o portalType esteja presente na requisição
      const data = { ...credentials };
      console.log("Tentando login como " + credentials.username + " com portalType:", data.portalType);
      console.log("Enviando requisição de login com portalType:", data.portalType);
      
      // Limpar o cache de usuário antes de tentar o login
      // para evitar conflitos de estado entre logins
      queryClient.removeQueries({ queryKey: [API_ROUTES.USER] });
      
      // Limpar token antigo se existir para garantir um login limpo
      localStorage.removeItem('auth_token');
      
      try {
        // Simplificamos a chamada para evitar erros de tipo
        let response;
        
        // API em ambiente de produção - Usando buildApiUrl para obter a URL completa
        const loginUrl = buildApiUrl(API_ROUTES.LOGIN);
        console.log("Fazendo requisição de login para:", loginUrl);
        
        // Configuração otimizada para requisição de login
        const loginConfig: RequestInit = {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data),
          // Configurações para melhorar performance
          cache: 'no-store' as RequestCache, 
          credentials: 'same-origin',
          mode: 'cors',
          keepalive: true // Garantir que a requisição seja completada mesmo se a página for fechada
        };
        
        // Implementar mecanismo de retry para login
        const MAX_RETRIES = 2;
        let retryCount = 0;
        let lastError = null;
        
        while (retryCount <= MAX_RETRIES) {
          try {
            if (retryCount > 0) {
              console.log(`Tentativa ${retryCount} de login...`);
            }
            
            response = await fetch(loginUrl, loginConfig);
            break; // Se chegou aqui, o fetch foi bem-sucedido
          } catch (fetchError) {
            lastError = fetchError;
            retryCount++;
            
            if (retryCount <= MAX_RETRIES) {
              // Esperar um pouco antes de tentar novamente (backoff exponencial)
              const delay = Math.pow(2, retryCount) * 500; // 1s, 2s
              console.log(`Erro de rede no login, tentando novamente em ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        
        // Se após todas as tentativas ainda temos erro, lançar a exceção
        if (!response) {
          throw lastError || new Error("Não foi possível conectar ao servidor após múltiplas tentativas");
        }
        
        // Verificar o tipo de conteúdo antes de tentar parsear como JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Resposta não-JSON do servidor:', await response.text());
          throw new Error('Resposta do servidor não está no formato JSON');
        }
        
        try {
          return await response.json();
        } catch (error) {
          console.error('Erro ao parsear resposta como JSON:', error);
          throw new Error('Formato de resposta inválido');
        }
      } catch (error) {
        console.error('Erro durante requisição de login:', error);
        throw error;
      }
    },
    onSuccess: async (response) => {
      // Salvar o token no localStorage
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
        console.log("Token salvo no localStorage:", response.token);
      }
      
      // Extrair os campos necessários para criar um objeto SelectUser a partir da resposta
      const user = {
        id: response.id,
        username: response.username,
        fullName: response.fullName,
        email: response.email,
        portalType: response.portalType,
        password: "", // Não armazenamos a senha no objeto de usuário
        role: response.role,
        cpf: null,
        phone: null,
        address: null,
        city: null,
        state: null,
        zipCode: null,
        birthDate: null,
        poloId: null,
        asaasId: null
      } as unknown as SelectUser;
      
      // Atualizar o cache do usuário com os dados mais recentes
      // Isso evita uma chamada de rede adicional ao servidor
      queryClient.setQueryData([API_ROUTES.USER], user);
      
      // Adicionar logs para debug
      console.log("Login bem-sucedido. Dados do usuário:", user);
      console.log("Portal type:", user.portalType);
      
      // Mostrar mensagem de sucesso antes de redirecionar
      toast({
        title: "Login bem-sucedido",
        description: `Bem-vindo(a) de volta, ${user.fullName}!`,
      });

      console.log("Login bem-sucedido, redirecionando para dashboard administrativo");
      // Forçar o redirecionamento para o dashboard
      if (user.portalType) {
        // Redirecionar diretamente sem recarregar página completa, mais rápido
        setTimeout(() => {
          window.location.replace(`/${user.portalType}/dashboard`);
        }, 100); // Pequeno timeout para garantir que o toast apareça
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no login",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      // Usando buildApiUrl para construir a URL correta
      const registerUrl = buildApiUrl(API_ROUTES.REGISTER);
      console.log("Fazendo requisição de registro para:", registerUrl);
      
      // Usando fetch diretamente
      const response = await fetch(registerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(credentials)
      });
      return await response.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData([API_ROUTES.USER], user);
      toast({
        title: "Registro bem-sucedido",
        description: `Bem-vindo(a), ${user.fullName}!`,
      });

      // Redirect to the appropriate dashboard usando setLocation
      if (user.portalType) {
        setLocation(getNavigationPath(`/${user.portalType}/dashboard`));
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log("Executando logout - mutationFn");
      // Usando buildApiUrl para construir a URL correta
      const logoutUrl = buildApiUrl(API_ROUTES.LOGOUT);
      console.log("Fazendo requisição de logout para:", logoutUrl);
      
      // Usando fetch diretamente
      const response = await fetch(logoutUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      // Limpar todos os dados em cache para evitar problemas de persistência
      queryClient.clear();
      return {};
    },
    onSuccess: () => {
      console.log("Logout bem-sucedido - onSuccess");
      
      // Remover o token do localStorage
      localStorage.removeItem('auth_token');
      
      // Definir explicitamente o usuário como null no cache
      queryClient.setQueryData([API_ROUTES.USER], null);
      
      // Notificar o usuário
      toast({
        title: "Logout bem-sucedido",
        description: "Você foi desconectado com sucesso.",
      });
      
      // Redirecionar para a página inicial
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no logout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}