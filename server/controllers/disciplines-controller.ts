
import { Request, Response } from 'express';
import { db } from '../db';
import { disciplineTable } from '../db/schema';
import { eq, and, not } from 'drizzle-orm';
import { generateDisciplineCode, isDisciplineCodeInUse } from './discipline-code-generator';

/**
 * Cria uma nova disciplina
 */
export async function createDiscipline(req: Request, res: Response) {
  try {
    const { name, description, workload, syllabus } = req.body;
    
    // Validações básicas
    if (!name || !description || !workload || !syllabus) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios'
      });
    }
    
    // Gerar código automaticamente
    const code = await generateDisciplineCode(name);
    
    console.log('Criando disciplina com código:', code);
    
    // Inserir a disciplina no banco de dados
    const [newDiscipline] = await db.insert(disciplineTable)
      .values({
        code,
        name,
        description,
        workload: Number(workload), // Garante que é um número
        syllabus,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    console.log('Disciplina criada com sucesso:', newDiscipline);
    return res.status(201).json(newDiscipline);
  } catch (error) {
    console.error('Erro ao criar disciplina:', error);
    
    // Verifica se é um erro de chave duplicada
    if (error instanceof Error && 
        error.message.includes('duplicate key') && 
        error.message.includes('disciplines_code_key')) {
      
      // Tenta regenerar o código usando um timestamp para garantir unicidade
      try {
        const timestamp = new Date().getTime() % 10000; // Últimos 4 dígitos do timestamp
        const uniqueCode = `${name.substring(0, 3).toUpperCase()}${timestamp}`;
        
        console.log('Tentando novamente com código usando timestamp:', uniqueCode);
        
        // Inserir a disciplina com o novo código gerado
        const [newDiscipline] = await db.insert(disciplineTable)
          .values({
            code: uniqueCode,
            name,
            description,
            workload: Number(workload),
            syllabus,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        
        console.log('Disciplina criada com sucesso (segunda tentativa):', newDiscipline);
        return res.status(201).json(newDiscipline);
      } catch (secondError) {
        console.error('Falha na segunda tentativa de criar disciplina:', secondError);
        return res.status(500).json({
          success: false,
          message: 'Erro ao criar disciplina mesmo após segunda tentativa',
          error: secondError instanceof Error ? secondError.message : 'Erro desconhecido'
        });
      }
    }
    
    // Para outros tipos de erro
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar disciplina',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

/**
 * Atualiza uma disciplina existente
 */
export async function updateDiscipline(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { code, name, description, workload, syllabus } = req.body;
    
    // Validações básicas
    if (!code || !name || !description || !workload || !syllabus) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios'
      });
    }
    
    // Verificar se a disciplina existe
    const existingDiscipline = await db.select()
      .from(disciplineTable)
      .where(eq(disciplineTable.id, parseInt(id)))
      .limit(1);
    
    if (existingDiscipline.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Disciplina não encontrada'
      });
    }
    
    // Se o código foi alterado, verificar se já está em uso por outra disciplina
    if (code !== existingDiscipline[0].code) {
      // Verificar se o usuário é admin
      const userRole = (req as any).user?.role || (req as any).auth?.userRole;
      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Apenas administradores podem alterar o código da disciplina'
        });
      }
      
      // Verificar se o código já está em uso (exceto pela própria disciplina)
      const codeInUse = await db.select()
        .from(disciplineTable)
        .where(
          and(
            eq(disciplineTable.code, code),
            not(eq(disciplineTable.id, parseInt(id)))
          )
        )
        .limit(1);
      
      if (codeInUse.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Este código já está sendo usado por outra disciplina'
        });
      }
    }
    
    // Atualizar a disciplina
    const [updatedDiscipline] = await db.update(disciplineTable)
      .set({
        code,
        name,
        description,
        workload: Number(workload), // Garante que é um número
        syllabus,
        updatedAt: new Date()
      })
      .where(eq(disciplineTable.id, parseInt(id)))
      .returning();
    
    return res.json(updatedDiscipline);
  } catch (error) {
    console.error('Erro ao atualizar disciplina:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar disciplina',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
