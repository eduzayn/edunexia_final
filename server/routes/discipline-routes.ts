
import { Router } from 'express';
import { createDiscipline, updateDiscipline } from '../controllers/disciplines-controller';
import { authMiddleware } from '../middleware/auth-middleware';
import { permissionMiddleware } from '../middleware/permission-middleware';

const router = Router();

// Rota para criar disciplina - qualquer usuário com permissão de criar disciplinas
router.post('/disciplines', 
  authMiddleware,
  permissionMiddleware('discipline:create'),
  createDiscipline
);

// Rota para atualizar disciplina - verificação de admin para editar código está no controller
router.put('/disciplines/:id', 
  authMiddleware,
  permissionMiddleware('discipline:update'),
  updateDiscipline
);

export default router;
