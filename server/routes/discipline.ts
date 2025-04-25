import { Router } from 'express';
import { db } from '../db';
import { disciplines } from '@shared/schema';
import { eq } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';

const router = Router();

// Função auxiliar para verificar ID da disciplina
const validateDisciplineId = (id: string): number | null => {
  const numId = parseInt(id, 10);
  return isNaN(numId) ? null : numId;
};

// Função para buscar disciplina por ID
const getDisciplineById = async (id: number) => {
  try {
    const [discipline] = await db
      .select()
      .from(disciplines)
      .where(eq(disciplines.id, id));
    
    return discipline;
  } catch (error) {
    console.error(`Erro ao buscar disciplina ${id}:`, error);
    return null;
  }
};

/**
 * Rota para obter uma disciplina específica pelo ID
 * Retorna os detalhes completos da disciplina incluindo conteúdo
 */
router.get('/api/disciplines/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const disciplineId = validateDisciplineId(id);
    
    if (!disciplineId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de disciplina inválido' 
      });
    }
    
    // Buscar a disciplina pelo ID
    const discipline = await getDisciplineById(disciplineId);
    
    if (!discipline) {
      return res.status(404).json({ 
        success: false, 
        error: 'Disciplina não encontrada' 
      });
    }
    
    // Retornar os dados da disciplina
    res.json({
      success: true,
      data: discipline
    });
  } catch (error) {
    console.error('Erro ao buscar disciplina:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor ao buscar disciplina' 
    });
  }
});

/**
 * Rota para obter os vídeos de uma disciplina
 */
router.get('/api/disciplines/:id/videos', async (req, res) => {
  try {
    const { id } = req.params;
    const disciplineId = validateDisciplineId(id);
    
    if (!disciplineId) {
      return res.status(400).json({ success: false, error: 'ID de disciplina inválido' });
    }
    
    const discipline = await getDisciplineById(disciplineId);
    
    if (!discipline) {
      return res.status(404).json({ success: false, error: 'Disciplina não encontrada' });
    }
    
    // Extrair dados de vídeo da disciplina
    const videos = [];
    
    for (let i = 1; i <= 10; i++) {
      const urlKey = `videoAula${i}Url` as keyof typeof discipline;
      const sourceKey = `videoAula${i}Source` as keyof typeof discipline;
      
      if (discipline[urlKey]) {
        videos.push({
          id: i,
          url: discipline[urlKey],
          source: discipline[sourceKey],
          title: `Aula ${i}: ${discipline.name}`
        });
      }
    }
    
    res.json(videos);
  } catch (error) {
    console.error('Erro ao buscar vídeos da disciplina:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

/**
 * Rota para adicionar vídeo a uma disciplina
 */
router.post('/api/disciplines/:id/videos', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, videoSource, url, duration } = req.body;
    
    // Validar ID da disciplina
    const disciplineId = validateDisciplineId(id);
    if (!disciplineId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de disciplina inválido' 
      });
    }
    
    // Validar dados da requisição
    if (!title || !videoSource || !url) {
      return res.status(400).json({ 
        success: false, 
        error: 'Dados incompletos. Título, fonte de vídeo e URL são obrigatórios' 
      });
    }
    
    // Buscar a disciplina
    const discipline = await getDisciplineById(disciplineId);
    if (!discipline) {
      return res.status(404).json({ 
        success: false, 
        error: 'Disciplina não encontrada' 
      });
    }
    
    // Verificar qual slot de vídeo está disponível
    let nextSlot = 0;
    for (let i = 1; i <= 10; i++) {
      const urlKey = `videoAula${i}Url` as keyof typeof discipline;
      if (!discipline[urlKey]) {
        nextSlot = i;
        break;
      }
    }
    
    if (nextSlot === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Esta disciplina já possui o número máximo de vídeos (10)' 
      });
    }
    
    // Atualizar a disciplina com o novo vídeo
    const urlKey = `videoAula${nextSlot}Url`;
    const sourceKey = `videoAula${nextSlot}Source`;
    
    const [updatedDiscipline] = await db.update(disciplines)
      .set({ 
        [urlKey]: url,
        [sourceKey]: videoSource,
        updatedAt: new Date()
      })
      .where(eq(disciplines.id, disciplineId))
      .returning();
    
    if (!updatedDiscipline) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao atualizar disciplina' 
      });
    }
    
    // Retornar sucesso
    return res.status(200).json({ 
      success: true, 
      message: 'Vídeo adicionado com sucesso',
      video: {
        id: nextSlot,
        title,
        url,
        videoSource,
        duration
      }
    });
  } catch (error) {
    console.error('Erro ao adicionar vídeo:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor ao adicionar vídeo'
    });
  }
});

