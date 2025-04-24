import express, { Request, Response } from 'express';
import * as contractsService from '../services/contracts-service';
import { verifyAuthToken } from '../middlewares/auth';

const router = express.Router();

// Middleware para verificar se o usuário é um aluno
const requireStudent = (req: Request, res: Response, next: express.NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Não autenticado' 
    });
  }

  if (req.user.portalType !== 'student') {
    return res.status(403).json({ 
      success: false,
      message: 'Acesso negado' 
    });
  }

  next();
};

// Middleware para verificar e extrair token JWT de autenticação
router.use(verifyAuthToken);

// Rota para buscar todos os contratos do aluno (formato API-JSON)
router.get('/api-json/student/contracts', requireStudent, async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.id;
    
    if (!studentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID do estudante não encontrado' 
      });
    }
    
    // Buscar contratos do aluno
    const contracts = await contractsService.getContractsByStudentId(studentId);
    
    console.log(`Retornando ${contracts.length} contratos para o aluno ${studentId}`);
    
    // Retornar no formato API-JSON
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

// Rota para buscar um contrato específico pelo ID (formato API-JSON)
router.get('/api-json/contracts/:id', requireStudent, async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.id);
    
    if (isNaN(contractId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID do contrato inválido' 
      });
    }
    
    // Buscar contrato pelo ID
    const contract = await contractsService.getContractById(contractId);
    
    if (!contract) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contrato não encontrado' 
      });
    }
    
    // Verificar se o contrato pertence ao aluno autenticado
    if (contract.studentId !== req.user?.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado a este contrato' 
      });
    }
    
    // Retornar no formato API-JSON
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

// Rota para assinar um contrato (formato API-JSON)
router.post('/api-json/contracts/:id/sign', requireStudent, async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.id);
    
    if (isNaN(contractId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID do contrato inválido' 
      });
    }
    
    // Verificar se os dados da assinatura foram fornecidos
    const { signatureData } = req.body;
    
    if (!signatureData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados da assinatura são obrigatórios' 
      });
    }
    
    // Buscar contrato pelo ID
    const contract = await contractsService.getContractById(contractId);
    
    if (!contract) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contrato não encontrado' 
      });
    }
    
    // Verificar se o contrato pertence ao aluno autenticado
    if (contract.studentId !== req.user?.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado a este contrato' 
      });
    }
    
    // Verificar se o contrato já foi assinado
    if (contract.status === 'signed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Este contrato já foi assinado' 
      });
    }
    
    // Assinar o contrato
    const updatedContract = await contractsService.signContract(contractId, signatureData);
    
    // Retornar no formato API-JSON
    return res.status(200).json({ 
      success: true, 
      data: updatedContract,
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

// Rota para baixar um contrato em PDF (formato API-JSON)
router.get('/api-json/contracts/:id/download', requireStudent, async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.id);
    
    if (isNaN(contractId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID do contrato inválido' 
      });
    }
    
    // Buscar contrato pelo ID
    const contract = await contractsService.getContractById(contractId);
    
    if (!contract) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contrato não encontrado' 
      });
    }
    
    // Verificar se o contrato pertence ao aluno autenticado
    if (contract.studentId !== req.user?.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado a este contrato' 
      });
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
    if (!res.headersSent) {
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao baixar contrato: ' + error.message 
      });
    }
  }
});

export default router;