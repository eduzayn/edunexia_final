import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { storage } from '../storage';
import { generateContractFromEnrollment, signContract, getContractFilePath, generateContractViewLink } from '../services/contracts-service';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger';

const router = Router();

/**
 * Rota para obter os contratos do aluno autenticado
 */
router.get('/api/student/contracts', requireAuth, async (req, res) => {
  try {
    // Verificar se o usuário está autenticado e é um aluno ou admin
    if (!req.user || (req.user.portalType !== 'student' && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas alunos podem acessar esta rota.'
      });
    }

    // Obter ID do aluno (do usuário autenticado)
    const studentId = req.user.id;

    // Buscar contratos do aluno
    const contracts = await storage.getEducationalContracts({ studentId });

    return res.json(contracts);
  } catch (error) {
    logger.error('Erro ao buscar contratos do aluno:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar contratos. Tente novamente mais tarde.'
    });
  }
});

/**
 * Rota para obter um contrato específico do aluno
 */
router.get('/api/student/contracts/:id', requireAuth, async (req, res) => {
  try {
    // Verificar se o usuário está autenticado e é um aluno ou admin
    if (!req.user || (req.user.portalType !== 'student' && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas alunos podem acessar esta rota.'
      });
    }

    const contractId = req.params.id;
    const studentId = req.user.id;

    // Buscar contrato
    const contract = await storage.getEducationalContract(contractId);

    // Verificar se o contrato existe e pertence ao aluno
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato não encontrado.'
      });
    }

    // Se não for admin, verificar se o contrato pertence ao aluno
    if (req.user.role !== 'admin' && contract.studentId !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Este contrato não pertence ao aluno autenticado.'
      });
    }

    return res.json(contract);
  } catch (error) {
    logger.error('Erro ao buscar contrato específico:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar contrato. Tente novamente mais tarde.'
    });
  }
});

/**
 * Rota para baixar o arquivo PDF do contrato
 */
router.get('/api/student/contracts/:id/download', requireAuth, async (req, res) => {
  try {
    // Verificar se o usuário está autenticado e é um aluno ou admin
    if (!req.user || (req.user.portalType !== 'student' && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas alunos podem acessar esta rota.'
      });
    }

    const contractId = req.params.id;
    const studentId = req.user.id;

    // Buscar contrato
    const contract = await storage.getEducationalContract(contractId);

    // Verificar se o contrato existe e pertence ao aluno
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato não encontrado.'
      });
    }

    // Se não for admin, verificar se o contrato pertence ao aluno
    if (req.user.role !== 'admin' && contract.studentId !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Este contrato não pertence ao aluno autenticado.'
      });
    }

    // Obter caminho do arquivo PDF
    const filePath = await getContractFilePath(contractId);

    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo do contrato não encontrado.'
      });
    }

    // Obter nome do arquivo a partir do caminho
    const fileName = path.basename(filePath);

    // Enviar arquivo para download
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/pdf');
    
    // Stream do arquivo
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    logger.error('Erro ao baixar contrato:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao baixar contrato. Tente novamente mais tarde.'
    });
  }
});

/**
 * Rota para visualizar o contrato online
 */
router.get('/api/student/contracts/:id/view', requireAuth, async (req, res) => {
  try {
    // Verificar se o usuário está autenticado e é um aluno ou admin
    if (!req.user || (req.user.portalType !== 'student' && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas alunos podem acessar esta rota.'
      });
    }

    const contractId = req.params.id;
    const studentId = req.user.id;

    // Buscar contrato
    const contract = await storage.getEducationalContract(contractId);

    // Verificar se o contrato existe e pertence ao aluno
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato não encontrado.'
      });
    }

    // Se não for admin, verificar se o contrato pertence ao aluno
    if (req.user.role !== 'admin' && contract.studentId !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Este contrato não pertence ao aluno autenticado.'
      });
    }

    // Obter caminho do arquivo PDF
    const filePath = await getContractFilePath(contractId);

    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo do contrato não encontrado.'
      });
    }

    // Enviar arquivo para visualização inline
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Content-Type', 'application/pdf');
    
    // Stream do arquivo
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    logger.error('Erro ao visualizar contrato:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao visualizar contrato. Tente novamente mais tarde.'
    });
  }
});

/**
 * Rota para gerar preview do contrato (URL temporária)
 */
router.get('/api/student/contracts/:id/preview', requireAuth, async (req, res) => {
  try {
    // Verificar se o usuário está autenticado e é um aluno ou admin
    if (!req.user || (req.user.portalType !== 'student' && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas alunos podem acessar esta rota.'
      });
    }

    const contractId = req.params.id;
    const studentId = req.user.id;

    // Buscar contrato
    const contract = await storage.getEducationalContract(contractId);

    // Verificar se o contrato existe e pertence ao aluno
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato não encontrado.'
      });
    }

    // Se não for admin, verificar se o contrato pertence ao aluno
    if (req.user.role !== 'admin' && contract.studentId !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Este contrato não pertence ao aluno autenticado.'
      });
    }

    // Gerar URL para visualização
    const previewUrl = await generateContractViewLink(contractId);

    return res.json({
      success: true,
      previewUrl
    });
  } catch (error) {
    logger.error('Erro ao gerar preview do contrato:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar preview do contrato. Tente novamente mais tarde.'
    });
  }
});

/**
 * Rota para assinar digitalmente um contrato
 */
router.post('/api/student/contracts/:id/sign', requireAuth, async (req, res) => {
  try {
    // Verificar se o usuário está autenticado e é um aluno
    if (!req.user || req.user.portalType !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas alunos podem assinar contratos.'
      });
    }

    const contractId = req.params.id;
    const studentId = req.user.id;

    // Assinar contrato
    const signedContract = await signContract(contractId, studentId);

    if (!signedContract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato não encontrado ou erro ao assinar contrato.'
      });
    }

    return res.json({
      success: true,
      message: 'Contrato assinado com sucesso.',
      contract: signedContract
    });
  } catch (error) {
    logger.error('Erro ao assinar contrato:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao assinar contrato. Tente novamente mais tarde.'
    });
  }
});

/**
 * Rota para gerar um contrato a partir de uma matrícula simplificada
 */
router.post('/api/admin/enrollments/:id/generate-contract', requireAuth, async (req, res) => {
  try {
    // Verificar se o usuário está autenticado e é um admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas administradores podem gerar contratos.'
      });
    }

    const enrollmentId = req.params.id;

    // Gerar contrato
    const contract = await generateContractFromEnrollment(enrollmentId);

    return res.json({
      success: true,
      message: 'Contrato gerado com sucesso.',
      contract
    });
  } catch (error) {
    logger.error('Erro ao gerar contrato a partir da matrícula:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar contrato. Tente novamente mais tarde.'
    });
  }
});

export default router;