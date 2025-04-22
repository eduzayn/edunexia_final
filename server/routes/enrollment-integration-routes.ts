
import { Router } from 'express';
import { requireAuth } from '../middleware/auth-middleware';
import { EnrollmentIntegrationService } from '../services/enrollment-integration-service';

const router = Router();

/**
 * Rota para verificar integração de matrícula
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
    
    const result = await EnrollmentIntegrationService.verifyIntegration(enrollmentId);
    
    res.status(200).json({
      success: true,
      isIntegrated: result.isIntegrated,
      issues: result.issues
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
    
    const result = await EnrollmentIntegrationService.validateEnrollment(enrollmentId);
    
    if (result.isValid) {
      res.status(200).json({
        success: true,
        message: 'Matrícula válida'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Matrícula inválida'
      });
    }
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
    
    const success = await EnrollmentIntegrationService.syncSimplifiedEnrollment(simplifiedId);
    
    if (success) {
      res.status(200).json({
        success: true,
        message: 'Matrícula sincronizada com sucesso'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Não foi possível sincronizar a matrícula'
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

// Rota para resolver problemas de disciplinas em cursos
router.post('/courses/:id/fix-disciplines', requireAuth, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    
    if (isNaN(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de curso inválido'
      });
    }
    
    // Verificar disciplinas atuais
    const currentDisciplines = await db
      .select()
      .from(courseDisciplines)
      .where(eq(courseDisciplines.courseId, courseId));
      
    if (currentDisciplines.length === 0) {
      // Se não houver disciplinas, verificar se há dados temporários para restaurar
      const result = await EnrollmentIntegrationService.repairCourseDisciplines(courseId);
      
      return res.status(200).json({
        success: true,
        message: 'Verificação de disciplinas concluída',
        repaired: result,
        disciplinesCount: result ? 'recuperadas' : 'nenhuma recuperada'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Curso já possui disciplinas',
      disciplinesCount: currentDisciplines.length
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
