/**
 * Configuração de URLs da API
 * 
 * Este arquivo centraliza a configuração de URLs para chamadas à API,
 * permitindo diferentes configurações entre desenvolvimento e produção.
 */

// Determinar a URL base da API com base no ambiente
export function getApiBaseUrl(): string {
  // Para desenvolvimento local (quando rodando em localhost)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5000';
  }
  
  // Para ambiente Replit - usar a URL pública do Replit
  if (typeof window !== 'undefined' && window.location.hostname.includes('replit')) {
    // No Replit, a API está disponível na mesma origem que o frontend
    return window.location.origin;
  }
  
  // Fallback para a URL de produção
  const apiUrl = 'https://edunexa-portal.replit.app';
  
  console.log('Usando URL base da API:', apiUrl);
  return apiUrl;
}

/**
 * Constrói uma URL completa para a API
 * @param path Caminho da API (ex: /login, /user)
 * @returns URL completa para a API
 */
export function buildApiUrl(path: string): string {
  // IMPORTANTE: Verificar se o path já contém uma URL completa
  // Este é o principal problema que causa a duplicação de domínios
  if (path.startsWith('http://') || path.startsWith('https://')) {
    console.log('Detectada URL completa no path, retornando diretamente:', path);
    return path;
  }
  
  const base = getApiBaseUrl();
  // Garantir que a URL seja formatada corretamente com barra entre base e path
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const finalUrl = `${base}${normalizedPath}`;
  
  console.log(`buildApiUrl: base=${base}, path=${path}, resultado=${finalUrl}`);
  return finalUrl;
}

/**
 * Verifica se uma resposta é do tipo JSON
 * @param response Resposta HTTP
 * @returns true se a resposta for do tipo JSON
 */
export function verifyJsonResponse(response: Response): boolean {
  const contentType = response.headers.get('content-type');
  return contentType !== null && contentType.includes('application/json');
}

/**
 * URLs específicas para recursos de disciplina
 */
export function buildDisciplineApiUrl(id: number): string {
  return buildApiUrl(`/api/disciplines/${id}`);
}

export function buildDisciplineVideosApiUrl(id: number): string {
  return buildApiUrl(`/api/disciplines/${id}/videos`);
}

export function buildDisciplineEbookApiUrl(id: number): string {
  return buildApiUrl(`/api/disciplines/${id}/ebook`);
}

export function buildDisciplineMaterialApiUrl(id: number): string {
  return buildApiUrl(`/api/disciplines/${id}/material`);
}

export function buildDisciplineQuestionsApiUrl(id: number): string {
  return buildApiUrl(`/api/disciplines/${id}/questions`);
}

export function buildDisciplineAssessmentsApiUrl(id: number): string {
  return buildApiUrl(`/api/disciplines/${id}/assessments`);
}