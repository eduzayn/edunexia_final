import { Request, Response } from 'express';
import { storage } from '../storage';
import { eq } from 'drizzle-orm';
import { disciplines } from '@shared/schema';
import { db } from '../db';

// Listar todas as disciplinas
export async function listarDisciplinas(req: Request, res: Response) {
  try {
    // Usando Drizzle para buscar todas as disciplinas
    const disciplinasLista = await db.select().from(disciplines);
    
    return res.status(200).json({
      success: true,
      message: 'Disciplinas recuperadas com sucesso',
      data: disciplinasLista.map(d => ({
        ...d,
        // Garantir consistência com o front-end
        contentStatus: d.contentStatus || 'incomplete'
      }))
    });
  } catch (error) {
    console.error('Erro ao listar disciplinas:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar disciplinas',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

// Obter uma disciplina por ID
export async function obterDisciplina(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    const [disciplina] = await db.select().from(disciplines).where(eq(disciplines.id, id));
    
    if (!disciplina) {
      return res.status(404).json({
        success: false,
        message: 'Disciplina não encontrada'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Disciplina recuperada com sucesso',
      data: {
        ...disciplina,
        contentStatus: disciplina.contentStatus || 'incomplete'
      }
    });
  } catch (error) {
    console.error('Erro ao obter disciplina:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter disciplina',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

// Criar uma nova disciplina
export async function criarDisciplina(req: Request, res: Response) {
  try {
    const { code, name, workload, description, syllabus } = req.body;
    
    // Validação básica
    if (!code || !name) {
      return res.status(400).json({
        success: false,
        message: 'Código e nome são obrigatórios'
      });
    }

    // Verificar se já existe uma disciplina com o mesmo código
    const [disciplinaExistente] = await db
      .select()
      .from(disciplines)
      .where(eq(disciplines.code, code));

    if (disciplinaExistente) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma disciplina com este código'
      });
    }

    // Inserir a nova disciplina
    const [novaDisciplina] = await db
      .insert(disciplines)
      .values({
        code,
        name,
        workload: workload || 0,
        description: description || '',
        syllabus: syllabus || '',
        contentStatus: 'incomplete'
      })
      .returning();

    return res.status(201).json({
      success: true,
      message: 'Disciplina criada com sucesso',
      data: novaDisciplina
    });
  } catch (error) {
    console.error('Erro ao criar disciplina:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar disciplina',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

// Atualizar uma disciplina existente
export async function atualizarDisciplina(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    const { code, name, workload, description, syllabus, contentStatus } = req.body;
    
    // Validação básica
    if (!code || !name) {
      return res.status(400).json({
        success: false,
        message: 'Código e nome são obrigatórios'
      });
    }

    // Verificar se a disciplina existe
    const [disciplinaExistente] = await db
      .select()
      .from(disciplines)
      .where(eq(disciplines.id, id));

    if (!disciplinaExistente) {
      return res.status(404).json({
        success: false,
        message: 'Disciplina não encontrada'
      });
    }

    // Verificar se o novo código já existe em outra disciplina
    if (code !== disciplinaExistente.code) {
      const [outraDisciplina] = await db
        .select()
        .from(disciplines)
        .where(eq(disciplines.code, code));

      if (outraDisciplina && outraDisciplina.id !== id) {
        return res.status(400).json({
          success: false,
          message: 'Já existe outra disciplina com este código'
        });
      }
    }

    // Atualizar a disciplina
    const [disciplinaAtualizada] = await db
      .update(disciplines)
      .set({
        code,
        name,
        workload: workload || 0,
        description: description || '',
        syllabus: syllabus || '',
        contentStatus: contentStatus || disciplinaExistente.contentStatus || 'incomplete'
      })
      .where(eq(disciplines.id, id))
      .returning();

    return res.status(200).json({
      success: true,
      message: 'Disciplina atualizada com sucesso',
      data: disciplinaAtualizada
    });
  } catch (error) {
    console.error('Erro ao atualizar disciplina:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar disciplina',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

// Excluir uma disciplina
export async function excluirDisciplina(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    // Verificar se a disciplina existe
    const [disciplinaExistente] = await db
      .select()
      .from(disciplines)
      .where(eq(disciplines.id, id));

    if (!disciplinaExistente) {
      return res.status(404).json({
        success: false,
        message: 'Disciplina não encontrada'
      });
    }

    // Em um sistema real, verificaríamos se a disciplina está sendo usada em cursos
    // antes de permitir a exclusão

    // Excluir a disciplina
    await db
      .delete(disciplines)
      .where(eq(disciplines.id, id));

    return res.status(200).json({
      success: true,
      message: 'Disciplina excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir disciplina:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao excluir disciplina',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

// Verificar completude de uma disciplina
export async function verificarCompletude(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    // Verificar se a disciplina existe
    const [disciplina] = await db
      .select()
      .from(disciplines)
      .where(eq(disciplines.id, id));

    if (!disciplina) {
      return res.status(404).json({
        success: false,
        message: 'Disciplina não encontrada'
      });
    }

    // Em um sistema real, aqui verificaríamos se a disciplina tem todos os
    // conteúdos necessários: vídeos, e-books, simulados, avaliações, etc.
    // Por enquanto, vamos simular essa verificação

    // Buscar o conteúdo da disciplina no storage para verificação de completude
    const content = await storage.getDisciplineContent(id);
    
    // Verificação de vídeos
    const videos = content?.videos || [];
    const hasVideos = videos.length > 0;
    
    // Verificação de e-books
    const ebooks = content?.ebooks || [];
    const hasEbooks = ebooks.length > 0;
    
    // Verificação de simulado
    const simulados = content?.simulados || [];
    const hasSimulado = simulados.length > 0;
    const simuladoCompleto = hasSimulado && simulados[0]?.questions?.length >= 5;
    
    // Verificação de avaliação final
    const avaliacoes = content?.avaliacoes || [];
    const hasAvaliacao = avaliacoes.length > 0;
    const avaliacaoCompleta = hasAvaliacao && avaliacoes[0]?.questions?.length == 10;
    
    // Resultado da verificação
    const resultado = {
      isComplete: hasVideos && hasEbooks && simuladoCompleto && avaliacaoCompleta,
      components: {
        videos: {
          status: hasVideos,
          count: videos.length,
          required: 1,
          message: hasVideos ? 'Pelo menos um vídeo disponível' : 'Adicione pelo menos um vídeo'
        },
        ebooks: {
          status: hasEbooks,
          count: ebooks.length,
          required: 1,
          message: hasEbooks ? 'Pelo menos um e-book disponível' : 'Adicione pelo menos um e-book'
        },
        simulado: {
          status: simuladoCompleto,
          count: simulados[0]?.questions?.length || 0,
          required: 5,
          message: simuladoCompleto 
            ? 'Simulado completo com 5+ questões' 
            : hasSimulado 
              ? 'O simulado precisa ter no mínimo 5 questões' 
              : 'Adicione um simulado com pelo menos 5 questões'
        },
        avaliacao: {
          status: avaliacaoCompleta,
          count: avaliacoes[0]?.questions?.length || 0,
          required: 10,
          message: avaliacaoCompleta 
            ? 'Avaliação final completa com 10 questões' 
            : hasAvaliacao 
              ? 'A avaliação final precisa ter exatamente 10 questões' 
              : 'Adicione uma avaliação final com 10 questões'
        }
      }
    };

    // Atualizar o status de completude da disciplina no banco, se necessário
    const novoStatus = resultado.isComplete ? 'complete' : 'incomplete';
    if (disciplina.contentStatus !== novoStatus) {
      await db
        .update(disciplines)
        .set({ contentStatus: novoStatus })
        .where(eq(disciplines.id, id));
    }

    return res.status(200).json({
      success: true,
      message: 'Verificação de completude realizada com sucesso',
      data: resultado
    });
  } catch (error) {
    console.error('Erro ao verificar completude da disciplina:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar completude da disciplina',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}