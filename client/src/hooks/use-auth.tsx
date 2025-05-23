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
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { getNavigationPath } from "../lib/url-utils";

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
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api-json/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
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
      queryClient.removeQueries({ queryKey: ["/api-json/user"] });
      
      const response = await apiRequest("POST", "/api-json/login", data);
      return await response.json();
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
        poloId: null
      } as SelectUser;
      
      // Atualizar o cache do usuário com os dados mais recentes
      queryClient.setQueryData(["/api-json/user"], user);
      
      // Forçar uma invalidação do cache para garantir que temos os dados mais recentes
      await queryClient.invalidateQueries({ queryKey: ["/api-json/user"] });
      
      // Adicionar logs para debug
      console.log("Login bem-sucedido. Dados do usuário:", user);
      console.log("Portal type:", user.portalType);
      
      toast({
        title: "Login bem-sucedido",
        description: `Bem-vindo(a) de volta, ${user.fullName}!`,
      });

      console.log("Login bem-sucedido, redirecionando para dashboard administrativo");
      // Forçar o redirecionamento para o dashboard
      if (user.portalType) {
        window.location.href = `/${user.portalType}/dashboard`;
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
      const response = await apiRequest("POST", "/api-json/register", credentials);
      return await response.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api-json/user"], user);
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
      const response = await apiRequest("POST", "/api-json/logout");
      
      // Limpar todos os dados em cache para evitar problemas de persistência
      queryClient.clear();
      return {};
    },
    onSuccess: () => {
      console.log("Logout bem-sucedido - onSuccess");
      
      // Remover o token do localStorage
      localStorage.removeItem('auth_token');
      
      // Definir explicitamente o usuário como null no cache
      queryClient.setQueryData(["/api-json/user"], null);
      
      // Notificar o usuário
      toast({
        title: "Logout bem-sucedido",
        description: "Você foi desconectado com sucesso.",
      });
      
      // Forçar limpeza do sessionStorage/localStorage
      if (typeof window !== 'undefined') {
        try {
          // Limpar quaisquer dados armazenados localmente que possam interferir
          sessionStorage.clear();
          localStorage.removeItem('queryClient');
          localStorage.removeItem('auth_token'); // Remover o token de autenticação
        } catch (e) {
          console.error("Erro ao limpar storage:", e);
        }
      }
      
      // Redirecionar para a página de login após o logout
      window.location.href = '/auth'; 
    },
    onError: (error: Error) => {
      console.error("Erro ao fazer logout:", error);
      
      toast({
        title: "Falha no logout",
        description: error.message,
        variant: "destructive",
      });
      
      // Em caso de erro, tentar forçar o logout de qualquer maneira
      queryClient.setQueryData(["/api-json/user"], null);
      queryClient.clear();
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