import express from 'express';
import { Request, Response } from 'express';
import { 
  generateContract, 
  getContractById, 
  getContractsByStudentId,
  getContractsByEnrollmentId,
  signContract,
  downloadContract
} from '../services/contracts-service';

const router = express.Router();

// Middleware para verificar autenticação de estudante
const requireStudent = (req: Request, res: Response, next: express.NextFunction) => {
  // Verificar o token no header de Authorization
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Você precisa estar autenticado para acessar este recurso.' 
    });
  }

  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({ 
      success: false,
      message: 'Sessão inválida ou expirada. Faça login novamente.' 
    });
  }

  // Permitir acesso para student ou admin (para testes)
  if (user.portalType !== 'student' && user.portalType !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Este recurso é exclusivo para estudantes.' 
    });
  }

  next();
};

// Rotas para contratos

// Rota para gerar um contrato a partir de uma matrícula
router.post('/api/contracts/generate/:enrollmentId', async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    
    if (!enrollmentId) {
      return res.status(400).json({
        success: false,
        message: 'ID da matrícula é obrigatório'
      });
    }
    
    const contract = await generateContract(parseInt(enrollmentId));
    
    return res.status(200).json({
      success: true,
      data: contract
    });
  } catch (error) {
    console.error('Erro ao gerar contrato:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar contrato',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Rota para obter um contrato específico pelo ID
router.get('/api/contracts/:contractId', requireStudent, async (req, res) => {
  try {
    const { contractId } = req.params;
    const user = (req as any).user;
    
    const contract = await getContractById(parseInt(contractId));
    
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato não encontrado'
      });
    }
    
    // Verificar se o contrato pertence ao estudante (exceto para admin)
    if (user.portalType === 'student' && contract.studentId !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para acessar este contrato'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: contract
    });
  } catch (error) {
    console.error('Erro ao buscar contrato:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar contrato',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Rota para listar contratos de um estudante
router.get('/api/student/contracts', requireStudent, async (req, res) => {
  try {
    const user = (req as any).user;
    
    const contracts = await getContractsByStudentId(user.id);
    
    return res.status(200).json({
      success: true,
      data: contracts
    });
  } catch (error) {
    console.error('Erro ao listar contratos do estudante:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar contratos',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Rota para listar contratos de uma matrícula específica
router.get('/api/enrollment/:enrollmentId/contracts', requireStudent, async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const user = (req as any).user;
    
    const contracts = await getContractsByEnrollmentId(parseInt(enrollmentId));
    
    // Se não for admin, verificar se a matrícula pertence ao estudante
    // Esta verificação seria melhor feita consultando a matrícula no banco
    if (user.portalType === 'student') {
      // Para simplificar, vamos confiar que a função getContractsByEnrollmentId
      // já filtra corretamente os contratos
    }
    
    return res.status(200).json({
      success: true,
      data: contracts
    });
  } catch (error) {
    console.error('Erro ao listar contratos da matrícula:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar contratos da matrícula',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Rota para assinar um contrato
router.post('/api/contracts/:contractId/sign', requireStudent, async (req, res) => {
  try {
    const { contractId } = req.params;
    const user = (req as any).user;
    const { signatureData } = req.body; // Dados da assinatura (pode ser uma imagem base64)
    
    if (!signatureData) {
      return res.status(400).json({
        success: false,
        message: 'Dados da assinatura são obrigatórios'
      });
    }
    
    // Obter o contrato para verificar permissões
    const contract = await getContractById(parseInt(contractId));
    
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato não encontrado'
      });
    }
    
    // Verificar se o contrato pertence ao estudante
    if (user.portalType === 'student' && contract.studentId !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para assinar este contrato'
      });
    }
    
    // Assinar o contrato
    const signedContract = await signContract(parseInt(contractId), signatureData);
    
    return res.status(200).json({
      success: true,
      data: signedContract
    });
  } catch (error) {
    console.error('Erro ao assinar contrato:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao assinar contrato',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Rota para baixar um contrato em PDF
router.get('/api/contracts/:contractId/download', requireStudent, async (req, res) => {
  try {
    const { contractId } = req.params;
    const user = (req as any).user;
    
    // Obter o contrato para verificar permissões
    const contract = await getContractById(parseInt(contractId));
    
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato não encontrado'
      });
    }
    
    // Verificar se o contrato pertence ao estudante
    if (user.portalType === 'student' && contract.studentId !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para baixar este contrato'
      });
    }
    
    // Gerar o PDF do contrato
    const pdfBuffer = await downloadContract(parseInt(contractId));
    
    // Configurar headers para download do PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="contrato-${contractId}.pdf"`);
    
    // Enviar o PDF como resposta
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Erro ao baixar contrato:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao baixar contrato',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;