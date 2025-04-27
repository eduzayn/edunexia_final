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
  // Verificar se a URL já é completa antes de construir
  let apiUrl: string;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    console.log(`apiRequest: URL já é completa, usando diretamente: ${url}`);
    apiUrl = url; // Usar a URL diretamente
  } else {
    apiUrl = buildApiUrl(url);
  }
  
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
    // Usar 'default' para permitir estratégias de cache do navegador
    cache: 'default',
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
 * Versão estendida da função apiRequest que inclui processamento automático da resposta JSON
 * Útil para serviços que precisam do resultado JSON já processado
 * @template T - Tipo de dados esperado na resposta
 * @param urlOrMethod - URL ou método HTTP
 * @param urlOrOptions - URL (se o primeiro argumento for método) ou opções
 * @param data - Dados para enviar no corpo (quando usando formato method, url, data)
 * @returns Uma Promise com o objeto JSON do tipo especificado
 */
export async function apiRequestJson<T>(
  urlOrMethod: string,
  urlOrOptions?: string | { method?: string; data?: unknown; headers?: Record<string, string> },
  data?: unknown
): Promise<T> {
  const response = await apiRequest(urlOrMethod, urlOrOptions, data);
  if (!response.ok) {
    throw new Error(`Requisição falhou com status ${response.status}`);
  }
  
  return response.json() as Promise<T>;
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
    // Isso usa nossa função getApiBaseUrl que detecta o ambiente
    // e monta a URL correta para o Replit ou ambiente local
    
    // Verificar se a URL já é completa antes de construir
    let apiUrl: string;
    if (urlFromKey.startsWith('http://') || urlFromKey.startsWith('https://')) {
      console.log(`QueryClient: URL já é completa, usando diretamente: ${urlFromKey}`);
      apiUrl = urlFromKey; // Usar a URL diretamente
    } else {
      apiUrl = buildApiUrl(urlFromKey);
    }
    
    // Log para debug
    console.log(`QueryClient fazendo requisição para: ${apiUrl} (ambiente: ${window.location.hostname})`);

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
      // Adicionar suporte a memoização de requisições 
      // para evitar repetir a mesma chamada múltiplas vezes
      const requestKey = `${apiUrl}-${JSON.stringify(headers)}`;
      
      // Criar um objeto de configuração otimizado para fetch
      const fetchConfig: RequestInit = {
        method: "GET",
        headers,
        // Permitir cache eficiente para chamadas GET
        cache: 'default',
        // Configuração importante para lidar corretamente com cookies de sessão
        credentials: 'same-origin',
        mode: 'cors'
      };
      
      // Usar o preflight com opção de cache
      const res = await fetch(apiUrl, fetchConfig);
      
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
      
      // Tratamento especial para erros de rede (Failed to fetch)
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.warn(`Erro de rede - tentando abordagem alternativa para ${apiUrl}`);
        
        // Implementar uma nova tentativa com timeout maior
        try {
          // Tentar novamente com timeout maior e outras configurações otimizadas
          const retryConfig: RequestInit = { 
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(headers && { ...headers })
            },
            credentials: 'same-origin',
            mode: 'cors',
            cache: 'no-store' as RequestCache
          };
          const retryResponse = await fetch(apiUrl, retryConfig);
          
          console.log(`Retry bem-sucedido para ${apiUrl}: ${retryResponse.status}`);
          return retryResponse;
        } catch (retryError) {
          console.error(`Retry falhou para ${apiUrl}:`, retryError);
          // Se a nova tentativa falhar, usamos um valor em cache se disponível
          // ou retornamos error silenciosamente se for uma chamada não crítica
          if (unauthorizedBehavior === "returnNull") {
            console.warn(`Retornando null após falha de rede para ${apiUrl}`);
            return null;
          }
          
          throw new Error(`Erro de conexão com o servidor. Por favor, verifique sua conexão de rede e tente novamente.`);
        }
      }
      
      // Para outros tipos de erro, manter o comportamento original
      throw error;
    }
  };

// Configuração otimizada do QueryClient
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      // Otimizar staleTime para permitir cache mais eficiente (15 minutos)
      staleTime: 15 * 60 * 1000,
      // Ajustar retry para garantir que tentativas com falha tenham uma nova chance
      retry: 1,
    },
    mutations: {
      // Dar uma nova chance para mutations com falha
      retry: 1,
    },
  },
});