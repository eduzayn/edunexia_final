import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { 
  buildApiUrl, 
  verifyJsonResponse, 
  buildDisciplineApiUrl,
  buildDisciplineVideosApiUrl,
  buildDisciplineEbookApiUrl,
  buildDisciplineMaterialApiUrl
} from "./api-config";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Função unificada para fazer requisições à API
 * Suporta tanto apiRequest(url) quanto apiRequest(method, url, data)
 * @param urlOrMethod URL da requisição ou método HTTP
 * @param urlOrOptions URL (se o primeiro parâmetro for método) ou opções
 * @param data Dados para enviar no corpo da requisição (quando usar formato method, url, data)
 * @returns Resposta da requisição
 */
export async function apiRequest(
  urlOrMethod: string,
  urlOrOptions?: string | { method?: string; data?: unknown; headers?: Record<string, string> },
  data?: unknown
): Promise<Response> {
  // Determina o formato utilizado na chamada
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
  
  // ✨ Usar a função centralizada buildApiUrl para construir URLs de forma consistente
  const apiUrl = buildApiUrl(url);
  
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
    credentials: 'same-origin',
    mode: 'cors' // Certificar que o modo CORS está ativado
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

/**
 * Helper específicos para chamadas API comuns
 * Convenientes para páginas que precisam acessar esses recursos
 */

// Helper para obter detalhes de disciplina pelo ID
export async function fetchDiscipline(id: number): Promise<Response> {
  return apiRequest("GET", buildDisciplineApiUrl(id));
}

// Helper para obter vídeos de uma disciplina
export async function fetchDisciplineVideos(id: number): Promise<Response> {
  return apiRequest("GET", buildDisciplineVideosApiUrl(id));
}

// Helper para obter material de uma disciplina
export async function fetchDisciplineMaterial(id: number): Promise<Response> {
  return apiRequest("GET", buildDisciplineMaterialApiUrl(id));
}

// Helper para obter e-book de uma disciplina
export async function fetchDisciplineEbook(id: number): Promise<Response> {
  return apiRequest("GET", buildDisciplineEbookApiUrl(id));
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
    
    // ✨ Usar a função centralizada buildApiUrl para URLs consistentes
    const apiUrl = buildApiUrl(urlFromKey);
    
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
      // Garantir que o cabeçalho de conteúdo esteja definido
      headers['Content-Type'] = 'application/json';
      // Log completo dos headers para debug
      console.log('Headers completos da requisição:', JSON.stringify(headers));
      const res = await fetch(apiUrl, {
        method: "GET",
        headers,
        cache: 'no-cache',
        credentials: 'same-origin', // Usar 'same-origin' é mais seguro e funciona melhor no Replit
        mode: 'cors' // Certificar que o modo CORS está ativado
      });
      
      // Log para debug
      console.log(`Resposta da requisição para ${apiUrl}: ${res.status}`);
  
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`Retornando null para requisição não autenticada: ${apiUrl}`);
        return null;
      }
  
      await throwIfResNotOk(res);
      
      // Verificar se a resposta é JSON antes de tentar parsear
      try {
        return await res.json();
      } catch (error) {
        console.error("Erro ao parsear resposta JSON:", error);
        throw new Error("Formato de resposta inválido: não é JSON válido");
      }
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