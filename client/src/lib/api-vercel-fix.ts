/**
 * Utilitário para normalizar URLs e evitar problemas com barras duplas
 * que causam erros em produção no Vercel/Replit
 */

/**
 * Normaliza uma URL para garantir que não haja barras duplas
 * exceto após o protocolo (http:// ou https://)
 */
export function normalizeUrl(url: string): string {
  // Se a URL for absoluta e já tiver protocolo, preservar o protocolo com // duplo
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Dividir a URL em partes: protocolo e caminho
    const [protocol, ...rest] = url.split('://');
    // Juntar o restante e garantir que não haja barras duplas
    const path = rest.join('://').replace(/\/+/g, '/');
    return `${protocol}://${path}`;
  }
  
  // Para URLs relativas, simplesmente substituir barras duplas por barras simples
  // Garantir que a URL comece com uma barra se for absoluta do servidor
  const normalizedUrl = url.startsWith('/')
    ? url.replace(/\/+/g, '/')
    : `/${url.replace(/\/+/g, '/')}`;
  
  return normalizedUrl;
}

/**
 * Função para unir baseUrl com um caminho, garantindo que não haja barras duplas
 */
export function joinUrls(baseUrl: string, path: string): string {
  // Remover barras finais do baseUrl
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  // Remover barras iniciais do path
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Juntar as partes com uma única barra
  return `${base}/${cleanPath}`;
}

/**
 * Constrói uma URL para a API baseada no ambiente
 */
export function buildApiUrl(path: string, baseUrl?: string): string {
  // Em produção, usar URLs relativas para evitar problemas com CORS
  const isProd = import.meta.env.PROD;
  
  // Base URL padrão para desenvolvimento
  const apiBase = baseUrl || (isProd ? '' : 'http://localhost:5000');
  
  // Normalizar o caminho e juntar com a base
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return joinUrls(apiBase, normalizedPath);
}