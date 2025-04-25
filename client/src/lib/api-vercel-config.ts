// Esta configuração é específica para o ambiente Vercel
// e lida com os diferentes URLs de API em produção vs. desenvolvimento

/**
 * Retorna o URL base da API com base no ambiente
 */
export function getApiBaseUrl(): string {
  // No ambiente Vercel
  if (import.meta.env.VERCEL || typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    // No servidor Vercel, a API está no mesmo domínio
    return '';
  }
  
  // Em desenvolvimento local usando o proxy do Vite
  return 'http://localhost:5000';
}

/**
 * Manipula requisições para a API de forma diferente em ambiente Vercel vs. desenvolvimento
 */
export async function fetchApiVercel(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  // Adicionar cabeçalhos necessários para Vercel
  const headers: Record<string, string> = {
    ...((options.headers || {}) as Record<string, string>),
    'Accept': 'application/json'
  };
  
  // Se houver um token de autenticação no localStorage, adicione-o aos cabeçalhos
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  // Fazer a requisição com os cabeçalhos atualizados
  return fetch(url, {
    ...options,
    headers
  });
}