/**
 * Configuração para as chamadas API, adaptando-se ao ambiente
 * Este arquivo fornece funções e configurações para gerenciar endpoints da API
 * considerando diferentes ambientes (desenvolvimento, produção na Vercel)
 */

// Constante para o prefixo padrão da API
// Pode ser configurado via variável de ambiente para permitir testes com /api-json
export const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api';

// Determina a base URL para chamadas de API com base no ambiente
export function getApiBaseUrl(): string {
  // Verificar se estamos em ambiente de produção de várias maneiras
  const isProd = import.meta.env.PROD;
  const isReplitApp = typeof window !== 'undefined' && 
                      (window.location.hostname.includes('replit.app') || 
                       window.location.hostname.includes('vercel.app') ||
                       window.location.hostname.includes('edunexia.com'));
  
  // Se qualquer uma das verificações indicar produção, usar URLs relativas
  if (isProd || isReplitApp) {
    // Em produção, forçamos caminhos relativos sem domínio
    console.log(`Ambiente de produção detectado [isProd=${isProd}, isReplitApp=${isReplitApp}] - usando URLs relativas`);
    return '';
  }
  
  // Em desenvolvimento local, apontamos para o servidor local
  // Isso só deve ser usado durante desenvolvimento
  console.log("Ambiente de desenvolvimento detectado - usando http://localhost:5000");
  return 'http://localhost:5000';
}

// Formata um caminho de API - versão legada, mantida para compatibilidade 
export function formatApiPath(path: string): string {
  return buildApiUrl(path);
}

/**
 * Constrói uma URL de API com base no caminho fornecido
 * Versão melhorada e centralizada para construção de URLs
 * @param path Caminho da API (pode incluir ou não o prefixo /api)
 * @returns URL completa da API
 */
export function buildApiUrl(path: string): string {
  // Se o caminho estiver vazio, vamos retornar apenas a base
  if (!path) {
    console.error("Path vazio passado para buildApiUrl");
    return getApiBaseUrl();
  }
  
  const baseUrl = getApiBaseUrl();
  // Garantimos que o caminho comece com '/'
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Detecta se o caminho já contém um prefixo de API válido
  const hasApiPrefix = normalizedPath.startsWith('/api/') || normalizedPath.startsWith('/api-json/');
  
  if (!baseUrl) {
    // Em produção - URL relativa
    return hasApiPrefix ? normalizedPath : `${API_PREFIX}${normalizedPath}`;
  }
  
  // Em desenvolvimento - URL completa com localhost
  const fullPath = hasApiPrefix ? normalizedPath : `${API_PREFIX}${normalizedPath}`;
  return `${baseUrl}${fullPath}`;
}

/**
 * Constrói uma URL de API específica para disciplinas
 * @param id ID da disciplina
 * @returns URL completa da API para a disciplina
 */
export function buildDisciplineApiUrl(id: number): string {
  return buildApiUrl(`/admin/disciplines/${id}`);
}

/**
 * Constrói uma URL de API para vídeos de disciplina
 * @param disciplineId ID da disciplina
 * @returns URL completa da API para vídeos da disciplina
 */
export function buildDisciplineVideosApiUrl(disciplineId: number): string {
  return buildApiUrl(`/admin/discipline-videos/${disciplineId}`);
}

/**
 * Constrói uma URL de API para materiais de disciplina
 * @param disciplineId ID da disciplina
 * @returns URL completa da API para materiais da disciplina
 */
export function buildDisciplineMaterialApiUrl(disciplineId: number): string {
  return buildApiUrl(`/admin/discipline-material/${disciplineId}`);
}

/**
 * Constrói uma URL de API para e-books de disciplina
 * @param disciplineId ID da disciplina
 * @returns URL completa da API para e-books da disciplina
 */
export function buildDisciplineEbookApiUrl(disciplineId: number): string {
  return buildApiUrl(`/admin/discipline-ebook/${disciplineId}`);
}

/**
 * Constrói uma URL de API para questões de disciplina
 * @param disciplineId ID da disciplina
 * @returns URL completa da API para questões da disciplina
 */
export function buildDisciplineQuestionsApiUrl(disciplineId: number): string {
  return buildApiUrl(`/admin/discipline-questions/${disciplineId}`);
}

/**
 * Constrói uma URL de API para avaliações de disciplina
 * @param disciplineId ID da disciplina
 * @returns URL completa da API para avaliações da disciplina
 */
export function buildDisciplineAssessmentsApiUrl(disciplineId: number): string {
  return buildApiUrl(`/admin/discipline-assessments/${disciplineId}`);
}

/**
 * Constrói uma URL de API para a rota de questões
 * @returns URL completa da API para a rota de questões
 */
export function buildQuestionsApiUrl(): string {
  return buildApiUrl('/admin/questions');
}

/**
 * Constrói uma URL de API para a rota de avaliações
 * @returns URL completa da API para a rota de avaliações
 */
export function buildAssessmentsApiUrl(): string {
  return buildApiUrl('/admin/assessments');
}

/**
 * Verifica se a resposta é JSON antes de tentar parsear
 * @param response Objeto Response do fetch
 * @returns Promise resolvida se a resposta for JSON, rejeitada caso contrário
 */
export function verifyJsonResponse(response: Response): Promise<Response> {
  const contentType = response.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    return Promise.reject(
      new Error(`Resposta do servidor não é JSON. Recebido: ${contentType || 'desconhecido'}`)
    );
  }
  
  return Promise.resolve(response);
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