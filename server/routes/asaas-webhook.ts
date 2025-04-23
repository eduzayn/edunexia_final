/**
 * Webhook para receber notificações do Asaas sobre pagamentos
 */

import express from 'express';
import { db } from '../db';
import { certificationRequests, certificationActivityLogs } from '@shared/certification-request-schema';
import { eq, and } from 'drizzle-orm';

const router = express.Router();

// Endpoint para receber notificações do Asaas
router.post('/', async (req, res) => {
  try {
    console.log('[WEBHOOK] Recebida notificação do Asaas:', JSON.stringify(req.body));
    
    // Verificar assinatura (em um ambiente de produção, validar a origem da requisição)
    // TODO: Implementar validação do token de autenticação do webhook
    
    const { event, payment } = req.body;
    
    if (!event || !payment) {
      return res.status(400).json({ message: 'Dados incompletos na notificação' });
    }
    
    // Obter a referência externa (informada na criação do pagamento)
    const externalReference = payment.externalReference;
    
    if (!externalReference || !externalReference.startsWith('cert-batch-')) {
      // Não é um pagamento relacionado à certificação
      return res.status(200).json({ message: 'Notificação recebida, mas não é uma certificação' });
    }
    
    // Extrair o ID do parceiro da referência externa (cert-batch-ID-TIMESTAMP)
    const parts = externalReference.split('-');
    if (parts.length < 3) {
      return res.status(400).json({ message: 'Formato inválido de referência externa' });
    }
    
    const partnerId = parseInt(parts[2]);
    
    // Buscar a solicitação de certificação pendente deste parceiro
    const pendingRequests = await db.query.certificationRequests.findMany({
      where: and(
        eq(certificationRequests.partnerId, partnerId),
        eq(certificationRequests.status, 'payment_pending')
      ),
      orderBy: [{ submittedAt: 'desc' }]
    });
    
    if (pendingRequests.length === 0) {
      return res.status(404).json({ 
        message: 'Nenhuma solicitação de certificação pendente encontrada para este parceiro' 
      });
    }
    
    // Assumir que é a solicitação mais recente (em um ambiente real, seria necessário
    // uma lógica mais robusta para identificar exatamente qual solicitação)
    const certRequest = pendingRequests[0];
    
    // Processar o evento
    let newStatus;
    let description;
    
    switch (event) {
      case 'PAYMENT_CONFIRMED':
        // Pagamento confirmado, atualizar status da solicitação
        newStatus = 'payment_confirmed';
        description = `Pagamento confirmado. ID do pagamento: ${payment.id}`;
        break;
        
      case 'PAYMENT_RECEIVED':
        // Pagamento recebido, atualizar status da solicitação
        newStatus = 'payment_confirmed';
        description = `Pagamento recebido. ID do pagamento: ${payment.id}`;
        break;
        
      case 'PAYMENT_OVERDUE':
        // Pagamento atrasado, manter o status atual
        description = `Pagamento atrasado. ID do pagamento: ${payment.id}`;
        break;
        
      case 'PAYMENT_DELETED':
      case 'PAYMENT_REFUNDED':
      case 'PAYMENT_CHARGEBACK_REQUESTED':
        // Pagamento cancelado, retornar ao status anterior
        newStatus = 'approved';
        description = `Pagamento cancelado/estornado. ID do pagamento: ${payment.id}`;
        break;
        
      default:
        // Outros eventos, apenas registrar
        description = `Evento de pagamento: ${event}. ID do pagamento: ${payment.id}`;
    }
    
    // Se houve mudança de status, atualizar a solicitação
    if (newStatus) {
      await db.update(certificationRequests)
        .set({
          status: newStatus,
          updatedAt: new Date(),
          paymentId: payment.id
        })
        .where(eq(certificationRequests.id, certRequest.id));
    }
    
    // Registrar atividade
    await db.insert(certificationActivityLogs).values({
      requestId: certRequest.id,
      action: `payment_${event.toLowerCase()}`,
      description,
      performedAt: new Date()
    });
    
    // Se o pagamento foi confirmado, podemos iniciar o processamento automaticamente
    if (newStatus === 'payment_confirmed') {
      // Atualizar a solicitação para processamento
      await db.update(certificationRequests)
        .set({
          status: 'processing',
          updatedAt: new Date()
        })
        .where(eq(certificationRequests.id, certRequest.id));
      
      // Registrar o início do processamento
      await db.insert(certificationActivityLogs).values({
        requestId: certRequest.id,
        action: 'status_processing',
        description: 'Iniciando processamento automático de certificados',
        performedAt: new Date()
      });
      
      // Iniciar o processamento dos certificados de forma assíncrona
      // Chamar o endpoint de processamento em background
      fetch(`${process.env.BASE_URL || 'http://localhost:5000'}/api/certification-requests/${certRequest.id}/process-certificates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Incluir um token de autorização interno para bypass de autenticação
          'X-Internal-Auth': process.env.INTERNAL_API_TOKEN || 'default-secure-token'
        }
      }).catch(error => {
        console.error('[WEBHOOK] Erro ao chamar endpoint de processamento:', error);
      });
    }
    
    return res.status(200).json({ 
      message: 'Notificação processada com sucesso',
      requestId: certRequest.id,
      newStatus: newStatus || certRequest.status
    });
  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar notificação do Asaas:', error);
    return res.status(500).json({
      message: 'Erro ao processar notificação',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;