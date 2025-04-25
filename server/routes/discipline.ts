import { Router } from 'express';
import { db } from '../db';
import { disciplines } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * Rota para obter uma disciplina específica pelo ID
 * Retorna os detalhes completos da disciplina incluindo conteúdo
 */
router.get('/api/disciplines/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const disciplineId = parseInt(id, 10);
    
    if (isNaN(disciplineId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de disciplina inválido' 
      });
    }
    
    // Buscar a disciplina pelo ID usando Drizzle ORM
    const [discipline] = await db
      .select()
      .from(disciplines)
      .where(eq(disciplines.id, disciplineId));
    
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

export default router;