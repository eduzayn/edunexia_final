import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Função para fazer requisições à API com tipagem
 * @param url URL da requisição
 * @param options Opções da requisição (method, data, etc.)
 * @returns Resposta convertida para o tipo T
 */
export async function apiRequest(
  method: string = "GET",
  url: string,
  data?: unknown,
  customHeaders?: Record<string, string>
): Promise<Response> {
  const token = localStorage.getItem("auth_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  if (token) {
    console.log("Token de autenticação recuperado do localStorage:", "Sim");
    headers["Authorization"] = `Bearer ${token}`;
    console.log("Authorization Header definido:", headers["Authorization"]);
  } else {
    console.log("Token de autenticação recuperado do localStorage:", "Não");
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    console.log(`Realizando requisição ${method} para ${url}`, options);
    const response = await fetch(url, options);
    console.log(`Resposta da requisição ${method} para ${url}: ${response.status}`);

    // Adiciona verificação para debug em caso de erro
    if (!response.ok) {
      console.warn(`Requisição ${method} para ${url} falhou com status ${response.status}`);

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
    console.error(`Erro na requisição ${method} para ${url}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Log para debug
    console.log(`QueryClient fazendo requisição para: ${queryKey[0]}`);

    // Adicionar token de autenticação ao header se disponível no localStorage
    const authToken = localStorage.getItem('auth_token');
    console.log('getQueryFn - Token de autenticação recuperado do localStorage:', !!authToken ? 'Sim' : 'Não');
    const headers: Record<string, string> = {};

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
      console.log('getQueryFn - Authorization Header definido:', `Bearer ${authToken}`);
    }

    const res = await fetch(queryKey[0] as string, {
      method: "GET",
      headers,
      credentials: "omit", // Não usar cookies
    });

    // Log para debug
    console.log(`Resposta da requisição para ${queryKey[0]}: ${res.status}`);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log(`Retornando null para requisição não autenticada: ${queryKey[0]}`);
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