/**
 * Rota para obter material de uma disciplina
 */
router.get('/api/disciplines/:id/material', async (req, res) => {
  try {
    const { id } = req.params;
    const disciplineId = validateDisciplineId(id);
    
    if (!disciplineId) {
      return res.status(400).json({ success: false, error: 'ID de disciplina inválido' });
    }
    
    const discipline = await getDisciplineById(disciplineId);
    
    if (!discipline) {
      return res.status(404).json({ success: false, error: 'Disciplina não encontrada' });
    }
    
    // Retornar informações sobre material
    res.json({
      id: disciplineId,
      apostilaPdfUrl: discipline.apostilaPdfUrl,
      name: discipline.name,
      description: discipline.description
    });
  } catch (error) {
    console.error('Erro ao buscar material da disciplina:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

/**
 * Rota para obter ebook de uma disciplina
 */
router.get('/api/disciplines/:id/ebook', async (req, res) => {
  try {
    const { id } = req.params;
    const disciplineId = validateDisciplineId(id);
    
    if (!disciplineId) {
      return res.status(400).json({ success: false, error: 'ID de disciplina inválido' });
    }
    
    const discipline = await getDisciplineById(disciplineId);
    
    if (!discipline) {
      return res.status(404).json({ success: false, error: 'Disciplina não encontrada' });
    }
    
    // Retornar informações sobre ebook
    res.json({
      id: disciplineId,
      ebookPdfUrl: discipline.ebookInterativoUrl || discipline.apostilaPdfUrl,
      name: discipline.name,
      description: discipline.description
    });
  } catch (error) {
    console.error('Erro ao buscar ebook da disciplina:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

/**
 * Rota para obter questões/simulado de uma disciplina
 */
router.get('/api/disciplines/:id/questions', async (req, res) => {
  try {
    const { id } = req.params;
    const disciplineId = validateDisciplineId(id);
    
    if (!disciplineId) {
      return res.status(400).json({ success: false, error: 'ID de disciplina inválido' });
    }
    
    // Verificar se a disciplina existe
    const discipline = await getDisciplineById(disciplineId);
    
    if (!discipline) {
      return res.status(404).json({ success: false, error: 'Disciplina não encontrada' });
    }
    
    // Como não temos questões no banco, retornamos um array vazio por enquanto
    res.json([]);
  } catch (error) {
    console.error('Erro ao buscar questões da disciplina:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

/**
 * Rota para obter avaliações de uma disciplina
 */
router.get('/api/disciplines/:id/assessments', async (req, res) => {
  try {
    const { id } = req.params;
    const disciplineId = validateDisciplineId(id);
    
    if (!disciplineId) {
      return res.status(400).json({ success: false, error: 'ID de disciplina inválido' });
    }
    
    // Verificar se a disciplina existe
    const discipline = await getDisciplineById(disciplineId);
    
    if (!discipline) {
      return res.status(404).json({ success: false, error: 'Disciplina não encontrada' });
    }
    
    // Como não temos avaliações no banco, retornamos um array vazio por enquanto
    res.json([]);
  } catch (error) {
    console.error('Erro ao buscar avaliações da disciplina:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

/**
 * Rota para editar vídeo de uma disciplina
 */
router.put('/admin/discipline-videos/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { title, description, videoSource, url, duration, disciplineId } = req.body;
    
    // Validar ID da disciplina
    const numDisciplineId = validateDisciplineId(disciplineId?.toString());
    if (!numDisciplineId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de disciplina inválido' 
      });
    }
    
    // Validar ID do vídeo
    const numVideoId = parseInt(videoId, 10);
    if (isNaN(numVideoId) || numVideoId < 1 || numVideoId > 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de vídeo inválido. Deve ser um número entre 1 e 10' 
      });
    }
    
    // Validar dados da requisição
    if (!title || !videoSource || !url) {
      return res.status(400).json({ 
        success: false, 
        error: 'Dados incompletos. Título, fonte de vídeo e URL são obrigatórios' 
      });
    }
    
    // Buscar a disciplina
    const discipline = await getDisciplineById(numDisciplineId);
    if (!discipline) {
      return res.status(404).json({ 
        success: false, 
        error: 'Disciplina não encontrada' 
      });
    }
    
    // Atualizar a disciplina com o vídeo editado
    const urlKey = `videoAula${numVideoId}Url`;
    const sourceKey = `videoAula${numVideoId}Source`;
    
    const [updatedDiscipline] = await db.update(disciplines)
      .set({ 
        [urlKey]: url,
        [sourceKey]: videoSource,
        updatedAt: new Date()
      })
      .where(eq(disciplines.id, numDisciplineId))
      .returning();
    
    if (!updatedDiscipline) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao atualizar disciplina' 
      });
    }
    
    // Retornar sucesso
    return res.status(200).json({ 
      success: true, 
      message: 'Vídeo atualizado com sucesso',
      video: {
        id: numVideoId,
        title,
        url,
        videoSource,
        duration
      }
    });
  } catch (error) {
    console.error('Erro ao editar vídeo:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor ao editar vídeo'
    });
  }
});

/**
 * Rota para excluir vídeo de uma disciplina
 */
router.delete('/admin/discipline-videos/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { disciplineId } = req.query;
    
    // Validar ID da disciplina
    if (!disciplineId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de disciplina é obrigatório' 
      });
    }
    
    const disciplineIdStr = Array.isArray(disciplineId) ? disciplineId[0] : disciplineId.toString();
    const numDisciplineId = validateDisciplineId(disciplineIdStr);
    
    if (!numDisciplineId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de disciplina inválido' 
      });
    }
    
    // Validar ID do vídeo
    const numVideoId = parseInt(videoId, 10);
    if (isNaN(numVideoId) || numVideoId < 1 || numVideoId > 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de vídeo inválido. Deve ser um número entre 1 e 10' 
      });
    }
    
    // Buscar a disciplina
    const discipline = await getDisciplineById(numDisciplineId);
    if (!discipline) {
      return res.status(404).json({ 
        success: false, 
        error: 'Disciplina não encontrada' 
      });
    }
    
    // Remover o vídeo da disciplina (definindo os campos como null)
    const urlKey = `videoAula${numVideoId}Url`;
    const sourceKey = `videoAula${numVideoId}Source`;
    
    const [updatedDiscipline] = await db.update(disciplines)
      .set({ 
        [urlKey]: null,
        [sourceKey]: null,
        updatedAt: new Date()
      })
      .where(eq(disciplines.id, numDisciplineId))
      .returning();
    
    if (!updatedDiscipline) {
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao excluir vídeo da disciplina' 
      });
    }
    
    // Retornar sucesso
    return res.status(200).json({ 
      success: true, 
      message: 'Vídeo excluído com sucesso',
      videoId: numVideoId
    });
  } catch (error) {
    console.error('Erro ao excluir vídeo:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

export default router;