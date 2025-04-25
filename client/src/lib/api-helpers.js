/**
 * API Helpers - Utilitários para lidar com problemas comuns de APIs
 * 
 * Este arquivo fornece funções utilitárias para resolver problemas comuns de requisições
 * a APIs, especialmente problemas de CORS, redirects e respostas HTML em vez de JSON.
 */

/**
 * Função para fazer requisições com tratamento robusto de erros
 * @param {string} url - URL da requisição
 * @param {Object} options - Opções para fetch
 * @returns {Promise<Object>} - Promise com resultado JSON ou erro tratado
 */
export async function safeApiRequest(url, options = {}) {
  // Garantir que temos headers
  if (!options.headers) {
    options.headers = {};
  }
  
  // Adicionar token de autenticação se existir
  const token = localStorage.getItem('auth_token');
  if (token && !options.headers['Authorization']) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Garantir que aceitamos JSON como resposta
  options.headers['Accept'] = 'application/json';
  
  // Adicionar URLs completas quando necessário
  const fullUrl = url.startsWith('http') ? url : ensureFullUrl(url);
  
  console.log('[API Helper] Fazendo requisição para:', fullUrl);
  
  try {
    const response = await fetch(fullUrl, options);
    
    // Verificar se temos uma resposta de sucesso
    if (!response.ok) {
      // Verificar se a resposta é JSON ou HTML
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        // Se for JSON, tentar ler a mensagem de erro
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Erro desconhecido na requisição');
      } else {
        // Se não for JSON, provavelmente é HTML de erro ou redirect
        const text = await response.text();
        
        if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
          console.error('[API Helper] Resposta HTML recebida em vez de JSON:', text.substring(0, 150) + '...');
          throw new Error('Resposta HTML recebida em vez de JSON. Possível problema de CORS ou redirect.');
        } else {
          throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
        }
      }
    }
    
    // Ler o corpo da resposta
    const responseText = await response.text();
    
    // Verificar se é um JSON válido antes de fazer o parse
    try {
      return JSON.parse(responseText);
    } catch (e) {
      console.error('[API Helper] Erro ao fazer parse de JSON:', responseText.substring(0, 150) + '...');
      throw new Error('A resposta não é um JSON válido');
    }
  } catch (error) {
    console.error('[API Helper] Erro na requisição:', error);
    throw error;
  }
}

/**
 * Função para garantir que estamos usando uma URL completa para a API
 * @param {string} url - URL relativa ou absoluta
 * @returns {string} - URL completa com domínio
 */
export function ensureFullUrl(url) {
  // Se já for uma URL completa, retornar
  if (url.startsWith('http')) {
    return url;
  }
  
  // Verificar se temos uma meta tag com a URL base da API
  const apiBaseUrl = getApiBaseUrl();
  
  // Criar a URL completa
  const fullUrl = `${apiBaseUrl}${url.startsWith('/') ? url : '/' + url}`;
  
  console.log('[API Helper] URL convertida de', url, 'para', fullUrl);
  return fullUrl;
}

/**
 * Obter a URL base da API a partir de meta tags ou ambiente
 * @returns {string} - URL base da API
 */
export function getApiBaseUrl() {
  // Verificar meta tag
  const metaTag = document.querySelector('meta[name="api-base-url"]');
  if (metaTag && metaTag.getAttribute('content')) {
    return metaTag.getAttribute('content');
  }
  
  // Verificar variável de ambiente Vite
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Fallback para o domínio atual (sem subpath)
  return window.location.origin;
}

/**
 * Adicionar meta tag com a URL base da API
 * @param {string} baseUrl - URL base da API
 */
export function setApiBaseUrl(baseUrl) {
  let metaTag = document.querySelector('meta[name="api-base-url"]');
  
  if (!metaTag) {
    metaTag = document.createElement('meta');
    metaTag.setAttribute('name', 'api-base-url');
    document.head.appendChild(metaTag);
  }
  
  metaTag.setAttribute('content', baseUrl);
  console.log('[API Helper] URL base da API definida como:', baseUrl);
}

// Executar automaticamente ao importar
if (typeof document !== 'undefined') {
  // Definir a URL base da API como o domínio atual por padrão
  setApiBaseUrl(window.location.origin);
  
  console.log('[API Helper] Helpers de API inicializados');
}