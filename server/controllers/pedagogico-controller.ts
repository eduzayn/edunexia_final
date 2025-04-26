
import { Request, Response } from 'express';
import { db } from '../db';

// Interface para questões
interface Questao {
  id?: string;
  enunciado: string;
  alternativas: string[];
  respostaCorreta: number;
}

// Vídeo-aulas
export async function getVideos(req: Request, res: Response) {
  try {
    const disciplineId = req.params.id;
    
    // Buscar vídeos da disciplina no banco de dados
    const result = await db.query(
      'SELECT id, title, url, duration FROM discipline_videos WHERE discipline_id = $1 ORDER BY order_index ASC',
      [disciplineId]
    );
    
    return res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar vídeos:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar vídeos',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

export async function addVideo(req: Request, res: Response) {
  try {
    const disciplineId = req.params.id;
    const { title, url, duration } = req.body;
    
    // Validar dados
    if (!title || !url) {
      return res.status(400).json({ 
        success: false, 
        message: 'Título e URL são obrigatórios' 
      });
    }
    
    // Verificar ordem para inserir o vídeo
    const orderResult = await db.query(
      'SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM discipline_videos WHERE discipline_id = $1',
      [disciplineId]
    );
    
    const order = orderResult.rows[0].next_order;
    
    // Inserir o vídeo no banco de dados
    const result = await db.query(
      `INSERT INTO discipline_videos 
       (discipline_id, title, url, duration, order_index, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) 
       RETURNING *`,
      [disciplineId, title, url, duration || 0, order]
    );
    
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao adicionar vídeo:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao adicionar vídeo',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

export async function removeVideo(req: Request, res: Response) {
  try {
    const { id: disciplineId, videoId } = req.params;
    
    // Remover o vídeo do banco de dados
    const result = await db.query(
      'DELETE FROM discipline_videos WHERE discipline_id = $1 AND id = $2 RETURNING *',
      [disciplineId, videoId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vídeo não encontrado' 
      });
    }
    
    // Reordenar os vídeos restantes
    await db.query(
      `UPDATE discipline_videos 
       SET order_index = temp.new_index 
       FROM (
         SELECT id, ROW_NUMBER() OVER (ORDER BY order_index) - 1 as new_index 
         FROM discipline_videos 
         WHERE discipline_id = $1
       ) as temp 
       WHERE discipline_videos.id = temp.id`,
      [disciplineId]
    );
    
    return res.json({ 
      success: true, 
      message: 'Vídeo removido com sucesso',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao remover vídeo:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao remover vídeo',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

// E-book estático
export async function getEbookEstatico(req: Request, res: Response) {
  try {
    const disciplineId = req.params.id;
    
    // Buscar e-book estático da disciplina
    const result = await db.query(
      'SELECT id, title, url, filename, created_at FROM discipline_ebooks WHERE discipline_id = $1 AND type = \'static\'',
      [disciplineId]
    );
    
    if (result.rows.length === 0) {
      return res.json(null);
    }
    
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar e-book estático:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar e-book estático',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

export async function addEbookEstatico(req: Request, res: Response) {
  try {
    const disciplineId = req.params.id;
    const { title, url, filename } = req.body;
    
    // Validar dados
    if (!title || (!url && !req.file)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Título e URL ou arquivo são obrigatórios' 
      });
    }
    
    // Verificar se já existe um e-book estático para esta disciplina
    const checkResult = await db.query(
      'SELECT id FROM discipline_ebooks WHERE discipline_id = $1 AND type = \'static\'',
      [disciplineId]
    );
    
    let result;
    const fileUrl = req.file ? `/uploads/ebooks/${req.file.filename}` : url;
    const finalFilename = req.file ? req.file.originalname : filename || '';
    
    if (checkResult.rows.length > 0) {
      // Atualizar o e-book existente
      result = await db.query(
        `UPDATE discipline_ebooks 
         SET title = $1, url = $2, filename = $3, updated_at = NOW() 
         WHERE discipline_id = $4 AND type = 'static' 
         RETURNING *`,
        [title, fileUrl, finalFilename, disciplineId]
      );
    } else {
      // Inserir novo e-book
      result = await db.query(
        `INSERT INTO discipline_ebooks 
         (discipline_id, title, url, filename, type, created_at) 
         VALUES ($1, $2, $3, $4, 'static', NOW()) 
         RETURNING *`,
        [disciplineId, title, fileUrl, finalFilename]
      );
    }
    
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao adicionar e-book estático:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao adicionar e-book estático',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

// E-book interativo
export async function getEbookInterativo(req: Request, res: Response) {
  try {
    const disciplineId = req.params.id;
    
    // Buscar e-book interativo da disciplina
    const result = await db.query(
      'SELECT id, title, url, created_at FROM discipline_ebooks WHERE discipline_id = $1 AND type = \'interactive\'',
      [disciplineId]
    );
    
    if (result.rows.length === 0) {
      return res.json(null);
    }
    
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar e-book interativo:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar e-book interativo',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

export async function addEbookInterativo(req: Request, res: Response) {
  try {
    const disciplineId = req.params.id;
    const { title, url } = req.body;
    
    // Validar dados
    if (!title || !url) {
      return res.status(400).json({ 
        success: false, 
        message: 'Título e URL são obrigatórios' 
      });
    }
    
    // Verificar se já existe um e-book interativo para esta disciplina
    const checkResult = await db.query(
      'SELECT id FROM discipline_ebooks WHERE discipline_id = $1 AND type = \'interactive\'',
      [disciplineId]
    );
    
    let result;
    
    if (checkResult.rows.length > 0) {
      // Atualizar o e-book existente
      result = await db.query(
        `UPDATE discipline_ebooks 
         SET title = $1, url = $2, updated_at = NOW() 
         WHERE discipline_id = $3 AND type = 'interactive' 
         RETURNING *`,
        [title, url, disciplineId]
      );
    } else {
      // Inserir novo e-book
      result = await db.query(
        `INSERT INTO discipline_ebooks 
         (discipline_id, title, url, type, created_at) 
         VALUES ($1, $2, $3, 'interactive', NOW()) 
         RETURNING *`,
        [disciplineId, title, url]
      );
    }
    
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao adicionar e-book interativo:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao adicionar e-book interativo',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

// Simulado
export async function getSimulado(req: Request, res: Response) {
  try {
    const disciplineId = req.params.id;
    
    // Buscar simulado da disciplina
    const result = await db.query(
      `SELECT id, title, description, time_limit 
       FROM discipline_simulados 
       WHERE discipline_id = $1`,
      [disciplineId]
    );
    
    if (result.rows.length === 0) {
      return res.json({ 
        id: null, 
        title: "Simulado", 
        description: "", 
        timeLimit: 60, 
        questions: [] 
      });
    }
    
    const simulado = result.rows[0];
    
    // Buscar questões do simulado
    const questoesResult = await db.query(
      `SELECT id, enunciado, alternativas, resposta_correta as "respostaCorreta"
       FROM discipline_questoes
       WHERE simulado_id = $1
       ORDER BY order_index ASC`,
      [simulado.id]
    );
    
    return res.json({
      ...simulado,
      timeLimit: simulado.time_limit,
      questions: questoesResult.rows
    });
  } catch (error) {
    console.error('Erro ao buscar simulado:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar simulado',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

export async function addQuestaoSimulado(req: Request, res: Response) {
  try {
    const disciplineId = req.params.id;
    const { enunciado, alternativas, respostaCorreta, simuladoTitle, simuladoDescription, simuladoTimeLimit } = req.body;
    
    // Validar dados
    if (!enunciado || !alternativas || respostaCorreta === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Enunciado, alternativas e resposta correta são obrigatórios' 
      });
    }
    
    // Verificar se já existe um simulado para esta disciplina ou criar um novo
    let simuladoId;
    const simuladoResult = await db.query(
      'SELECT id FROM discipline_simulados WHERE discipline_id = $1',
      [disciplineId]
    );
    
    if (simuladoResult.rows.length === 0) {
      // Criar novo simulado
      const newSimuladoResult = await db.query(
        `INSERT INTO discipline_simulados 
         (discipline_id, title, description, time_limit, created_at) 
         VALUES ($1, $2, $3, $4, NOW()) 
         RETURNING id`,
        [disciplineId, simuladoTitle || 'Simulado', simuladoDescription || '', simuladoTimeLimit || 60]
      );
      simuladoId = newSimuladoResult.rows[0].id;
    } else {
      simuladoId = simuladoResult.rows[0].id;
      
      // Atualizar simulado se necessário
      if (simuladoTitle || simuladoDescription || simuladoTimeLimit) {
        await db.query(
          `UPDATE discipline_simulados 
           SET title = COALESCE($1, title), 
               description = COALESCE($2, description), 
               time_limit = COALESCE($3, time_limit),
               updated_at = NOW() 
           WHERE id = $4`,
          [simuladoTitle, simuladoDescription, simuladoTimeLimit, simuladoId]
        );
      }
    }
    
    // Verificar ordem para inserir a questão
    const orderResult = await db.query(
      'SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM discipline_questoes WHERE simulado_id = $1',
      [simuladoId]
    );
    
    const order = orderResult.rows[0].next_order;
    
    // Inserir a questão
    const result = await db.query(
      `INSERT INTO discipline_questoes 
       (simulado_id, enunciado, alternativas, resposta_correta, order_index, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) 
       RETURNING *`,
      [simuladoId, enunciado, alternativas, respostaCorreta, order]
    );
    
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao adicionar questão ao simulado:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao adicionar questão ao simulado',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

export async function updateQuestaoSimulado(req: Request, res: Response) {
  try {
    const { id: disciplineId, questaoId } = req.params;
    const { enunciado, alternativas, respostaCorreta } = req.body;
    
    // Validar dados
    if (!enunciado || !alternativas || respostaCorreta === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Enunciado, alternativas e resposta correta são obrigatórios' 
      });
    }
    
    // Verificar se a questão pertence ao simulado da disciplina
    const checkResult = await db.query(
      `SELECT q.id 
       FROM discipline_questoes q
       JOIN discipline_simulados s ON q.simulado_id = s.id
       WHERE s.discipline_id = $1 AND q.id = $2`,
      [disciplineId, questaoId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Questão não encontrada no simulado desta disciplina' 
      });
    }
    
    // Atualizar a questão
    const result = await db.query(
      `UPDATE discipline_questoes 
       SET enunciado = $1, alternativas = $2, resposta_correta = $3, updated_at = NOW() 
       WHERE id = $4 
       RETURNING *`,
      [enunciado, alternativas, respostaCorreta, questaoId]
    );
    
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar questão do simulado:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar questão do simulado',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

export async function removeQuestaoSimulado(req: Request, res: Response) {
  try {
    const { id: disciplineId, questaoId } = req.params;
    
    // Verificar se a questão pertence ao simulado da disciplina
    const checkResult = await db.query(
      `SELECT q.id, q.simulado_id 
       FROM discipline_questoes q
       JOIN discipline_simulados s ON q.simulado_id = s.id
       WHERE s.discipline_id = $1 AND q.id = $2`,
      [disciplineId, questaoId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Questão não encontrada no simulado desta disciplina' 
      });
    }
    
    const simuladoId = checkResult.rows[0].simulado_id;
    
    // Remover a questão
    const result = await db.query(
      'DELETE FROM discipline_questoes WHERE id = $1 RETURNING *',
      [questaoId]
    );
    
    // Reordenar as questões restantes
    await db.query(
      `UPDATE discipline_questoes 
       SET order_index = temp.new_index 
       FROM (
         SELECT id, ROW_NUMBER() OVER (ORDER BY order_index) - 1 as new_index 
         FROM discipline_questoes 
         WHERE simulado_id = $1
       ) as temp 
       WHERE discipline_questoes.id = temp.id`,
      [simuladoId]
    );
    
    return res.json({ 
      success: true, 
      message: 'Questão removida com sucesso',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao remover questão do simulado:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao remover questão do simulado',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

// Avaliação Final
export async function getAvaliacaoFinal(req: Request, res: Response) {
  try {
    const disciplineId = req.params.id;
    
    // Buscar avaliação final da disciplina
    const result = await db.query(
      `SELECT id, title, description, time_limit, passing_score, max_attempts, show_explanations 
       FROM discipline_avaliacao_final 
       WHERE discipline_id = $1`,
      [disciplineId]
    );
    
    if (result.rows.length === 0) {
      return res.json({ 
        id: null, 
        title: "Avaliação Final", 
        description: "", 
        timeLimit: 90, 
        passingScore: 70,
        maxAttempts: 3,
        showExplanations: true,
        questions: [] 
      });
    }
    
    const avaliacao = result.rows[0];
    
    // Buscar questões da avaliação
    const questoesResult = await db.query(
      `SELECT id, enunciado, alternativas, resposta_correta as "respostaCorreta", explanation
       FROM discipline_questoes_avaliacao
       WHERE avaliacao_id = $1
       ORDER BY order_index ASC`,
      [avaliacao.id]
    );
    
    return res.json({
      ...avaliacao,
      timeLimit: avaliacao.time_limit,
      passingScore: avaliacao.passing_score,
      maxAttempts: avaliacao.max_attempts,
      showExplanations: avaliacao.show_explanations,
      questions: questoesResult.rows
    });
  } catch (error) {
    console.error('Erro ao buscar avaliação final:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar avaliação final',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

export async function addQuestaoAvaliacaoFinal(req: Request, res: Response) {
  try {
    const disciplineId = req.params.id;
    const { 
      enunciado, alternativas, respostaCorreta, explanation,
      avaliacaoTitle, avaliacaoDescription, avaliacaoTimeLimit,
      avaliacaoPassingScore, avaliacaoMaxAttempts, avaliacaoShowExplanations
    } = req.body;
    
    // Validar dados
    if (!enunciado || !alternativas || respostaCorreta === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Enunciado, alternativas e resposta correta são obrigatórios' 
      });
    }
    
    // Verificar se já existe uma avaliação final para esta disciplina ou criar uma nova
    let avaliacaoId;
    const avaliacaoResult = await db.query(
      'SELECT id FROM discipline_avaliacao_final WHERE discipline_id = $1',
      [disciplineId]
    );
    
    if (avaliacaoResult.rows.length === 0) {
      // Criar nova avaliação final
      const newAvaliacaoResult = await db.query(
        `INSERT INTO discipline_avaliacao_final 
         (discipline_id, title, description, time_limit, passing_score, max_attempts, show_explanations, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
         RETURNING id`,
        [
          disciplineId, 
          avaliacaoTitle || 'Avaliação Final', 
          avaliacaoDescription || '', 
          avaliacaoTimeLimit || 90,
          avaliacaoPassingScore || 70,
          avaliacaoMaxAttempts || 3,
          avaliacaoShowExplanations !== undefined ? avaliacaoShowExplanations : true
        ]
      );
      avaliacaoId = newAvaliacaoResult.rows[0].id;
    } else {
      avaliacaoId = avaliacaoResult.rows[0].id;
      
      // Atualizar avaliação final se necessário
      if (avaliacaoTitle || avaliacaoDescription || avaliacaoTimeLimit || 
          avaliacaoPassingScore !== undefined || avaliacaoMaxAttempts !== undefined || 
          avaliacaoShowExplanations !== undefined) {
        await db.query(
          `UPDATE discipline_avaliacao_final 
           SET title = COALESCE($1, title), 
               description = COALESCE($2, description), 
               time_limit = COALESCE($3, time_limit),
               passing_score = COALESCE($4, passing_score),
               max_attempts = COALESCE($5, max_attempts),
               show_explanations = COALESCE($6, show_explanations),
               updated_at = NOW() 
           WHERE id = $7`,
          [
            avaliacaoTitle, 
            avaliacaoDescription, 
            avaliacaoTimeLimit, 
            avaliacaoPassingScore,
            avaliacaoMaxAttempts,
            avaliacaoShowExplanations,
            avaliacaoId
          ]
        );
      }
    }
    
    // Verificar ordem para inserir a questão
    const orderResult = await db.query(
      'SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM discipline_questoes_avaliacao WHERE avaliacao_id = $1',
      [avaliacaoId]
    );
    
    const order = orderResult.rows[0].next_order;
    
    // Inserir a questão
    const result = await db.query(
      `INSERT INTO discipline_questoes_avaliacao 
       (avaliacao_id, enunciado, alternativas, resposta_correta, explanation, order_index, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
       RETURNING *`,
      [avaliacaoId, enunciado, alternativas, respostaCorreta, explanation || '', order]
    );
    
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao adicionar questão à avaliação final:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao adicionar questão à avaliação final',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

export async function updateQuestaoAvaliacaoFinal(req: Request, res: Response) {
  try {
    const { id: disciplineId, questaoId } = req.params;
    const { enunciado, alternativas, respostaCorreta, explanation } = req.body;
    
    // Validar dados
    if (!enunciado || !alternativas || respostaCorreta === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Enunciado, alternativas e resposta correta são obrigatórios' 
      });
    }
    
    // Verificar se a questão pertence à avaliação final da disciplina
    const checkResult = await db.query(
      `SELECT q.id 
       FROM discipline_questoes_avaliacao q
       JOIN discipline_avaliacao_final a ON q.avaliacao_id = a.id
       WHERE a.discipline_id = $1 AND q.id = $2`,
      [disciplineId, questaoId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Questão não encontrada na avaliação final desta disciplina' 
      });
    }
    
    // Atualizar a questão
    const result = await db.query(
      `UPDATE discipline_questoes_avaliacao 
       SET enunciado = $1, alternativas = $2, resposta_correta = $3, explanation = $4, updated_at = NOW() 
       WHERE id = $5 
       RETURNING *`,
      [enunciado, alternativas, respostaCorreta, explanation || '', questaoId]
    );
    
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar questão da avaliação final:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar questão da avaliação final',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

export async function removeQuestaoAvaliacaoFinal(req: Request, res: Response) {
  try {
    const { id: disciplineId, questaoId } = req.params;
    
    // Verificar se a questão pertence à avaliação final da disciplina
    const checkResult = await db.query(
      `SELECT q.id, q.avaliacao_id 
       FROM discipline_questoes_avaliacao q
       JOIN discipline_avaliacao_final a ON q.avaliacao_id = a.id
       WHERE a.discipline_id = $1 AND q.id = $2`,
      [disciplineId, questaoId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Questão não encontrada na avaliação final desta disciplina' 
      });
    }
    
    const avaliacaoId = checkResult.rows[0].avaliacao_id;
    
    // Remover a questão
    const result = await db.query(
      'DELETE FROM discipline_questoes_avaliacao WHERE id = $1 RETURNING *',
      [questaoId]
    );
    
    // Reordenar as questões restantes
    await db.query(
      `UPDATE discipline_questoes_avaliacao 
       SET order_index = temp.new_index 
       FROM (
         SELECT id, ROW_NUMBER() OVER (ORDER BY order_index) - 1 as new_index 
         FROM discipline_questoes_avaliacao 
         WHERE avaliacao_id = $1
       ) as temp 
       WHERE discipline_questoes_avaliacao.id = temp.id`,
      [avaliacaoId]
    );
    
    return res.json({ 
      success: true, 
      message: 'Questão removida com sucesso',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao remover questão da avaliação final:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao remover questão da avaliação final',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

// Verificação de completude
export async function getCompletude(req: Request, res: Response) {
  try {
    const disciplineId = req.params.id;
    
    // Verificar vídeos
    const videosResult = await db.query(
      'SELECT COUNT(*) as count FROM discipline_videos WHERE discipline_id = $1',
      [disciplineId]
    );
    const hasVideos = videosResult.rows[0].count > 0;
    
    // Verificar e-book estático
    const ebookEstaticoResult = await db.query(
      'SELECT id FROM discipline_ebooks WHERE discipline_id = $1 AND type = \'static\'',
      [disciplineId]
    );
    const hasEbookEstatico = ebookEstaticoResult.rows.length > 0;
    
    // Verificar e-book interativo
    const ebookInterativoResult = await db.query(
      'SELECT id FROM discipline_ebooks WHERE discipline_id = $1 AND type = \'interactive\'',
      [disciplineId]
    );
    const hasEbookInterativo = ebookInterativoResult.rows.length > 0;
    
    // Verificar simulado
    const simuladoResult = await db.query(
      `SELECT s.id, COUNT(q.id) as question_count
       FROM discipline_simulados s
       LEFT JOIN discipline_questoes q ON s.id = q.simulado_id
       WHERE s.discipline_id = $1
       GROUP BY s.id`,
      [disciplineId]
    );
    const hasSimulado = simuladoResult.rows.length > 0 && simuladoResult.rows[0].question_count > 0;
    
    // Verificar avaliação final
    const avaliacaoResult = await db.query(
      `SELECT a.id, COUNT(q.id) as question_count
       FROM discipline_avaliacao_final a
       LEFT JOIN discipline_questoes_avaliacao q ON a.id = q.avaliacao_id
       WHERE a.discipline_id = $1
       GROUP BY a.id`,
      [disciplineId]
    );
    const hasAvaliacao = avaliacaoResult.rows.length > 0 && avaliacaoResult.rows[0].question_count > 0;
    
    // Calcular progresso
    const items = [
      { id: 'videos', name: 'Vídeo-aulas', isCompleted: hasVideos },
      { id: 'ebook-estatico', name: 'E-book Estático', isCompleted: hasEbookEstatico },
      { id: 'ebook-interativo', name: 'E-book Interativo', isCompleted: hasEbookInterativo },
      { id: 'simulado', name: 'Simulado', isCompleted: hasSimulado },
      { id: 'avaliacao', name: 'Avaliação Final', isCompleted: hasAvaliacao }
    ];
    
    const completedItems = items.filter(item => item.isCompleted).length;
    const progress = Math.round((completedItems / items.length) * 100);
    
    return res.json({
      items,
      progress
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
