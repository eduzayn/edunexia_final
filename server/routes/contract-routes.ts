import express, { Request, Response } from 'express';
import * as contractsService from '../services/contracts-service';
import { EducationalContract } from '@shared/schema';
import PDFDocument from 'pdfkit';

const router = express.Router();

// Middleware para verificar se o usuário é um estudante
const requireStudent = (req: Request, res: Response, next: express.NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Não autenticado' });
  }

  if (!req.user || req.user.portalType !== 'student') {
    return res.status(403).json({ message: 'Acesso negado' });
  }

  next();
};

// Rota para buscar todos os contratos do aluno
router.get('/api/student/contracts', requireStudent, async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.id;
    
    if (!studentId) {
      return res.status(400).json({ message: 'ID do estudante não encontrado' });
    }
    
    const contracts = await contractsService.getContractsByStudentId(studentId);
    
    return res.status(200).json({ 
      success: true, 
      data: contracts 
    });
  } catch (error: any) {
    console.error('Erro ao obter contratos:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao obter contratos: ' + error.message 
    });
  }
});

// Rota para obter um contrato específico
router.get('/api/contracts/:id', requireStudent, async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.id);
    
    if (isNaN(contractId)) {
      return res.status(400).json({ message: 'ID do contrato inválido' });
    }
    
    const contract = await contractsService.getContractById(contractId);
    
    if (!contract) {
      return res.status(404).json({ message: 'Contrato não encontrado' });
    }
    
    // Verificar se o contrato pertence ao aluno logado
    if (contract.studentId !== req.user?.id) {
      return res.status(403).json({ message: 'Acesso negado a este contrato' });
    }
    
    return res.status(200).json({ 
      success: true, 
      data: contract 
    });
  } catch (error: any) {
    console.error('Erro ao obter contrato:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao obter contrato: ' + error.message 
    });
  }
});

// Rota para assinar um contrato
router.post('/api/contracts/:id/sign', requireStudent, async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.id);
    const { signatureData } = req.body;
    
    if (isNaN(contractId)) {
      return res.status(400).json({ message: 'ID do contrato inválido' });
    }
    
    if (!signatureData) {
      return res.status(400).json({ message: 'Dados de assinatura são obrigatórios' });
    }
    
    // Verificar se o contrato existe e pertence ao aluno
    const contract = await contractsService.getContractById(contractId);
    
    if (!contract) {
      return res.status(404).json({ message: 'Contrato não encontrado' });
    }
    
    if (contract.studentId !== req.user?.id) {
      return res.status(403).json({ message: 'Acesso negado a este contrato' });
    }
    
    if (contract.status === 'signed') {
      return res.status(400).json({ message: 'Este contrato já foi assinado' });
    }
    
    // Assinar o contrato
    const signedContract = await contractsService.signContract(contractId, signatureData);
    
    return res.status(200).json({ 
      success: true, 
      data: signedContract,
      message: 'Contrato assinado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao assinar contrato:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao assinar contrato: ' + error.message 
    });
  }
});

// Rota para baixar o contrato em PDF
router.get('/api/contracts/:id/download', requireStudent, async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.id);
    
    if (isNaN(contractId)) {
      return res.status(400).json({ message: 'ID do contrato inválido' });
    }
    
    // Verificar se o contrato existe e pertence ao aluno
    const contract = await contractsService.getContractById(contractId);
    
    if (!contract) {
      return res.status(404).json({ message: 'Contrato não encontrado' });
    }
    
    if (contract.studentId !== req.user?.id) {
      return res.status(403).json({ message: 'Acesso negado a este contrato' });
    }
    
    // Gerar PDF do contrato
    const pdfBuffer = await contractsService.downloadContract(contractId);
    
    // Configurar headers para download do PDF
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="contrato_${contract.contractNumber}.pdf"`,
      'Content-Length': pdfBuffer.length
    });
    
    // Enviar o PDF
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Erro ao baixar contrato:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao baixar contrato: ' + error.message 
    });
  }
});

// Rota para gerar contrato a partir de uma matrícula
router.post('/api/enrollments/:id/generate-contract', async (req: Request, res: Response) => {
  try {
    const enrollmentId = parseInt(req.params.id);
    
    if (isNaN(enrollmentId)) {
      return res.status(400).json({ message: 'ID da matrícula inválido' });
    }
    
    // Gerar contrato
    const contract = await contractsService.generateContract(enrollmentId);
    
    return res.status(200).json({ 
      success: true, 
      data: contract,
      message: 'Contrato gerado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao gerar contrato:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao gerar contrato: ' + error.message 
    });
  }
});

export default router;