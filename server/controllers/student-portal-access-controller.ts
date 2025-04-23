import { storage } from '../storage';
import { Request, Response } from 'express';
import { accessTypeEnum, Enrollment } from '@shared/schema';

// Adiciona as definições de tipos para auth no Request
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: number;
        userRole: string;
      };
    }
  }
}

/**
 * Controller para gerenciamento de acesso de alunos ao portal
 * Este controller implementa os mecanismos para provisionar, atualizar 
 * e bloquear o acesso de alunos ao portal.
 */

// Provisiona o acesso inicial ao portal do aluno
export async function provisionStudentAccess(req: Request, res: Response) {
  try {
    const enrollmentId = parseInt(req.params.id);

    if (isNaN(enrollmentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID da matrícula inválido'
      });
    }

    // Busca a matrícula
    const enrollment = await storage.getEnrollment(enrollmentId);
    
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Matrícula não encontrada'
      });
    }

    // Verifica se o aluno já tem acesso
    if (enrollment.accessGrantedAt) {
      return res.status(400).json({
        success: false,
        message: 'Acesso já foi provisionado para este aluno',
        accessGrantedAt: enrollment.accessGrantedAt,
        accessExpiresAt: enrollment.accessExpiresAt
      });
    }

    // Verifica as regras de acesso da instituição
    const institution = await storage.getInstitution(enrollment.institutionId);
    
    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Instituição não encontrada'
      });
    }

    // Determina se pode provisionar acesso com base no status da matrícula e regras da instituição
    let canGrantAccess = false;
    let denyReason = '';
    
    // Regra 1: Se a matrícula estiver bloqueada, não concede acesso
    if (enrollment.status === 'blocked') {
      canGrantAccess = false;
      denyReason = 'Matrícula bloqueada';
    }
    // Regra 2: Se a matrícula estiver cancelada, não concede acesso
    else if (enrollment.status === 'cancelled') {
      canGrantAccess = false;
      denyReason = 'Matrícula cancelada';
    }
    // Regra 3: Se a matrícula estiver aguardando pagamento e a regra for confirmação de pagamento
    else if (enrollment.status === 'waiting_payment' && 
             institution.enrollmentAccessType === 'after_payment_confirmation') {
      canGrantAccess = false;
      denyReason = 'Aguardando confirmação de pagamento conforme regra da instituição';
    }
    // Em todos os outros casos, concede acesso
    else {
      canGrantAccess = true;
    }

    // Se não puder conceder acesso, retorna o motivo
    if (!canGrantAccess) {
      return res.status(403).json({
        success: false,
        message: 'Não é possível conceder acesso ao portal',
        reason: denyReason
      });
    }

    // Define as datas de acesso
    const now = new Date();
    let accessExpiresAt = null;
    
    // Se houver período de acesso definido na instituição, calcula a data de expiração
    if (institution.accessPeriodDays) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + institution.accessPeriodDays);
      accessExpiresAt = expirationDate;
    }

    // Atualiza o status e as datas de acesso na matrícula
    // Remova temporariamente o updatedById para evitar o erro de chave estrangeira
    const updatedEnrollment = await storage.updateEnrollment(enrollmentId, {
      accessGrantedAt: now,
      accessExpiresAt,
      updatedAt: now
    });

    // Registra a concessão de acesso no histórico
    try {
      await storage.addEnrollmentStatusHistory({
        enrollmentId,
        previousStatus: enrollment.status,
        newStatus: enrollment.status, // Mantém o status, só atualiza o acesso
        changeReason: 'Acesso ao portal concedido',
        changedById: undefined, // Removendo referência ao ID do usuário para evitar erro de chave estrangeira
        metadata: {
          accessGrantedAt: now,
          accessExpiresAt
        }
      });
    } catch (historyError) {
      console.warn('Erro ao registrar histórico de provisionamento, mas acesso foi atualizado:', historyError);
    }

    return res.status(200).json({
      success: true,
      message: 'Acesso ao portal concedido com sucesso',
      enrollment: updatedEnrollment
    });
  } catch (error) {
    console.error('Erro ao provisionar acesso ao portal:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao processar o provisionamento de acesso'
    });
  }
}

