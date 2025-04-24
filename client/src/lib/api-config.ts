/**
 * Configuração para as chamadas API, adaptando-se ao ambiente
 * Este arquivo fornece funções e configurações para gerenciar endpoints da API
 * considerando diferentes ambientes (desenvolvimento, produção na Vercel)
 */

// Determina a base URL para chamadas de API com base no ambiente
export function getApiBaseUrl(): string {
  // Em produção (Vercel ou qualquer ambiente que não seja localhost),
  // usamos URLs relativas que serão resolvidas contra o domínio atual
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    // Em produção, usamos caminhos relativos sem domínio
    return '';
  }
  
  // Em desenvolvimento local, apontamos para o servidor local
  // Isso só deve ser usado durante desenvolvimento
  return 'http://localhost:5000';
}

// Formata um caminho de API
export function formatApiPath(path: string): string {
  const baseUrl = getApiBaseUrl();
  // Garantimos que o caminho comece com '/'
  const apiPath = path.startsWith('/') ? path : `/${path}`;
  
  // Se estamos em produção (baseUrl vazio), garantimos que o caminho comece com /api ou /api-json
  if (!baseUrl) {
    // Manter compatibilidade com ambos os padrões /api/ e /api-json/
    if (apiPath.startsWith('/api/') || apiPath.startsWith('/api-json/')) {
      return apiPath;
    }
    
    // Se não começa com nenhum dos prefixos, adiciona /api/
    return `/api${apiPath}`;
  }
  
  // Em desenvolvimento, usamos a URL base completa
  // Mantém compatibilidade com ambos os padrões /api/ e /api-json/
  if (apiPath.startsWith('/api/') || apiPath.startsWith('/api-json/')) {
    return `${baseUrl}${apiPath}`;
  }
  
  // Caso contrário, adiciona /api/ como padrão
  return `${baseUrl}/api${apiPath}`;
}

// Configuração padrão para fetch
export const defaultFetchOptions: RequestInit = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
};

// Função auxiliar para fazer requisições fetch com tratamento de erros
export async function fetchApi<T = any>(
  path: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = formatApiPath(path);
  const fetchOptions = {
    ...defaultFetchOptions,
    ...options,
    headers: {
      ...defaultFetchOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, fetchOptions);
    
    // Verifica se a resposta foi bem-sucedida
    if (!response.ok) {
      // Tenta ler detalhes do erro no corpo da resposta
      const errorData = await response.json().catch(() => null);
      throw new ApiError(
        errorData?.message || 'Erro ao realizar requisição',
        response.status,
        errorData
      );
    }
    
    // Para respostas 204 No Content ou opções HEAD, não tentamos parsear JSON
    if (response.status === 204 || fetchOptions.method === 'HEAD') {
      return null as T;
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Erros de rede ou outros erros imprevistos
    throw new ApiError(
      (error as Error)?.message || 'Erro de rede ao conectar com a API',
      0,
      { originalError: error }
    );
  }
}

// Classe para tratar erros da API de forma estruturada
export class ApiError extends Error {
  statusCode: number;
  data: any;
  
  constructor(message: string, statusCode: number, data: any = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

// Verifica o status da API para confirmar conectividade
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(formatApiPath('/healthcheck'), {
      method: 'GET',
      headers: defaultFetchOptions.headers,
    });
    return response.ok;
  } catch {
    return false;
  }
} 