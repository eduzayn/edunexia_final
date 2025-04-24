/**
 * Webhook para receber notificações do Asaas sobre pagamentos
 * e processar automaticamente matrículas simplificadas
 */

import express from 'express';
import { storage } from '../storage';
import { accessTypeEnum } from '@shared/schema';

const router = express.Router();

/**
 * Processa a matrícula simplificada após receber notificação de pagamento
 * Inclui a lógica para respeitar o modelo de negócio da instituição:
 * - Algumas instituições liberam acesso após o link ser preenchido
 * - Outras aguardam a confirmação do pagamento
 */
async function processSimplifiedEnrollment(externalReference: string, paymentEvent: string, paymentId: string) {
  try {
    console.log(`[ASAAS WEBHOOK] Processando matrícula com ref: ${externalReference}`);
    
    // Localizar a matrícula simplificada pelo externalReference
    const enrollment = await storage.getSimplifiedEnrollmentByExternalReference(externalReference);
    
    if (!enrollment) {
      console.error(`[ASAAS WEBHOOK] Matrícula não encontrada para referência: ${externalReference}`);
      return { success: false, message: 'Matrícula não encontrada' };
    }
    
    console.log(`[ASAAS WEBHOOK] Matrícula localizada ID: ${enrollment.id}, status atual: ${enrollment.status}`);
    
    // Verificar se matrícula já foi convertida ou já está com pagamento confirmado
    if (enrollment.convertedEnrollmentId) {
      console.log(`[ASAAS WEBHOOK] Matrícula já foi convertida anteriormente: ${enrollment.convertedEnrollmentId}`);
      return { success: true, message: 'Matrícula já convertida anteriormente', alreadyProcessed: true };
    }
    
    if (enrollment.status === 'payment_confirmed') {
      console.log(`[ASAAS WEBHOOK] Pagamento já foi confirmado anteriormente`);
      return { success: true, message: 'Pagamento já confirmado anteriormente', alreadyProcessed: true };
    }
    
    // Verificar evento de pagamento e atualizar status
    let shouldConvert = false;
    
    if (paymentEvent === 'PAYMENT_CONFIRMED' || paymentEvent === 'PAYMENT_RECEIVED') {
      // Atualizar o status da matrícula para payment_confirmed
      console.log(`[ASAAS WEBHOOK] Atualizando status para payment_confirmed`);
      
      await storage.updateSimplifiedEnrollmentStatus(
        enrollment.id, 
        'payment_confirmed',
        `Pagamento confirmado via webhook Asaas (${paymentEvent})`,
        undefined, // sem usuário específico
        { paymentId, paymentEvent }
      );
      
      // Buscar a instituição para verificar a regra de acesso
      const institution = await storage.getInstitution(enrollment.institutionId);
      
      if (!institution) {
        console.error(`[ASAAS WEBHOOK] Instituição não encontrada: ${enrollment.institutionId}`);
        return { success: false, message: 'Instituição não encontrada' };
      }
      
      // Verificar se devemos converter baseado na regra da instituição
      if (institution.enrollmentAccessType === accessTypeEnum.enum.after_payment_confirmation) {
        // Nesta regra, converte apenas após pagamento confirmado, o que ocorreu agora
        shouldConvert = true;
        console.log(`[ASAAS WEBHOOK] Regra da instituição: converter após pagamento`);
      } else {
        // Para a regra "after_link_completion", a conversão deve ter sido feita logo após o link ser preenchido
        // Porém, por segurança, verificamos se foi convertida e, se não foi, convertemos agora
        shouldConvert = !enrollment.convertedEnrollmentId;
        console.log(`[ASAAS WEBHOOK] Regra da instituição: converter após link preenchido, status atual da conversão: ${shouldConvert ? 'pendente' : 'já realizada'}`);
      }
    } else if (paymentEvent === 'PAYMENT_OVERDUE') {
      // Pagamento atrasado - não converter, apenas registrar
      console.log(`[ASAAS WEBHOOK] Pagamento atrasado, atualizando status`);
      
      await storage.updateSimplifiedEnrollmentStatus(
        enrollment.id, 
        'waiting_payment',
        `Pagamento atrasado via webhook Asaas (${paymentEvent})`,
        undefined,
        { paymentId, paymentEvent }
      );
    } else if (paymentEvent === 'PAYMENT_DELETED' || paymentEvent === 'PAYMENT_REFUNDED') {
      // Pagamento cancelado/estornado - não converter, registrar cancelamento
      console.log(`[ASAAS WEBHOOK] Pagamento cancelado/estornado, atualizando status`);
      
      await storage.updateSimplifiedEnrollmentStatus(
        enrollment.id, 
        'cancelled',
        `Pagamento cancelado via webhook Asaas (${paymentEvent})`,
        undefined,
        { paymentId, paymentEvent }
      );
    }
    
    // Se determinamos que a matrícula deve ser convertida, fazemos isso agora
    if (shouldConvert) {
      console.log(`[ASAAS WEBHOOK] Iniciando conversão da matrícula simplificada para completa`);
      
      const newEnrollment = await storage.convertSimplifiedToFullEnrollment(enrollment.id);
      
      if (!newEnrollment) {
        console.error(`[ASAAS WEBHOOK] Erro ao converter matrícula: ${enrollment.id}`);
        return { success: false, message: 'Erro ao converter matrícula' };
      }
      
      console.log(`[ASAAS WEBHOOK] Matrícula convertida com sucesso! Nova ID: ${newEnrollment.id}`);
      
      // Criar perfil de estudante automaticamente com as informações da matrícula
      try {
        // Verificar se já existe um usuário com esse email
        const existingUser = await storage.getUserByUsername(enrollment.studentEmail);
        
        if (!existingUser) {
          console.log(`[ASAAS WEBHOOK] Criando perfil de estudante para: ${enrollment.studentName}`);
          
          // Usar CPF como senha inicial (ou gerar senha aleatória se não houver CPF)
          const initialPassword = enrollment.studentCpf ? 
            enrollment.studentCpf.replace(/[^\d]/g, '') : // remover pontos e traços
            Math.random().toString(36).slice(-8); // senha aleatória se não tiver CPF
          
          // Criar o usuário no sistema
          const newUser = await storage.createUser({
            username: enrollment.studentEmail,
            password: initialPassword,
            fullName: enrollment.studentName,
            email: enrollment.studentEmail,
            cpf: enrollment.studentCpf,
            phone: enrollment.studentPhone,
            portalType: 'student',
            status: 'active',
            asaasId: enrollment.asaasCustomerId || null
          });
          
          if (newUser) {
            console.log(`[ASAAS WEBHOOK] Perfil de estudante criado com sucesso! ID: ${newUser.id}`);
            
            // Importar serviços para envio de notificações
            const emailService = require('../services/email-service');
            const smsService = require('../services/sms-service');
            
            // Enviar email com as credenciais
            try {
              await emailService.sendStudentCredentialsEmail({
                to: newUser.email,
                name: newUser.fullName,
                username: newUser.username,
                password: initialPassword
              });
              console.log(`[ASAAS WEBHOOK] Email com credenciais enviado para: ${newUser.email}`);
            } catch (emailError) {
              console.error(`[ASAAS WEBHOOK] Erro ao enviar email com credenciais:`, emailError);
            }
            
            // Enviar SMS com as credenciais
            try {
              if (newUser.phone) {
                await smsService.sendStudentCredentialsSMS(
                  newUser.phone,
                  initialPassword,
                  newUser.fullName,
                  newUser.email
                );
                console.log(`[ASAAS WEBHOOK] SMS com credenciais enviado para: ${newUser.phone}`);
              }
            } catch (smsError) {
              console.error(`[ASAAS WEBHOOK] Erro ao enviar SMS com credenciais:`, smsError);
            }
            
            // Gerar contrato automaticamente
            try {
              const contractService = require('../services/contract-generator-service');
              const newContract = await contractService.generateContractFromEnrollment(
                newEnrollment.id, 
                newUser.id,
                enrollment.courseId
              );
              
              if (newContract) {
                console.log(`[ASAAS WEBHOOK] Contrato gerado automaticamente! ID: ${newContract.id}`);
              }
            } catch (contractError) {
              console.error(`[ASAAS WEBHOOK] Erro ao gerar contrato:`, contractError);
            }
          }
        } else {
          console.log(`[ASAAS WEBHOOK] Estudante já possui perfil no sistema: ${existingUser.id}`);
          
          // Gerar contrato automaticamente mesmo para usuário existente
          try {
            const contractService = require('../services/contract-generator-service');
            const newContract = await contractService.generateContractFromEnrollment(
              newEnrollment.id, 
              existingUser.id,
              enrollment.courseId
            );
            
            if (newContract) {
              console.log(`[ASAAS WEBHOOK] Contrato gerado automaticamente! ID: ${newContract.id}`);
            }
          } catch (contractError) {
            console.error(`[ASAAS WEBHOOK] Erro ao gerar contrato:`, contractError);
          }
        }
      } catch (profileError) {
        console.error(`[ASAAS WEBHOOK] Erro ao criar perfil de estudante:`, profileError);
      }
      
      return { 
        success: true, 
        message: 'Matrícula processada e convertida com sucesso', 
        convertedEnrollmentId: newEnrollment.id 
      };
    }
    
    return { 
      success: true, 
      message: 'Status da matrícula atualizado com sucesso', 
      newStatus: enrollment.status
    };
  } catch (error) {
    console.error('[ASAAS WEBHOOK] Erro ao processar matrícula:', error);
    return { 
      success: false, 
      message: 'Erro ao processar matrícula', 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

// Rota para webhook do Asaas
router.post('/payment-notification', async (req, res) => {
  try {
    console.log('[ASAAS WEBHOOK] Notificação de pagamento recebida:', req.body);
    
    // Verificar campos obrigatórios
    const { event, payment: paymentData } = req.body;
    
    if (!event || !paymentData) {
      console.error('[ASAAS WEBHOOK] Dados obrigatórios não encontrados na notificação');
      return res.status(400).json({ 
        error: 'Dados obrigatórios não encontrados'
      });
    }
    
    // Informações básicas do pagamento para registro
    const paymentId = paymentData.id || 'unknown';
    const paymentStatus = paymentData.status || 'unknown';
    const paymentValue = paymentData.value || 0;
    const externalReference = paymentData.externalReference || '';
    
    // Resposta básica para confirmação de recebimento
    console.log(`[ASAAS WEBHOOK] Evento: ${event} | ID: ${paymentId} | Status: ${paymentStatus} | Ref: ${externalReference}`);
    
    // Verificar se temos uma referência externa válida para processar
    if (!externalReference) {
      console.warn('[ASAAS WEBHOOK] Sem referência externa, ignorando processamento');
      return res.status(200).json({ 
        message: 'Notificação recebida, mas sem referência externa para processar',
        event,
        paymentId
      });
    }
    
    // Processar a matrícula simplificada associada a este pagamento
    const processingResult = await processSimplifiedEnrollment(externalReference, event, paymentId);
    
    // Responder ao webhook (sempre com sucesso 200 para evitar reenvios desnecessários)
    return res.status(200).json({ 
      message: 'Notificação processada com sucesso',
      event,
      paymentId,
      reference: externalReference,
      processingResult
    });
  } catch (error) {
    console.error('[ASAAS WEBHOOK] Erro ao processar notificação:', error);
    
    // Mesmo em caso de erro, respondemos com 200 para evitar reenvios
    // O erro é registrado em logs para investigação posterior
    return res.status(200).json({ 
      message: 'Notificação recebida, mas ocorreu um erro no processamento',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;