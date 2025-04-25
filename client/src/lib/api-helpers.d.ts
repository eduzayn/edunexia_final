/**
 * TypeScript declarations for API Helpers
 */

/**
 * Função para fazer requisições com tratamento robusto de erros
 */
export function safeApiRequest(url: string, options?: RequestInit): Promise<any>;

/**
 * Função para garantir que estamos usando uma URL completa para a API
 */
export function ensureFullUrl(url: string): string;

/**
 * Obter a URL base da API a partir de meta tags ou ambiente
 */
export function getApiBaseUrl(): string;

/**
 * Adicionar meta tag com a URL base da API
 */
export function setApiBaseUrl(baseUrl: string): void;