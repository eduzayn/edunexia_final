/**
 * Sistema de cache otimizado para ambiente serverless da Vercel
 * 
 * Este sistema implementa um cache em memória efêmero adequado para funções serverless,
 * e também oferece suporte a armazenamento de cache em banco de dados para dados que
 * precisam persistir entre invocações.
 */

import { executeQuery } from './db/serverless.js';

// Cache em memória (válido apenas para a duração da invocação da função)
const memoryCache = new Map();

/**
 * Obtém um valor do cache em memória
 * @param {string} key - Chave do cache
 * @returns {any|null} - Valor armazenado ou null se não encontrado/expirado
 */
export function getFromMemoryCache(key) {
  if (!memoryCache.has(key)) {
    return null;
  }

  const item = memoryCache.get(key);
  
  // Verificar expiração
  if (item.expiresAt && item.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  
  return item.value;
}

/**
 * Armazena um valor no cache em memória
 * @param {string} key - Chave do cache
 * @param {any} value - Valor a ser armazenado
 * @param {number} ttlSeconds - Tempo de vida em segundos (0 para nunca expirar)
 */
export function setInMemoryCache(key, value, ttlSeconds = 60) {
  const expiresAt = ttlSeconds > 0 ? Date.now() + (ttlSeconds * 1000) : null;
  
  memoryCache.set(key, {
    value,
    expiresAt
  });
}

/**
 * Remove um valor do cache em memória
 * @param {string} key - Chave do cache
 */
export function deleteFromMemoryCache(key) {
  memoryCache.delete(key);
}

// Funções para cache persistente (usando banco de dados)

/**
 * Obtém um valor do cache persistente
 * @param {string} key - Chave do cache
 * @returns {Promise<any|null>} - Valor armazenado ou null se não encontrado/expirado
 */
export async function getFromPersistentCache(key) {
  try {
    // Primeiro tenta obter do cache em memória
    const memoryValue = getFromMemoryCache(`db_cache:${key}`);
    if (memoryValue !== null) {
      return memoryValue;
    }
    
    // Se não encontrou em memória, busca no banco de dados
    const result = await executeQuery(
      `SELECT value, expires_at FROM cache_items WHERE key = $1`,
      [key]
    );
    
    if (result.length === 0) {
      return null;
    }
    
    const item = result[0];
    
    // Verificar expiração
    if (item.expires_at && new Date(item.expires_at) < new Date()) {
      // Item expirado, remove do banco
      await executeQuery(
        `DELETE FROM cache_items WHERE key = $1`,
        [key]
      );
      return null;
    }
    
    // Armazena também no cache em memória para acessos futuros
    const value = JSON.parse(item.value);
    const ttlSeconds = item.expires_at 
      ? Math.floor((new Date(item.expires_at).getTime() - Date.now()) / 1000)
      : 0;
      
    setInMemoryCache(`db_cache:${key}`, value, ttlSeconds);
    
    return value;
  } catch (error) {
    console.error('Erro ao obter cache persistente:', error);
    return null;
  }
}

/**
 * Armazena um valor no cache persistente
 * @param {string} key - Chave do cache
 * @param {any} value - Valor a ser armazenado
 * @param {number} ttlSeconds - Tempo de vida em segundos (0 para nunca expirar)
 */
export async function setInPersistentCache(key, value, ttlSeconds = 3600) {
  try {
    const serializedValue = JSON.stringify(value);
    const expiresAt = ttlSeconds > 0 
      ? new Date(Date.now() + (ttlSeconds * 1000)).toISOString()
      : null;
    
    // Armazena no banco de dados
    await executeQuery(
      `INSERT INTO cache_items (key, value, expires_at) 
       VALUES ($1, $2, $3)
       ON CONFLICT (key) DO UPDATE 
       SET value = $2, expires_at = $3`,
      [key, serializedValue, expiresAt]
    );
    
    // Armazena também no cache em memória
    setInMemoryCache(`db_cache:${key}`, value, ttlSeconds);
    
    return true;
  } catch (error) {
    console.error('Erro ao definir cache persistente:', error);
    return false;
  }
}

/**
 * Remove um valor do cache persistente
 * @param {string} key - Chave do cache
 */
export async function deleteFromPersistentCache(key) {
  try {
    // Remove do banco de dados
    await executeQuery(
      `DELETE FROM cache_items WHERE key = $1`,
      [key]
    );
    
    // Remove também do cache em memória
    deleteFromMemoryCache(`db_cache:${key}`);
    
    return true;
  } catch (error) {
    console.error('Erro ao excluir do cache persistente:', error);
    return false;
  }
}

/**
 * Limpa todos os itens expirados do cache persistente
 */
export async function cleanupExpiredCache() {
  try {
    const result = await executeQuery(
      `DELETE FROM cache_items WHERE expires_at < $1 RETURNING key`,
      [new Date().toISOString()]
    );
    
    // Remove também do cache em memória
    for (const item of result) {
      deleteFromMemoryCache(`db_cache:${item.key}`);
    }
    
    return result.length;
  } catch (error) {
    console.error('Erro ao limpar cache expirado:', error);
    return 0;
  }
} 