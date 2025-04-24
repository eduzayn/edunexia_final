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

/**
 * Função para fazer requisições à API com tipagem e suporte para diferentes formatos de chamada
 * Suporta tanto apiRequest(url) quanto apiRequest(method, url, data)
 */
export async function apiRequest(
  urlOrMethod: string,
  urlOrOptions?: string | { method?: string; data?: unknown; headers?: Record<string, string> },
  data?: unknown
): Promise<Response> {
  // Determina se estamos usando o formato antigo (apiRequest(url)) ou o novo (apiRequest(method, url, data))
  let url: string;
  let requestOptions: { method?: string; data?: unknown; headers?: Record<string, string> } = {};
  
  // Detectar formato da chamada
  const isHttpMethod = ["GET", "POST", "PUT", "DELETE", "PATCH"].includes(urlOrMethod);
  
  if (isHttpMethod) {
    // Formato: apiRequest(method, url, data)
    if (typeof urlOrOptions === 'string') {
      url = urlOrOptions;
      requestOptions.method = urlOrMethod;
      if (data !== undefined) {
        requestOptions.data = data;
      }
    } else {
      console.error("Formato de chamada inválido para apiRequest(method, url, data)");
      throw new Error("URL não informada para apiRequest");
    }
  } else {
    // Formato: apiRequest(url, options)
    url = urlOrMethod;
    if (typeof urlOrOptions === 'object') {
      requestOptions = urlOrOptions;
    }
  }
  
  // Verificação de segurança para URL vazia
  if (!url || url.trim() === '') {
    console.error("URL vazia ou inválida passada para apiRequest");
    throw new Error("URL inválida: " + url);
  }
  
  // Em desenvolvimento, use um domínio garantido
  const isDev = import.meta.env.DEV;
  let apiBaseUrl = '';
  
  if (isDev) {
    // Em desenvolvimento, hardcode para localhost:5000
    apiBaseUrl = 'http://localhost:5000';
    
    // Se a URL já começa com http ou https, não adicione o domínio base
    if (url.startsWith('http://') || url.startsWith('https://')) {
      apiBaseUrl = '';
    }
  }
  
  // Normalizar a URL para garantir que não tenha barras duplas
  let normalizedUrl = url;
  if (normalizedUrl.startsWith('/')) {
    normalizedUrl = normalizedUrl.substring(1);
  }
  
  // Construir a URL final
  const apiUrl = isDev 
    ? `${apiBaseUrl}/${normalizedUrl}`
    : normalizeUrl(url); // Em produção, use a função normalizeUrl existente
  
  // Log para debug
  console.log(`apiRequest - URL original: ${url}, método: ${requestOptions.method || "GET"}`);
  console.log(`apiRequest - URL final formatada: ${apiUrl}`);
  
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
    // Adicionar cache: 'no-cache' para evitar problemas de cache
    cache: 'no-cache',
    // Adicionar credentials: 'same-origin' para lidar com cookies corretamente
    credentials: 'same-origin'
  };

  if (requestOptions.data) {
    fetchOptions.body = JSON.stringify(requestOptions.data);
  }

  try {
    console.log(`Iniciando fetch para ${apiUrl}`);
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
    // Pegar a URL da queryKey
    const urlFromKey = queryKey[0] as string;
    
    // Verificação de segurança para URL vazia
    if (!urlFromKey || typeof urlFromKey !== 'string') {
      console.error("QueryKey inválida passada para getQueryFn:", queryKey);
      throw new Error("QueryKey inválida para getQueryFn");
    }
    
    // Em desenvolvimento, use um domínio garantido
    const isDev = import.meta.env.DEV;
    const isProd = import.meta.env.PROD;
    let apiBaseUrl = '';
    let url = urlFromKey;
    
    if (isDev) {
      // Em desenvolvimento, hardcode para localhost:5000
      apiBaseUrl = 'http://localhost:5000';
      
      // Se a URL já começa com http ou https, não adicione o domínio base
      if (url.startsWith('http://') || url.startsWith('https://')) {
        apiBaseUrl = '';
      }
    }
    
    // Normalizar a URL para garantir que não tenha barras duplas
    let normalizedUrl = url;
    if (normalizedUrl.startsWith('/')) {
      normalizedUrl = normalizedUrl.substring(1);
    }
    
    // Construir a URL final
    let apiUrl;
    if (isDev) {
      apiUrl = `${apiBaseUrl}/${normalizedUrl}`;
    } else {
      // Em produção, use as funções existentes
      const normalized = normalizeUrl(url);
      apiUrl = formatApiPath(normalized);
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

    try {
      console.log(`Iniciando fetch para ${apiUrl}`);
      const res = await fetch(apiUrl, {
        method: "GET",
        headers,
        cache: 'no-cache',
        credentials: 'same-origin'
      });
      
      // Log para debug
      console.log(`Resposta da requisição para ${apiUrl}: ${res.status}`);
  
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`Retornando null para requisição não autenticada: ${apiUrl}`);
        return null;
      }
  
      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error(`[ERRO CRÍTICO] Falha ao realizar fetch para ${apiUrl}:`, error);
      // Verificar se o erro é de CORS ou de rede
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error(`Erro de rede ao conectar com o servidor. Detalhes: Failed to fetch. Verifique se o servidor está acessível.`);
      }
      throw error;
    }
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