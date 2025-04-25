
/**
 * Utilitário para gerar códigos de disciplina automaticamente
 */

import { db } from '../db';
import { eq, like, sql } from 'drizzle-orm';
import { disciplineTable } from '../db/schema';

/**
 * Gera um código para a disciplina baseado no nome e verificando disponibilidade
 * @param name Nome da disciplina
 * @returns Código único para a disciplina
 */
export async function generateDisciplineCode(name: string): Promise<string> {
  // Pega as primeiras 3 letras do nome, convertidas para maiúsculas
  let baseCode = name.replace(/[^a-zA-Z0-9]/g, '')  // Remove caracteres especiais
                     .substring(0, 3)
                     .toUpperCase();
  
  // Se não tivermos 3 letras, complementa com "DIS"
  if (baseCode.length < 3) {
    baseCode = (baseCode + "DIS").substring(0, 3);
  }
  
  console.log('Gerando código para disciplina. Base:', baseCode);
  
  // Busca todos os códigos que começam com o mesmo prefixo
  const similarCodes = await db.select({ code: disciplineTable.code })
                             .from(disciplineTable)
                             .where(like(disciplineTable.code, `${baseCode}%`));
  
  // Encontra o maior número e incrementa
  let maxNumber = 100;
  
  for (const item of similarCodes) {
    const codeNumber = parseInt(item.code.substring(3), 10);
    if (!isNaN(codeNumber) && codeNumber > maxNumber) {
      maxNumber = codeNumber;
    }
  }
  
  // Gera o novo código candidato
  let newCode = `${baseCode}${maxNumber + 1}`;
  
  // Verifica se o código gerado já existe (o que não deveria acontecer, mas por segurança)
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10; // Limite de tentativas para evitar loops infinitos
  
  while (!isUnique && attempts < maxAttempts) {
    // Verifica se o código já existe no banco
    const exists = await isDisciplineCodeInUse(newCode);
    
    if (!exists) {
      isUnique = true;
    } else {
      // Se existir, incrementa o número e tenta novamente
      maxNumber++;
      newCode = `${baseCode}${maxNumber + 1}`;
      attempts++;
    }
  }
  
  // Se após várias tentativas ainda não encontrou um código único,
  // adiciona um timestamp para garantir unicidade
  if (!isUnique) {
    const timestamp = new Date().getTime() % 10000; // Últimos 4 dígitos do timestamp
    newCode = `${baseCode}${timestamp}`;
  }
  
  console.log('Código gerado (final):', newCode);
  return newCode;
}

/**
 * Verifica se um código de disciplina está em uso
 * @param code Código a verificar
 * @returns true se o código já estiver em uso
 */
export async function isDisciplineCodeInUse(code: string): Promise<boolean> {
  const existingDiscipline = await db.select({ id: disciplineTable.id })
                                    .from(disciplineTable)
                                    .where(eq(disciplineTable.code, code))
                                    .limit(1);
  
  return existingDiscipline.length > 0;
}
