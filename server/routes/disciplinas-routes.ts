import { Router } from 'express';
import { 
  listarDisciplinas, 
  obterDisciplina, 
  criarDisciplina, 
  atualizarDisciplina, 
  excluirDisciplina,
  verificarCompletude
} from '../api/disciplinas';

const router = Router();

// Rotas para disciplinas
router.get('/disciplinas', listarDisciplinas);
router.get('/disciplinas/:id', obterDisciplina);
router.post('/disciplinas', criarDisciplina);
router.put('/disciplinas/:id', atualizarDisciplina);
router.delete('/disciplinas/:id', excluirDisciplina);

// Rota para verificar completude da disciplina
router.get('/disciplinas/:id/completeness', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: 'ID inválido'
    });
  }
  
  // Mock de resposta para verificação de completude
  const resultado = {
    isComplete: false,
    components: {
      videos: {
        status: true,
        count: 2,
        required: 1,
        message: 'Pelo menos um vídeo disponível'
      },
      ebooks: {
        status: false,
        count: 0,
        required: 1,
        message: 'Adicione pelo menos um e-book'
      },
      simulado: {
        status: false,
        count: 3,
        required: 5,
        message: 'O simulado precisa ter no mínimo 5 questões'
      },
      avaliacao: {
        status: false,
        count: 0,
        required: 10,
        message: 'Adicione uma avaliação final com 10 questões'
      }
    }
  };
  
  return res.status(200).json({
    success: true,
    message: 'Verificação de completude realizada com sucesso',
    data: resultado
  });
});

export default router;