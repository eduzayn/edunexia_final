/**
 * Utilitário para normalizar URLs e evitar problemas com barras duplas
 * que causam erros em produção no Vercel/Replit
 */

/**
 * Normaliza uma URL para garantir que não haja barras duplas
 * exceto após o protocolo (http:// ou https://)
 * Em produção, converte URLs completas para URLs relativas
 */
export function normalizeUrl(url: string): string {
  const isProd = import.meta.env.PROD;
  
  // Se estamos em produção e a URL contém um domínio completo como o da Vercel ou Replit,
  // extrair apenas o caminho relativo
  if (isProd && typeof url === 'string') {
    const domainUrlPattern = /^https?:\/\/[\w.-]+(\.vercel\.app|\.edunexia\.com|\.replit\.app)\/(.+)$/;
    const match = url.match(domainUrlPattern);
    
    if (match) {
      console.log(`normalizeUrl - URL com domínio Vercel detectada: ${url}`);
      // Extrair apenas o caminho relativo
      const relativePath = `/${match[2]}`;
      console.log(`normalizeUrl - Convertida para caminho relativo: ${relativePath}`);
      url = relativePath;
    }
  }
  
  // Se a URL for absoluta e já tiver protocolo, preservar o protocolo com // duplo
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Em produção, preferimos não usar URLs absolutas
    if (isProd) {
      try {
        const urlObj = new URL(url);
        // Extrair apenas o caminho e a query string
        const relativePath = urlObj.pathname + urlObj.search;
        console.log(`normalizeUrl - URL absoluta convertida para relativa: ${relativePath}`);
        return relativePath.replace(/\/+/g, '/');
      } catch (e) {
        console.error(`normalizeUrl - Erro ao processar URL absoluta: ${url}`, e);
      }
    }
    
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
  
  if (isProd) {
    // Em produção, garantir que são apenas caminhos relativos
    // Remover qualquer URL completa que possa estar sendo usada
    let relativePath = path;
    
    // Se o caminho começa com http(s)://, extrair apenas o caminho relativo
    if (relativePath.match(/^https?:\/\//)) {
      try {
        const url = new URL(relativePath);
        relativePath = url.pathname + url.search;
      } catch (e) {
        console.error("Erro ao analisar URL completa:", relativePath);
      }
    }
    
    // Normalizar o caminho garantindo que começa com /
    const normalizedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    
    // Em produção, não usar baseUrl, apenas retornar o caminho relativo
    return normalizedPath;
  }
  
  // Base URL padrão para desenvolvimento
  const apiBase = baseUrl || 'http://localhost:5000';
  
  // Normalizar o caminho e juntar com a base
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return joinUrls(apiBase, normalizedPath);
}