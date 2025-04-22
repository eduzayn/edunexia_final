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
export async function apiRequest<T = any>(
  method: string = "GET",
  url: string,
  data?: unknown,
  headers?: Record<string, string>
): Promise<Response> {
  const customHeaders = headers || {};
  
  // Adicionar token de autenticação ao header se disponível no localStorage
  const authToken = localStorage.getItem('auth_token');
  if (authToken) {
    customHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  // Adicionar console.log para debug
  console.log(`Realizando requisição ${method} para ${url}`);

  const res = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...customHeaders
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "same-origin", // Não mais usar cookies
  });

  // Log para debug
  console.log(`Resposta da requisição ${method} para ${url}: ${res.status}`);

  await throwIfResNotOk(res);
  
  return res;
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
    const headers: Record<string, string> = {};
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const res = await fetch(queryKey[0] as string, {
      method: "GET",
      headers,
      credentials: "same-origin", // Não mais usar cookies
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
