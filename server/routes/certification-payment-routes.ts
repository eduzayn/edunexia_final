/**
 * Rotas para processamento de pagamentos de certificação em lote
 */

import express from 'express';
import { CertificationPaymentService } from '../services/certification-payment-service';
// Usar a função correta para autenticação
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

const router = express.Router();

/**
 * Cria um pagamento para um lote de certificações
 * POST /api/certification/batch-payment
 */
router.post('/batch-payment', requireAuth, async (req: any, res) => {
  try {
    console.log('[API] Recebida solicitação para criar pagamento de certificação em lote');
    
    const { students, unitPrice } = req.body;
    
    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'É necessário incluir pelo menos um aluno no lote'
      });
    }
    
    if (!unitPrice || isNaN(unitPrice) || unitPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'É necessário informar um valor unitário válido'
      });
    }
    
    // Calcular o valor total
    const totalAmount = students.length * unitPrice;
    
    // Obter o ID do parceiro do usuário autenticado
    const partnerId = req.user.partnerId || req.user.id;
    
    if (!partnerId) {
      return res.status(400).json({
        success: false,
        message: 'Não foi possível identificar o parceiro associado ao usuário'
      });
    }
    
    console.log(`[API] Criando pagamento para lote de ${students.length} certificações, valor total: ${totalAmount}`);
    
    // Chamar o serviço para criar o pagamento
    const paymentResult = await CertificationPaymentService.createBatchPayment({
      partnerId,
      students,
      unitPrice,
      totalAmount
    });
    
    if (!paymentResult.success) {
      return res.status(500).json({
        success: false,
        message: paymentResult.message || 'Erro ao criar pagamento',
        error: paymentResult.error
      });
    }
    
    // Retorna o resultado para o frontend
    return res.status(200).json({
      success: true,
      data: {
        paymentId: paymentResult.paymentId,
        paymentLink: paymentResult.paymentLink,
        invoiceUrl: paymentResult.invoiceUrl,
        pixUrl: paymentResult.pixUrl,
        pixCode: paymentResult.pixCode
      },
      message: 'Pagamento criado com sucesso'
    });
  } catch (error) {
    console.error('[API] Erro ao criar pagamento de certificação em lote:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao processar a solicitação de pagamento',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;