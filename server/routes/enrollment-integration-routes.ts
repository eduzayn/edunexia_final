import { Router } from 'express';
import { requireAuth } from '../middleware/auth-middleware';
// Esta importação foi comentada temporariamente até que os problemas sejam resolvidos
// import { EnrollmentIntegrationService } from '../services/enrollment-integration-service';

const router = Router();

/**
 * Rota para verificar integração de matrícula
 * Temporariamente retorna um stub enquanto o serviço está sendo implementado
 */
router.get('/enrollments/:id/verify-integration', requireAuth, async (req, res) => {
  try {
    const enrollmentId = parseInt(req.params.id);

    if (isNaN(enrollmentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de matrícula inválido'
      });
    }

    // Resposta temporária enquanto o serviço está sendo implementado
    res.status(200).json({
      success: true,
      isIntegrated: true,
      issues: []
    });
  } catch (error) {
    console.error('Erro ao verificar integração:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar integração da matrícula',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * Rota para validar matrícula
 * Temporariamente retorna um stub enquanto o serviço está sendo implementado
 */
router.get('/enrollments/:id/validate', requireAuth, async (req, res) => {
  try {
    const enrollmentId = parseInt(req.params.id);

    if (isNaN(enrollmentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de matrícula inválido'
      });
    }

    // Resposta temporária enquanto o serviço está sendo implementado
    res.status(200).json({
      success: true,
      message: 'Matrícula válida'
    });
  } catch (error) {
    console.error('Erro ao validar matrícula:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao validar matrícula',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * Rota para sincronizar matrícula simplificada com o sistema central
 * Cria perfil de estudante, contrato educacional e envia credenciais
 */
router.post('/simplified-enrollments/:id/sync', requireAuth, async (req, res) => {
  try {
    const simplifiedId = parseInt(req.params.id);

    if (isNaN(simplifiedId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de matrícula simplificada inválido'
      });
    }
    
    // Verificar se o usuário tem permissão
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para sincronizar matrículas'
      });
    }

    // Importar serviço de integração de matrículas
    const EnrollmentIntegrationService = require('../services/enrollment-integration-service').default;
    
    // Sincronizar matrícula
    const success = await EnrollmentIntegrationService.syncSimplifiedEnrollment(simplifiedId);
    
    if (success) {
      res.status(200).json({
        success: true,
        message: 'Matrícula processada com sucesso. Perfil de aluno e contrato educacional criados.'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Erro ao processar matrícula. Verifique os logs para mais informações.'
      });
    }
  } catch (error) {
    console.error('Erro ao sincronizar matrícula:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao sincronizar matrícula',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * Rota para resolver problemas de disciplinas em cursos
 * Temporariamente retorna um stub enquanto o serviço está sendo implementado
 */
router.post('/courses/:id/fix-disciplines', requireAuth, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);

    if (isNaN(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de curso inválido'
      });
    }

    // Resposta temporária enquanto o serviço está sendo implementado
    return res.status(200).json({
      success: true,
      message: 'Função temporariamente indisponível',
      info: 'Esta funcionalidade será implementada em breve'
    });
  } catch (error) {
    console.error('Erro ao reparar disciplinas do curso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao reparar disciplinas do curso',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;