// Atualiza o período de acesso ao portal do aluno
export async function updateAccessPeriod(req: Request, res: Response) {
  try {
    const enrollmentId = parseInt(req.params.id);
    const { expiresAt } = req.body;

    if (isNaN(enrollmentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID da matrícula inválido'
      });
    }

    if (!expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Data de expiração é obrigatória'
      });
    }

    // Busca a matrícula
    const enrollment = await storage.getEnrollment(enrollmentId);
    
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Matrícula não encontrada'
      });
    }

    // Verifica se o aluno já tem acesso
    if (!enrollment.accessGrantedAt) {
      return res.status(400).json({
        success: false,
        message: 'Acesso ainda não foi provisionado para este aluno'
      });
    }

    // Atualiza a data de expiração
    const expirationDate = new Date(expiresAt);
    const updatedEnrollment = await storage.updateEnrollment(enrollmentId, {
      accessExpiresAt: expirationDate,
      updatedAt: new Date()
    });

    // Registra a atualização no histórico
    await storage.addEnrollmentStatusHistory({
      enrollmentId,
      previousStatus: enrollment.status,
      newStatus: enrollment.status, // Mantém o status, só atualiza o acesso
      changeReason: 'Período de acesso ao portal atualizado',
      changedById: req.auth?.userId || null,
      metadata: {
        previousExpiresAt: enrollment.accessExpiresAt,
        newExpiresAt: expirationDate
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Período de acesso atualizado com sucesso',
      enrollment: updatedEnrollment
    });
  } catch (error) {
    console.error('Erro ao atualizar período de acesso:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao processar a atualização do período de acesso'
    });
  }
}

// Bloqueia temporariamente o acesso ao portal do aluno
export async function blockAccess(req: Request, res: Response) {
  try {
    const enrollmentId = parseInt(req.params.id);
    const { reason, durationDays } = req.body;

    if (isNaN(enrollmentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID da matrícula inválido'
      });
    }

    // Busca a matrícula
    const enrollment = await storage.getEnrollment(enrollmentId);
    
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Matrícula não encontrada'
      });
    }

    // Calcula a data de fim do bloqueio, se fornecida
    let blockEndsAt = null;
    if (durationDays && durationDays > 0) {
      blockEndsAt = new Date();
      blockEndsAt.setDate(blockEndsAt.getDate() + durationDays);
    }

    const now = new Date();
    const previousStatus = enrollment.status;
    const blockReasonText = reason || 'Bloqueio administrativo';
    
    // Combinar as duas atualizações em uma única operação
    try {
      // Primeiro atualiza os campos específicos de bloqueio
      const updatedEnrollment = await storage.updateEnrollment(enrollmentId, {
        status: 'blocked', // Definimos o status diretamente
        blockExecutedAt: now,
        blockEndsAt: blockEndsAt,
        blockReason: blockReasonText,
        updatedAt: now
      });
      
      // Registra no histórico sem usar o método updateEnrollmentStatus
      try {
        await storage.addEnrollmentStatusHistory({
          enrollmentId,
          previousStatus,
          newStatus: 'blocked',
          changeReason: blockReasonText,
          changedById: undefined, // Usando undefined para evitar erro de chave estrangeira
          metadata: { blockEndsAt, blockedAt: now }
        });
      } catch (historyError) {
        console.warn('Erro ao registrar histórico de bloqueio, mas o bloqueio foi executado:', historyError);
      }

      return res.status(200).json({
        success: true,
        message: 'Acesso bloqueado com sucesso',
        enrollment: {
          ...updatedEnrollment,
          blockExecutedAt: now,
          blockEndsAt: blockEndsAt,
          blockReason: blockReasonText
        },
        previousStatus,
        isTemporary: blockEndsAt !== null
      });
    } catch (dbError) {
      console.error('Erro ao atualizar matrícula no banco de dados:', dbError);
      throw dbError; // Re-lança o erro para ser capturado pelo catch externo
    }
  } catch (error) {
    console.error('Erro ao bloquear acesso:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao processar o bloqueio de acesso'
    });
  }
}

