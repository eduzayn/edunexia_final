import { Request, Response } from 'express';
import enrollmentIntegrationService from '../services/enrollment-integration-service';

/**
 * Controlador para integração de matrículas simplificadas
 * Responsável por:
 * 1. Processar matrículas pendentes
 * 2. Sincronizar matrícula específica
 * 3. Recuperar matrículas com problemas de conversão
 */
export class EnrollmentIntegrationController {
  
  /**
   * Processa todas as matrículas simplificadas pendentes
   * @param req Requisição
   * @param res Resposta
   */
  async processPendingEnrollments(req: Request, res: Response) {
    try {
      // Verificar permissão do usuário (apenas administradores)
      if (req.user?.role !== 'admin' && req.user?.role !== 'manager') {
        return res.status(403).json({
          success: false,
          message: 'Permissão negada. Apenas administradores podem executar esta operação.'
        });
      }
      
      // Processar matrículas pendentes
      const result = await enrollmentIntegrationService.processPendingEnrollments();
      
      return res.status(200).json({
        success: true,
        message: `Processamento concluído. Matrículas processadas: ${result.processed}, falhas: ${result.failed}`,
        data: result
      });
    } catch (error) {
      console.error('Erro ao processar matrículas pendentes:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar matrículas pendentes',
        error: (error as Error).message
      });
    }
  }
  
  /**
   * Sincroniza uma matrícula simplificada específica
   * @param req Requisição
   * @param res Resposta
   */
  async syncEnrollment(req: Request, res: Response) {
    try {
      const { enrollmentId } = req.params;
      
      // Verificar se o ID foi fornecido
      if (!enrollmentId) {
        return res.status(400).json({
          success: false,
          message: 'ID da matrícula não informado'
        });
      }
      
      // Verificar permissão do usuário (apenas administradores)
      if (req.user?.role !== 'admin' && req.user?.role !== 'manager') {
        return res.status(403).json({
          success: false,
          message: 'Permissão negada. Apenas administradores podem executar esta operação.'
        });
      }
      
      // Sincronizar matrícula
      const success = await enrollmentIntegrationService.syncSimplifiedEnrollment(Number(enrollmentId));
      
      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'Não foi possível sincronizar a matrícula'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Matrícula sincronizada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao sincronizar matrícula:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao sincronizar matrícula',
        error: (error as Error).message
      });
    }
  }
  
  /**
   * Recupera matrículas com problemas de conversão
   * Identifica e corrige matrículas que deveriam ter sido convertidas mas não foram
   * @param req Requisição
   * @param res Resposta
   */
  async recoverIncompleteEnrollments(req: Request, res: Response) {
    try {
      // Verificar permissão do usuário (apenas administradores)
      if (req.user?.role !== 'admin' && req.user?.role !== 'manager') {
        return res.status(403).json({
          success: false,
          message: 'Permissão negada. Apenas administradores podem executar esta operação.'
        });
      }
      
      // Recuperar matrículas com problemas
      const result = await enrollmentIntegrationService.recoverIncompleteEnrollments();
      
      return res.status(200).json({
        success: true,
        message: `Recuperação concluída. Matrículas recuperadas: ${result.recovered}, falhas: ${result.failed}`,
        data: result
      });
    } catch (error) {
      console.error('Erro ao recuperar matrículas incompletas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao recuperar matrículas incompletas',
        error: (error as Error).message
      });
    }
  }
}

export default new EnrollmentIntegrationController();