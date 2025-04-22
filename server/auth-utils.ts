/**
 * Utilitários para autenticação
 * Este arquivo contém funções auxiliares usadas pelo sistema de autenticação
 */

import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import bcrypt from 'bcrypt';

const scryptAsync = promisify(scrypt);

/**
 * Gera um hash de senha usando scrypt
 */
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Compara uma senha fornecida com uma senha armazenada (hash)
 * Suporta diferentes formatos de hash para compatibilidade
 */
export async function comparePasswords(supplied: string, stored: string) {
  try {
    // Verifica se é o formato scrypt: hex.salt
    if (stored.includes('.')) {
      console.log('Detectado formato hash.salt, usando comparação manual');
      const [hashed, salt] = stored.split(".");
      if (!hashed || !salt) {
        console.log('Hash ou salt não encontrados na senha armazenada');
        return false;
      }
      
      const hashedBuf = Buffer.from(hashed, "hex");
      const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
      
      // Verificar se os buffers têm o mesmo tamanho
      if (hashedBuf.length !== suppliedBuf.length) {
        console.log(`Tamanhos diferentes: hash=${hashedBuf.length}, supplied=${suppliedBuf.length}`);
        return false;
      }
      
      // Adicionar logs para debug da comparação
      console.log(`hashedBuf length: ${hashedBuf.length}, suppliedBuf length: ${suppliedBuf.length}`);
      
      // Usando timingSafeEqual para comparar os buffers (evita ataques de timing)
      try {
        return timingSafeEqual(hashedBuf, suppliedBuf);
      } catch (e) {
        console.error('Erro na comparação timingSafeEqual:', e);
        // Fallback para comparação simples em caso de erro
        return hashedBuf.toString('hex') === suppliedBuf.toString('hex');
      }
    }
    
    // Verifica se é um hash bcrypt (começa com $2a$, $2b$ ou $2y$)
    if (stored.startsWith('$2')) {
      console.log('Detectado formato bcrypt, usando bcrypt.compare');
      return await bcrypt.compare(supplied, stored);
    }
    
    // Se o formato não for reconhecido, retorna false
    console.log('Formato de senha não reconhecido');
    return false;
  } catch (error) {
    console.error('Erro ao comparar senhas:', error);
    return false;
  }
}