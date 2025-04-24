import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { formatApiPath } from "./api-config";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Função para fazer requisições à API com tipagem
 * @param url URL da requisição
 * @param requestOptions Opções da requisição (method, data, etc.)
 * @returns Resposta convertida para o tipo T
 */
// Importando funções auxiliares para normalização de URL
import { normalizeUrl } from "./api-vercel-fix";

export async function apiRequest(
  url: string,
  requestOptions: { method?: string; data?: unknown; headers?: Record<string, string> } = {}
): Promise<Response> {
  // Em produção, forçamos URLs relativas para evitar o problema de domínio completo
  const isProd = import.meta.env.PROD;
  
  // Log para debug em produção
  if (isProd) {
    console.log(`apiRequest - URL original: ${url}`);
  }
  
  // Normalizar a URL antes de passar para formatApiPath para evitar barras duplas
  const normalizedUrl = normalizeUrl(url);
  
  // Usar formatApiPath para garantir URL relativa em produção
  const apiUrl = formatApiPath(normalizedUrl);
  
  // Log para debug em produção
  if (isProd) {
    console.log(`apiRequest - URL final formatada: ${apiUrl}`);
  }
  
  const token = localStorage.getItem("auth_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(requestOptions.headers || {}),
  };

  if (token) {
    console.log("Token de autenticação recuperado do localStorage:", "Sim");
    headers["Authorization"] = `Bearer ${token}`;
    console.log("Authorization Header definido:", headers["Authorization"]);
  } else {
    console.log("Token de autenticação recuperado do localStorage:", "Não");
  }

  const requestMethod = requestOptions.method || "GET";
  const fetchOptions: RequestInit = {
    method: requestMethod,
    headers,
  };

  if (requestOptions.data) {
    fetchOptions.body = JSON.stringify(requestOptions.data);
  }

  try {
    console.log(`Realizando requisição ${requestMethod} para ${apiUrl}`, fetchOptions);
    const response = await fetch(apiUrl, fetchOptions);
    console.log(`Resposta da requisição ${requestMethod} para ${apiUrl}: ${response.status}`);

    // Adiciona verificação para debug em caso de erro
    if (!response.ok) {
      console.warn(`Requisição ${requestMethod} para ${apiUrl} falhou com status ${response.status}`);

      try {
        // Tentar ler o corpo da resposta para debug
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorBody = await response.clone().json();
          console.error("Corpo da resposta de erro:", errorBody);
        } else {
          const errorText = await response.clone().text();
          console.error("Resposta de erro (não JSON):", errorText.substring(0, 500));
        }
      } catch (readError) {
        console.error("Erro ao ler corpo da resposta:", readError);
      }
    }

    return response;
  } catch (error) {
    console.error(`Erro na requisição ${requestMethod} para ${apiUrl}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Em produção, forçamos URLs relativas para evitar o problema de domínio completo
    const isProd = import.meta.env.PROD;
    
    // Log para debug em produção
    if (isProd) {
      console.log(`getQueryFn - URL original: ${queryKey[0]}`);
    }
    
    // Normalizar a URL primeiro
    const normalizedUrl = normalizeUrl(queryKey[0] as string);
    
    // Formatar URL com formatApiPath para garantir URLs relativas em produção
    const apiUrl = formatApiPath(normalizedUrl);
    
    // Log para debug em produção
    if (isProd) {
      console.log(`getQueryFn - URL final formatada: ${apiUrl}`);
    }
    
    // Log para debug
    console.log(`QueryClient fazendo requisição para: ${apiUrl}`);

    // Adicionar token de autenticação ao header se disponível no localStorage
    const authToken = localStorage.getItem('auth_token');
    console.log('getQueryFn - Token de autenticação recuperado do localStorage:', !!authToken ? 'Sim' : 'Não');
    const headers: Record<string, string> = {};

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
      console.log('getQueryFn - Authorization Header definido:', `Bearer ${authToken}`);
    }

    const res = await fetch(apiUrl, {
      method: "GET",
      headers,
      credentials: "omit", // Não usar cookies
    });

    // Log para debug
    console.log(`Resposta da requisição para ${apiUrl}: ${res.status}`);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log(`Retornando null para requisição não autenticada: ${apiUrl}`);
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});