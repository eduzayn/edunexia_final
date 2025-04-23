import { storage } from '../storage';
import { Request, Response } from 'express';
import { accessTypeEnum } from '@shared/schema';

/**
 * Controller para conversão de matrículas simplificadas em matrículas completas
 * Este controller implementa a lógica de negócio para definição das regras de acesso
 * baseadas na configuração da instituição
 */
export async function convertSimplifiedEnrollment(req: Request, res: Response) {
  try {
    const enrollmentId = parseInt(req.params.id);

    if (isNaN(enrollmentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID da matrícula inválido'
      });
    }

    // Busca a matrícula simplificada
    const simplifiedEnrollment = await storage.getSimplifiedEnrollment(enrollmentId);
    
    if (!simplifiedEnrollment) {
      return res.status(404).json({
        success: false,
        message: 'Matrícula simplificada não encontrada'
      });
    }

    // Verifica se a matrícula já foi convertida
    if (simplifiedEnrollment.convertedEnrollmentId) {
      const existingEnrollment = await storage.getEnrollment(simplifiedEnrollment.convertedEnrollmentId);
      
      if (existingEnrollment) {
        return res.status(409).json({
          success: false,
          message: 'Matrícula já foi convertida anteriormente',
          enrollment: existingEnrollment
        });
      }
    }

    // Verifica as regras de acesso da instituição
    const institution = await storage.getInstitution(simplifiedEnrollment.institutionId);
    
    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Instituição não encontrada'
      });
    }

    // Define o status inicial da matrícula com base na regra de acesso
    let initialEnrollmentStatus = 'active';
    
    // Verificação das regras de acesso: após completar o link OU após confirmação do pagamento
    if (institution.enrollmentAccessType === accessTypeEnum.enum.after_payment_confirmation) {
      // Neste caso, só deve estar ativo se o pagamento estiver confirmado
      if (simplifiedEnrollment.status !== 'payment_confirmed') {
        initialEnrollmentStatus = 'waiting_payment';
      }
    } else {
      // Acesso após completar o link de pagamento (padrão)
      // Para este caso, se o pagamento já foi iniciado, concede o acesso
      if (simplifiedEnrollment.status === 'waiting_payment' || 
          simplifiedEnrollment.status === 'payment_confirmed') {
        initialEnrollmentStatus = 'active';
      } else if (simplifiedEnrollment.status === 'blocked') {
        initialEnrollmentStatus = 'blocked';
      }
    }

    // Executa a conversão
    const newEnrollment = await storage.convertSimplifiedToFullEnrollment(enrollmentId);
    
    if (!newEnrollment) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao converter matrícula'
      });
    }

    // Atualiza o status baseado nas regras definidas acima
    const finalEnrollment = await storage.updateEnrollmentStatus(
      newEnrollment.id,
      initialEnrollmentStatus,
      `Status inicial definido conforme regra de acesso da instituição: ${institution.enrollmentAccessType}`,
      req.auth?.userId || null
    );

    // Determina a data de acesso baseada nas regras da instituição
    let accessGrantedAt = null;
    let accessExpiresAt = null;
    
    // Se o status for ativo, define a data de acesso
    if (initialEnrollmentStatus === 'active') {
      accessGrantedAt = new Date();
      
      // Se houver período de acesso definido na instituição, calcula a data de expiração
      if (institution.accessPeriodDays) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + institution.accessPeriodDays);
        accessExpiresAt = expirationDate;
      }
      
      // Atualiza as datas de acesso na matrícula
      await storage.updateEnrollment(newEnrollment.id, {
        accessGrantedAt,
        accessExpiresAt
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Matrícula convertida com sucesso',
      enrollment: {
        ...finalEnrollment,
        accessGrantedAt,
        accessExpiresAt
      }
    });
  } catch (error) {
    console.error('Erro ao converter matrícula simplificada:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao processar a conversão da matrícula'
    });
  }
}