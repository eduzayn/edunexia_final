
import { Router } from 'express';
import { createDiscipline, updateDiscipline } from '../controllers/disciplines-controller';
import { requireAuth } from '../middleware/auth';
import { hasPermission } from '../middleware/permissions';

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

export default router;
