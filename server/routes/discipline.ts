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

export default router;