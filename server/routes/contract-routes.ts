import express, { Request, Response } from 'express';
import {
  generateContract,
  getContractById,
  getContractsByStudentId,
  signContract,
  downloadContract
} from '../services/contracts-service';

const router = express.Router();

// Middleware para verificar se é estudante
const requireStudent = (req: Request, res: Response, next: express.NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado'
    });
  }

  const user = req.user;
  
  if (!user || user.portalType !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Acesso não autorizado. Apenas estudantes podem acessar este recurso.'
    });
  }
  
  next();
};

// Obter todos os contratos do estudante
router.get('/api/student/contracts', requireStudent, async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.id;
    
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'ID do estudante não encontrado'
      });
    }
    
    const contracts = await getContractsByStudentId(studentId);
    
    return res.json({
      success: true,
      data: contracts
    });
  } catch (error) {
    console.error('Erro ao buscar contratos do estudante:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar contratos'
    });
  }
});

// Obter um contrato específico
router.get('/api/contracts/:id', requireStudent, async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.id);
    
    if (isNaN(contractId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de contrato inválido'
      });
    }
    
    const contract = await getContractById(contractId);
    
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato não encontrado'
      });
    }
    
    // Verificar se o contrato pertence ao estudante autenticado
    if (contract.studentId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para acessar este contrato'
      });
    }
    
    return res.json({
      success: true,
      data: contract
    });
  } catch (error) {
    console.error('Erro ao buscar contrato:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar contrato'
    });
  }
});

// Assinar um contrato
router.post('/api/contracts/:id/sign', requireStudent, async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.id);
    const { signatureData } = req.body;
    
    if (isNaN(contractId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de contrato inválido'
      });
    }
    
    if (!signatureData) {
      return res.status(400).json({
        success: false,
        message: 'Dados de assinatura não fornecidos'
      });
    }
    
    const contract = await getContractById(contractId);
    
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato não encontrado'
      });
    }
    
    // Verificar se o contrato pertence ao estudante autenticado
    if (contract.studentId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para assinar este contrato'
      });
    }
    
    // Verificar se o contrato já está assinado
    if (contract.status === 'signed') {
      return res.status(400).json({
        success: false,
        message: 'Este contrato já foi assinado'
      });
    }
    
    // Assinar o contrato
    const signedContract = await signContract(contractId, signatureData);
    
    return res.json({
      success: true,
      data: signedContract,
      message: 'Contrato assinado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao assinar contrato:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao assinar contrato'
    });
  }
});

// Baixar um contrato em PDF
router.get('/api/contracts/:id/download', requireStudent, async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.id);
    
    if (isNaN(contractId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de contrato inválido'
      });
    }
    
    const contract = await getContractById(contractId);
    
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato não encontrado'
      });
    }
    
    // Verificar se o contrato pertence ao estudante autenticado
    if (contract.studentId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para baixar este contrato'
      });
    }
    
    // Gerar o PDF do contrato
    const pdfBuffer = await downloadContract(contractId);
    
    // Definir cabeçalhos para download do PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=contrato-${contractId}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Enviar o buffer do PDF como resposta
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Erro ao baixar contrato:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao baixar contrato'
    });
  }
});

// Rota para gerar um contrato a partir de uma matrícula
router.post('/api/enrollments/:id/generate-contract', async (req: Request, res: Response) => {
  try {
    const enrollmentId = parseInt(req.params.id);
    
    if (isNaN(enrollmentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de matrícula inválido'
      });
    }
    
    const contract = await generateContract(enrollmentId);
    
    return res.json({
      success: true,
      data: contract,
      message: 'Contrato gerado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao gerar contrato:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar contrato'
    });
  }
});

export default router;