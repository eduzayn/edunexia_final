import { Router } from 'express';
import { 
  listarDisciplinas, 
  criarDisciplina, 
  obterDisciplina, 
  atualizarDisciplina, 
  excluirDisciplina 
} from '../api/disciplinas';

const router = Router();

// Rotas para disciplinas - simplificadas sem autenticação para desenvolvimento
router.get('/disciplinas', listarDisciplinas);
router.post('/disciplinas', criarDisciplina);
router.get('/disciplinas/:id', obterDisciplina);
router.put('/disciplinas/:id', atualizarDisciplina);
router.delete('/disciplinas/:id', excluirDisciplina);

export default router;