// Remove o bloqueio de acesso ao portal do aluno
export async function unblockAccess(req: Request, res: Response) {
  try {
    const enrollmentId = parseInt(req.params.id);
    const { reason } = req.body;

    if (isNaN(enrollmentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID da matrícula inválido'
      });
    }

    // Busca a matrícula
    const enrollment = await storage.getEnrollment(enrollmentId);
    
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Matrícula não encontrada'
      });
    }

    // Verifica se a matrícula está bloqueada
    if (enrollment.status !== 'blocked') {
      return res.status(400).json({
        success: false,
        message: 'Matrícula não está bloqueada'
      });
    }

    const now = new Date();
    const unblockReason = reason || 'Desbloqueio administrativo';
    
    try {
      // Atualiza o status e os campos de bloqueio em uma única operação
      const updatedEnrollment = await storage.updateEnrollment(enrollmentId, {
        status: 'active', // Definimos o status diretamente
        blockEndsAt: null,
        updatedAt: now
      });
      
      // Registra no histórico sem usar o método updateEnrollmentStatus
      try {
        await storage.addEnrollmentStatusHistory({
          enrollmentId,
          previousStatus: 'blocked',
          newStatus: 'active',
          changeReason: unblockReason,
          changedById: undefined, // Usando undefined para evitar erro de chave estrangeira
          metadata: { unblockedAt: now }
        });
      } catch (historyError) {
        console.warn('Erro ao registrar histórico de desbloqueio, mas o desbloqueio foi executado:', historyError);
      }

      return res.status(200).json({
        success: true,
        message: 'Acesso desbloqueado com sucesso',
        enrollment: updatedEnrollment,
        unblockedAt: now,
        reason: unblockReason
      });
    } catch (dbError) {
      console.error('Erro ao atualizar matrícula no banco de dados:', dbError);
      throw dbError; // Re-lança o erro para ser capturado pelo catch externo
    }
  } catch (error) {
    console.error('Erro ao desbloquear acesso:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao processar o desbloqueio de acesso'
    });
  }
}

// Verifica o status de acesso de um estudante específico
export async function checkAccessStatus(req: Request, res: Response) {
  try {
    const enrollmentId = parseInt(req.params.id);

    if (isNaN(enrollmentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID da matrícula inválido'
      });
    }

    // Busca a matrícula
    const enrollment = await storage.getEnrollment(enrollmentId);
    
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Matrícula não encontrada'
      });
    }

    // Busca o estudante
    const student = await storage.getUser(enrollment.studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Estudante não encontrado'
      });
    }

    // Busca as regras da instituição
    const institution = await storage.getInstitution(enrollment.institutionId);
    
    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Instituição não encontrada'
      });
    }

    // Verifica se o acesso está bloqueado
    const isBlocked = enrollment.status === 'blocked';
    
    // Verifica se o acesso expirou
    const now = new Date();
    const isExpired = enrollment.accessExpiresAt && enrollment.accessExpiresAt < now;
    
    // Verifica se o bloqueio temporário já acabou
    const blockHasEnded = isBlocked && enrollment.blockEndsAt && enrollment.blockEndsAt < now;
    
    // Determina o status de acesso atual
    let accessStatus = 'unknown';
    let accessStatusMessage = '';
    
    if (isBlocked && !blockHasEnded) {
      accessStatus = 'blocked';
      accessStatusMessage = enrollment.blockReason || 'Acesso bloqueado administrativamente';
      
      // Se for um bloqueio temporário, adiciona a data de fim
      if (enrollment.blockEndsAt) {
        accessStatusMessage += ` (Bloqueio termina em ${enrollment.blockEndsAt.toLocaleDateString()})`;
      }
    } else if (isExpired) {
      accessStatus = 'expired';
      accessStatusMessage = 'Acesso expirado';
    } else if (!enrollment.accessGrantedAt) {
      accessStatus = 'not_granted';
      accessStatusMessage = 'Acesso ainda não foi provisionado';
    } else {
      accessStatus = 'active';
      accessStatusMessage = 'Acesso ativo';
      
      // Se tiver data de expiração, adiciona
      if (enrollment.accessExpiresAt) {
        accessStatusMessage += ` (Expira em ${enrollment.accessExpiresAt.toLocaleDateString()})`;
      } else {
        accessStatusMessage += ' (Sem data de expiração)';
      }
    }

    // Prepara resposta
    const accessInfo = {
      studentId: enrollment.studentId,
      studentName: student.fullName,
      studentEmail: student.email,
      enrollmentId: enrollment.id,
      courseId: enrollment.courseId,
      institutionId: enrollment.institutionId,
      accessStatus,
      accessStatusMessage,
      details: {
        enrollmentStatus: enrollment.status,
        accessGrantedAt: enrollment.accessGrantedAt,
        accessExpiresAt: enrollment.accessExpiresAt,
        isBlocked,
        blockReason: enrollment.blockReason,
        blockExecutedAt: enrollment.blockExecutedAt,
        blockEndsAt: enrollment.blockEndsAt,
        isExpired,
        blockHasEnded,
        institutionAccessType: institution.enrollmentAccessType,
        institutionAccessPeriodDays: institution.accessPeriodDays
      }
    };

    return res.status(200).json({
      success: true,
      accessInfo
    });
  } catch (error) {
    console.error('Erro ao verificar status de acesso:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao verificar status de acesso'
    });
  }
}