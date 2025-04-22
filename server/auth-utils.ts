/**
 * Utilitários para autenticação
 * Este arquivo contém funções auxiliares para autenticação, incluindo:
 * - Comparação de senhas
 * - Geração de hash de senha
 */

import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import bcrypt from 'bcrypt';

const scryptAsync = promisify(scrypt);

/**
 * Cria um hash de senha usando scrypt
 * @param password Senha em texto plano
 * @returns Hash da senha no formato hash.salt
 */
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Compara a senha fornecida com a senha armazenada
 * Suporta dois formatos:
 * - Hash bcrypt ($2a$ ou $2b$)
 * - Hash scrypt no formato hash.salt
 * 
 * @param supplied Senha fornecida (texto plano)
 * @param stored Senha armazenada (hash)
 * @returns true se as senhas corresponderem, false caso contrário
 */
export async function comparePasswords(supplied: string, stored: string) {
  try {
    // Verificar se é uma senha no formato bcrypt
    if (stored.startsWith('$2b$') || stored.startsWith('$2a$')) {
      console.log('Detectado formato bcrypt, usando bcrypt.compare');
      return bcrypt.compare(supplied, stored);
    }
    
    // Formato antigo com hash.salt
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
      
      return timingSafeEqual(hashedBuf, suppliedBuf);
    }
    
    console.log('Formato de senha não reconhecido');
    return false;
  } catch (error) {
    console.error('Erro ao comparar senhas:', error);
    return false;
  }
}