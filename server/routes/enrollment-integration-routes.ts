import express from 'express';
import enrollmentIntegrationController from '../controllers/enrollment-integration-controller';
import { isAuthenticated } from '../middleware/auth-middleware';

const router = express.Router();

/**
 * Rotas para integração de matrículas simplificadas
 * Base: /api/enrollment-integration
 */

// Middleware de autenticação
router.use(isAuthenticated);

/**
 * @route POST /api/enrollment-integration/process-pending
 * @desc Processa todas as matrículas simplificadas pendentes
 * @access Private (Admin/Manager)
 */
router.post('/process-pending', enrollmentIntegrationController.processPendingEnrollments);

/**
 * @route POST /api/enrollment-integration/sync/:enrollmentId
 * @desc Sincroniza uma matrícula simplificada específica
 * @access Private (Admin/Manager)
 */
router.post('/sync/:enrollmentId', enrollmentIntegrationController.syncEnrollment);

/**
 * @route POST /api/enrollment-integration/recover-incomplete
 * @desc Recupera matrículas com problemas de conversão
 * @access Private (Admin/Manager)
 */
router.post('/recover-incomplete', enrollmentIntegrationController.recoverIncompleteEnrollments);

/**
 * @route GET /api/enrollment-integration/status
 * @desc Verifica o status do serviço de integração
 * @access Private (Admin/Manager)
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'Serviço de integração de matrículas está ativo',
    info: {
      version: '1.1.0',
      features: [
        'Criação automática de perfis de estudantes',
        'Geração de contratos educacionais',
        'Envio de credenciais por e-mail',
        'Envio de credenciais por SMS',
        'Recuperação automática de matrículas com problemas de conversão'
      ]
    }
  });
});

export default router;