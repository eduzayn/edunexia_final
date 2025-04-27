
import { Router } from 'express';
import { createDiscipline, updateDiscipline, deleteDiscipline } from '../controllers/disciplines-controller';
import { requireAuth } from '../middleware/auth';
import { hasPermission } from '../middleware/permissions';
import { storage } from '../storage';

const router = Router();

// Rota para criar disciplina - qualquer usuário com permissão de criar disciplinas
router.post('/disciplines', 
  requireAuth,
  hasPermission('discipline:create'),
  createDiscipline
);

// Rota para atualizar disciplina - verificação de admin para editar código está no controller
router.put('/disciplines/:id', 
  requireAuth,
  hasPermission('discipline:update'),
  updateDiscipline
);

// Rota para excluir disciplina
router.delete('/disciplines/:id',
  requireAuth,
  hasPermission('discipline:delete'),
  deleteDiscipline
);

// Também adicionar as rotas sem o prefixo 'admin' para compatibilidade
// Rota GET para listar disciplinas
router.get('/admin/disciplines', 
  requireAuth,
  async (req, res) => {
    try {
      console.log('GET /api/admin/disciplines - Listando todas as disciplinas');
      // Garantir que a resposta seja JSON
      res.setHeader('Content-Type', 'application/json');
      
      const disciplines = await storage.getAllDisciplines();
      console.log(`Retornando ${disciplines.length} disciplinas`);
      return res.json(disciplines);
    } catch (error) {
      console.error("Erro ao listar disciplinas:", error);
      return res.status(500).json({ 
        message: "Erro ao listar disciplinas",
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
);

// Rota GET para obter uma disciplina específica
router.get('/admin/disciplines/:id',
  requireAuth,
  async (req, res) => {
    try {
      console.log(`GET /api/admin/disciplines/${req.params.id} - Obtendo disciplina específica`);
      // Garantir que a resposta seja JSON
      res.setHeader('Content-Type', 'application/json');
      
      const id = parseInt(req.params.id);
      const discipline = await storage.getDiscipline(id);
      
      if (!discipline) {
        return res.status(404).json({ message: "Disciplina não encontrada" });
      }
      
      return res.json(discipline);
    } catch (error) {
      console.error("Erro ao buscar disciplina:", error);
      return res.status(500).json({ 
        message: "Erro ao buscar disciplina",
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
);

router.post('/admin/disciplines', 
  requireAuth,
  hasPermission('discipline:create'),
  createDiscipline
);

router.put('/admin/disciplines/:id', 
  requireAuth,
  hasPermission('discipline:update'),
  updateDiscipline
);

router.delete('/admin/disciplines/:id',
  requireAuth,
  hasPermission('discipline:delete'),
  deleteDiscipline
);

export default router;
