
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { hasPermission } from '../middleware/permissions';
import * as pedagogicoController from '../controllers/pedagogico-controller';

const router = Router();

// Rotas para vídeo-aulas
router.get('/disciplinas/:id/videos', 
  requireAuth,
  pedagogicoController.getVideos
);

router.post('/disciplinas/:id/videos', 
  requireAuth,
  hasPermission('discipline:content:edit'),
  pedagogicoController.addVideo
);

router.delete('/disciplinas/:id/videos/:videoId', 
  requireAuth,
  hasPermission('discipline:content:edit'),
  pedagogicoController.removeVideo
);

// Rotas para e-book estático
router.get('/disciplinas/:id/ebook-estatico', 
  requireAuth,
  pedagogicoController.getEbookEstatico
);

router.post('/disciplinas/:id/ebook-estatico', 
  requireAuth,
  hasPermission('discipline:content:edit'),
  pedagogicoController.addEbookEstatico
);

// Rotas para e-book interativo
router.get('/disciplinas/:id/ebook-interativo', 
  requireAuth,
  pedagogicoController.getEbookInterativo
);

router.post('/disciplinas/:id/ebook-interativo', 
  requireAuth,
  hasPermission('discipline:content:edit'),
  pedagogicoController.addEbookInterativo
);

// Rotas para simulado
router.get('/disciplinas/:id/simulado', 
  requireAuth,
  pedagogicoController.getSimulado
);

router.post('/disciplinas/:id/simulado', 
  requireAuth,
  hasPermission('discipline:content:edit'),
  pedagogicoController.addQuestaoSimulado
);

router.put('/disciplinas/:id/simulado/:questaoId', 
  requireAuth,
  hasPermission('discipline:content:edit'),
  pedagogicoController.updateQuestaoSimulado
);

router.delete('/disciplinas/:id/simulado/:questaoId', 
  requireAuth,
  hasPermission('discipline:content:edit'),
  pedagogicoController.removeQuestaoSimulado
);

// Rotas para avaliação final
router.get('/disciplinas/:id/avaliacao-final', 
  requireAuth,
  pedagogicoController.getAvaliacaoFinal
);

router.post('/disciplinas/:id/avaliacao-final', 
  requireAuth,
  hasPermission('discipline:content:edit'),
  pedagogicoController.addQuestaoAvaliacaoFinal
);

router.put('/disciplinas/:id/avaliacao-final/:questaoId', 
  requireAuth,
  hasPermission('discipline:content:edit'),
  pedagogicoController.updateQuestaoAvaliacaoFinal
);

router.delete('/disciplinas/:id/avaliacao-final/:questaoId', 
  requireAuth,
  hasPermission('discipline:content:edit'),
  pedagogicoController.removeQuestaoAvaliacaoFinal
);

// Rota para verificação de completude
router.get('/disciplinas/:id/completude', 
  requireAuth,
  pedagogicoController.getCompletude
);

export default router;
