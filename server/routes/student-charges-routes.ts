/**
 * Rotas para acesso às cobranças do aluno
 * Permite que alunos visualizem suas cobranças e links de pagamento
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import asaasChargesService from '../services/asaas-charges-service';
import { storage } from '../storage';
import logger from '../utils/logger';

const router = Router();

// Middleware de autenticação em todas as rotas
router.use(requireAuth);

/**
 * Obtém todas as cobranças do aluno autenticado
 * @route GET /api/student/charges
 */
router.get('/charges', async (req, res) => {
  try {
    // Verificar se o usuário está autenticado e é um aluno
    if (!req.user || (req.user.portalType !== 'student' && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para acessar essas informações'
      });
    }

    // Obter o aluno com seus dados no Asaas
    const student = await storage.getUser(req.user.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Aluno não encontrado'
      });
    }

    // Obter o ID do cliente no Asaas (pode estar armazenado no campo customerId do aluno)
    const asaasCustomerId = student.customerId || student.asaasId;
    
    if (!asaasCustomerId) {
      return res.status(404).json({
        success: false,
        message: 'Aluno não possui ID de cliente no Asaas'
      });
    }

    // Buscar cobranças do aluno no Asaas
    const charges = await asaasChargesService.getCustomerCharges(asaasCustomerId);
    
    logger.info(`Encontradas ${charges.length} cobranças para o aluno ${student.id}`);
    
    res.json(charges);
  } catch (error) {
    logger.error('Erro ao obter cobranças do aluno:', error);
    const message = error instanceof Error ? error.message : 'Erro ao obter cobranças';
    res.status(500).json({
      success: false,
      message
    });
  }
});

/**
 * Obtém o link de visualização pública de uma cobrança
 * @route GET /api/student/charges/:id/view-link
 */
router.get('/charges/:id/view-link', async (req, res) => {
  try {
    // Verificar se o usuário está autenticado e é um aluno
    if (!req.user || (req.user.portalType !== 'student' && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para acessar essas informações'
      });
    }

    const chargeId = req.params.id;
    
    // Verificar se a cobrança existe e pertence ao aluno
    try {
      // Obter detalhes da cobrança para verificação
      const charge = await asaasChargesService.getChargeById(chargeId);
      
      // Verificar se a cobrança pertence ao aluno (exceto para admin)
      if (req.user.role !== 'admin') {
        const student = await storage.getUser(req.user.id);
        const asaasCustomerId = student?.customerId || student?.asaasId;
        
        if (charge.customer !== asaasCustomerId) {
          return res.status(403).json({
            success: false,
            message: 'Esta cobrança não pertence ao seu usuário'
          });
        }
      }
      
      // Gerar o link de visualização pública
      const viewLink = await asaasChargesService.generatePublicLinkForCharge(chargeId);
      
      res.json({
        success: true,
        viewLink
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Cobrança não encontrada'
      });
    }
  } catch (error) {
    logger.error('Erro ao obter link de visualização da cobrança:', error);
    const message = error instanceof Error ? error.message : 'Erro ao obter link de visualização';
    res.status(500).json({
      success: false,
      message
    });
  }
});

/**
 * Obtém o campo de identificação para uma cobrança (código de barras, etc.)
 * @route GET /api/student/charges/:id/identification
 */
router.get('/charges/:id/identification', async (req, res) => {
  try {
    // Verificar se o usuário está autenticado e é um aluno
    if (!req.user || (req.user.portalType !== 'student' && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para acessar essas informações'
      });
    }

    const chargeId = req.params.id;
    
    // Verificar se a cobrança existe e pertence ao aluno
    try {
      // Obter detalhes da cobrança para verificação
      const charge = await asaasChargesService.getChargeById(chargeId);
      
      // Verificar se a cobrança pertence ao aluno (exceto para admin)
      if (req.user.role !== 'admin') {
        const student = await storage.getUser(req.user.id);
        const asaasCustomerId = student?.customerId || student?.asaasId;
        
        if (charge.customer !== asaasCustomerId) {
          return res.status(403).json({
            success: false,
            message: 'Esta cobrança não pertence ao seu usuário'
          });
        }
      }
      
      // Obter o campo de identificação
      const identificationField = await asaasChargesService.getChargeIdentificationField(chargeId);
      
      res.json({
        success: true,
        identificationField
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Cobrança não encontrada'
      });
    }
  } catch (error) {
    logger.error('Erro ao obter código de identificação da cobrança:', error);
    const message = error instanceof Error ? error.message : 'Erro ao obter código de identificação';
    res.status(500).json({
      success: false,
      message
    });
  }
});

export default router;