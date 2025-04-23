/**
 * Webhook para receber notificações do Asaas sobre pagamentos
 */

import express from 'express';

const router = express.Router();

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
    
    // Apenas log nesta versão simplificada
    // Na versão completa, faríamos o processamento do pagamento e a atualização do status da solicitação
    
    return res.status(200).json({ 
      message: 'Notificação recebida com sucesso',
      event,
      paymentId,
      reference: externalReference
    });
  } catch (error) {
    console.error('[ASAAS WEBHOOK] Erro ao processar notificação:', error);
    return res.status(500).json({ 
      error: 'Erro interno ao processar notificação',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;