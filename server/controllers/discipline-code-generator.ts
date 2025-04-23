
/**
 * Utilitário para gerar códigos de disciplina automaticamente
 */

import { db } from '../db';
import { eq } from 'drizzle-orm';
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
  
  // Busca quantas disciplinas já existem com este prefixo
  const existingDisciplines = await db.select({ code: disciplineTable.code })
                                     .from(disciplineTable)
                                     .where(eq(disciplineTable.code, baseCode));
                                     
  if (existingDisciplines.length === 0) {
    // Se não existe nenhuma, retorna o código base + 101
    return `${baseCode}101`;
  } else {
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
    
    // Retorna o código base + número incrementado
    return `${baseCode}${maxNumber + 1}`;
  }
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

function like(column: any, pattern: string) {
  return `${column.name} LIKE '${pattern}'`;
}
