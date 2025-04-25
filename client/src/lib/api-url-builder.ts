/**
 * API URL Builder - Solução centralizada para construção de URLs de API
 * 
 * Este arquivo fornece funções para construir URLs de API de forma padronizada
 * e consistente em todo o projeto, evitando problemas de URLs malformadas.
 */

// Constante para o prefixo padrão da API
// No ambiente de produção, será usado o prefixo /api
// Mas podemos permitir que seja configurado via variável de ambiente
export const API_BASE_PREFIX = import.meta.env.VITE_API_PREFIX || '/api';

// Em desenvolvimento, usamos localhost
const isDev = import.meta.env.DEV;
const DEV_API_BASE = 'http://localhost:5000';

/**
 * Constrói uma URL de API com base no caminho fornecido
 * @param path Caminho da API (sem o prefixo /api)
 * @returns URL completa da API
 */
export function buildApiUrl(path: string): string {
  // Garante que o caminho comece com '/'
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Verifica se o caminho já inclui o prefixo da API
  const hasApiPrefix = normalizedPath.startsWith('/api/') || 
                       normalizedPath.startsWith('/api-json/');
  
  // Se o caminho já tem um prefixo de API, não adiciona o padrão
  const apiPath = hasApiPrefix ? normalizedPath : `${API_BASE_PREFIX}${normalizedPath}`;
  
  // Em desenvolvimento, adiciona a base da URL
  if (isDev) {
    return `${DEV_API_BASE}${apiPath}`;
  }
  
  // Em produção, retorna apenas o caminho relativo
  return apiPath;
}

/**
 * Constrói uma URL de API com base no caminho fornecido
 * Versão específica para disciplinas
 * @param id ID da disciplina
 * @returns URL completa da API para disciplina
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
 * Constrói uma URL de API para a criação de questões
 * @returns URL completa da API para criação de questões
 */
export function buildQuestionsApiUrl(): string {
  return buildApiUrl('/admin/questions');
}

/**
 * Constrói uma URL de API para a criação de avaliações
 * @returns URL completa da API para criação de avaliações
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