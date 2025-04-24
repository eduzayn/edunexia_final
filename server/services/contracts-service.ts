/**
 * Serviço para gerenciamento de contratos educacionais
 * Permite a geração, visualização e assinatura de contratos
 */

import { storage } from '../storage';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { v4 as uuidv4 } from 'uuid';
import { getSimplifiedEnrollmentById } from '../controllers/new-simplified-enrollment-controller';
import logger from '../utils/logger';

// Caminho para salvar os arquivos de contrato
const CONTRACTS_DIR = path.join(process.cwd(), 'uploads/contracts');

// Verificar se o diretório existe, se não, criar
if (!fs.existsSync(CONTRACTS_DIR)) {
  fs.mkdirSync(CONTRACTS_DIR, { recursive: true });
}

// Tipos de contrato disponíveis
export const CONTRACT_TYPES = {
  GRADUATION: "GRADUAÇÃO",
  POST_GRADUATION: "PÓS-GRADUAÇÃO",
  SECOND_DEGREE: "SEGUNDA-GRADUAÇÃO",
  MBA: "MBA",
  EXTENSION: "EXTENSÃO",
  TECHNICAL: "TÉCNICO",
};

// Interface para dados do modelo de contrato
export interface ContractTemplate {
  id: string;
  name: string;
  type: string;
  content: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

// Interface para dados de contrato
export interface Contract {
  id: string;
  enrollmentId: string;
  studentId: number;
  studentName: string;
  courseId: number;
  courseName: string;
  contractNumber: string;
  createdAt: string;
  signedAt: string | null;
  status: 'PENDING' | 'SIGNED' | 'EXPIRED' | 'CANCELED';
  contractType: string;
  contractUrl: string | null;
  expiresAt: string | null;
  paymentInfo: {
    totalValue: number;
    installments: number;
    installmentValue: number;
    paymentMethod: string;
    discount?: number;
  };
  metadata?: {
    enrollmentDate?: string;
    startDate?: string;
    endDate?: string;
    campus?: string;
    modality?: string;
  };
}

/**
 * Gera um novo contrato baseado em uma matrícula
 * @param enrollmentId ID da matrícula simplificada
 * @returns O contrato gerado
 */
export async function generateContractFromEnrollment(enrollmentId: string): Promise<Contract> {
  try {
    // Buscar dados da matrícula
    const enrollment = await getSimplifiedEnrollmentById(enrollmentId);
    
    if (!enrollment) {
      throw new Error(`Matrícula não encontrada: ${enrollmentId}`);
    }
    
    // Buscar dados do aluno
    const student = await storage.getUser(enrollment.studentId);
    
    if (!student) {
      throw new Error(`Aluno não encontrado: ${enrollment.studentId}`);
    }
    
    // Buscar dados do curso
    const course = await storage.getCourse(enrollment.courseId);
    
    if (!course) {
      throw new Error(`Curso não encontrado: ${enrollment.courseId}`);
    }
    
    // Determinar o tipo de contrato baseado na modalidade do curso
    const contractType = determineContractType(course.courseType || "POST_GRADUATION");
    
    // Gerar número do contrato
    const contractNumber = generateContractNumber(enrollmentId);
    
    // Buscar template de contrato adequado
    const template = await findTemplateForContract(contractType);
    
    if (!template) {
      throw new Error(`Template de contrato não encontrado para o tipo: ${contractType}`);
    }
    
    // Criar objeto de contrato
    const contract: Contract = {
      id: `contract_${uuidv4()}`,
      enrollmentId,
      studentId: student.id,
      studentName: student.fullName,
      courseId: course.id,
      courseName: course.name,
      contractNumber,
      createdAt: new Date().toISOString(),
      signedAt: null,
      status: 'PENDING',
      contractType,
      contractUrl: null,
      expiresAt: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(), // Expira em 7 dias
      paymentInfo: {
        totalValue: enrollment.totalValue || 0,
        installments: enrollment.installments || 1,
        installmentValue: enrollment.installmentValue || 0,
        paymentMethod: enrollment.paymentMethod || "BOLETO",
        discount: enrollment.discount
      },
      metadata: {
        enrollmentDate: enrollment.createdAt,
        startDate: course.startDate,
        endDate: course.endDate,
        campus: enrollment.campus || "Campus Virtual",
        modality: course.modality || "EAD"
      }
    };
    
    // Salvar contrato no banco de dados
    await storage.createContract(contract);
    
    // Gerar PDF do contrato
    await generateContractPDF(contract, template);
    
    logger.info(`Contrato gerado com sucesso para a matrícula ${enrollmentId}`);
    
    return contract;
  } catch (error) {
    logger.error('Erro ao gerar contrato:', error);
    throw error;
  }
}

/**
 * Determina o tipo de contrato com base no tipo de curso
 */
function determineContractType(courseType: string): string {
  const typeMap: Record<string, string> = {
    "GRADUATION": CONTRACT_TYPES.GRADUATION,
    "POST_GRADUATION": CONTRACT_TYPES.POST_GRADUATION,
    "SECOND_DEGREE": CONTRACT_TYPES.SECOND_DEGREE,
    "MBA": CONTRACT_TYPES.MBA,
    "EXTENSION": CONTRACT_TYPES.EXTENSION,
    "TECHNICAL": CONTRACT_TYPES.TECHNICAL,
  };
  
  return typeMap[courseType] || CONTRACT_TYPES.POST_GRADUATION;
}

/**
 * Gera um número de contrato único
 */
function generateContractNumber(enrollmentId: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CONT-${year}-${random}`;
}

/**
 * Busca um template de contrato para o tipo especificado
 */
async function findTemplateForContract(contractType: string): Promise<ContractTemplate | null> {
  try {
    // Buscar template no banco de dados
    const templates = await storage.getContractTemplates({ contractType, active: true });
    
    if (templates && templates.length > 0) {
      // Retornar o template mais recente
      return templates[0];
    }
    
    // Se não encontrar no banco, usar um template padrão
    return {
      id: 'default_template',
      name: `Template padrão para ${contractType}`,
      type: contractType,
      content: getDefaultContractTemplate(contractType),
      variables: ['NOME_ALUNO', 'NOME_CURSO', 'VALOR_TOTAL', 'NUMERO_PARCELAS', 'VALOR_PARCELA'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      active: true
    };
  } catch (error) {
    logger.error('Erro ao buscar template de contrato:', error);
    return null;
  }
}

/**
 * Obtém um template de contrato padrão
 */
function getDefaultContractTemplate(contractType: string): string {
  // Template básico para contratos
  return `CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS
  
CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS - ${contractType}

Pelo presente instrumento particular de CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS, de um lado, {{INSTITUICAO}}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {{CNPJ_INSTITUICAO}}, com sede em {{ENDERECO_INSTITUICAO}}, doravante denominada CONTRATADA, e de outro lado, {{NOME_ALUNO}}, portador(a) do CPF nº {{CPF_ALUNO}}, residente e domiciliado(a) em {{ENDERECO_ALUNO}}, doravante denominado(a) CONTRATANTE, têm entre si, justo e contratado o seguinte:

CLÁUSULA PRIMEIRA – DO OBJETO
O presente contrato tem por objeto a prestação de serviços educacionais relativos ao curso de {{NOME_CURSO}}, na modalidade {{MODALIDADE}}, com início previsto para {{DATA_INICIO}} e término previsto para {{DATA_TERMINO}}.

CLÁUSULA SEGUNDA – DO VALOR E FORMA DE PAGAMENTO
Pelos serviços educacionais objeto deste contrato, o(a) CONTRATANTE pagará à CONTRATADA o valor total de {{VALOR_TOTAL}}, dividido em {{NUMERO_PARCELAS}} parcelas mensais de {{VALOR_PARCELA}}, com vencimento no dia {{DIA_VENCIMENTO}} de cada mês.

CLÁUSULA TERCEIRA – DA VIGÊNCIA
O presente contrato tem vigência a partir da data de sua assinatura até a conclusão do curso pelo(a) CONTRATANTE, ressalvadas as hipóteses de rescisão previstas neste instrumento.

CLÁUSULA QUARTA – DAS OBRIGAÇÕES DA CONTRATADA
A CONTRATADA se obriga a:
a) Disponibilizar as aulas conforme metodologia e cronograma estabelecidos;
b) Fornecer acesso ao material didático necessário;
c) Avaliar o desempenho acadêmico do(a) CONTRATANTE;
d) Emitir certificado de conclusão, desde que cumpridos os requisitos acadêmicos.

CLÁUSULA QUINTA – DAS OBRIGAÇÕES DO(A) CONTRATANTE
O(A) CONTRATANTE se obriga a:
a) Frequentar as aulas e cumprir as atividades acadêmicas;
b) Efetuar os pagamentos nos prazos estabelecidos;
c) Cumprir o regimento interno da instituição;
d) Manter seus dados cadastrais atualizados.

CLÁUSULA SEXTA – DA RESCISÃO
O presente contrato poderá ser rescindido nas seguintes hipóteses:
a) Pelo(a) CONTRATANTE, mediante solicitação formal, com 30 dias de antecedência;
b) Pela CONTRATADA, por inadimplência do(a) CONTRATANTE superior a 90 dias;
c) Por descumprimento de quaisquer cláusulas contratuais por ambas as partes.

E, por estarem assim justos e contratados, assinam o presente instrumento em duas vias de igual teor e forma.

{{CIDADE}}, {{DATA_ATUAL}}

______________________________
CONTRATANTE: {{NOME_ALUNO}}

______________________________
CONTRATADA: {{INSTITUICAO}}
`;
}

/**
 * Gera o PDF do contrato
 * @param contract Dados do contrato
 * @param template Template do contrato
 */
async function generateContractPDF(contract: Contract, template: ContractTemplate): Promise<string> {
  try {
    // Criar pasta para o contrato se não existir
    const contractDir = path.join(CONTRACTS_DIR, contract.id);
    if (!fs.existsSync(contractDir)) {
      fs.mkdirSync(contractDir, { recursive: true });
    }
    
    // Caminho do arquivo PDF
    const pdfPath = path.join(contractDir, `${contract.contractNumber}.pdf`);
    
    // Substituir variáveis no template
    let content = template.content;
    
    // Dados da instituição (fixos para simplificar)
    const institutionData = {
      INSTITUICAO: "EDUNEXA EDUCAÇÃO LTDA",
      CNPJ_INSTITUICAO: "12.345.678/0001-99",
      ENDERECO_INSTITUICAO: "Av. Paulista, 1000, São Paulo - SP",
      CIDADE: "São Paulo",
      DATA_ATUAL: new Date().toLocaleDateString('pt-BR')
    };
    
    // Dados do aluno e curso
    const student = await storage.getUser(contract.studentId);
    const course = await storage.getCourse(contract.courseId);
    
    // Formatar valores para moeda brasileira
    const formatCurrency = (value: number) => {
      return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };
    
    // Substituir variáveis
    content = content
      // Dados da instituição
      .replace(/{{INSTITUICAO}}/g, institutionData.INSTITUICAO)
      .replace(/{{CNPJ_INSTITUICAO}}/g, institutionData.CNPJ_INSTITUICAO)
      .replace(/{{ENDERECO_INSTITUICAO}}/g, institutionData.ENDERECO_INSTITUICAO)
      .replace(/{{CIDADE}}/g, institutionData.CIDADE)
      .replace(/{{DATA_ATUAL}}/g, institutionData.DATA_ATUAL)
      
      // Dados do aluno
      .replace(/{{NOME_ALUNO}}/g, student?.fullName || contract.studentName)
      .replace(/{{CPF_ALUNO}}/g, student?.cpf || "CPF não informado")
      .replace(/{{ENDERECO_ALUNO}}/g, [student?.address, student?.city, student?.state].filter(Boolean).join(', ') || "Endereço não informado")
      
      // Dados do curso
      .replace(/{{NOME_CURSO}}/g, course?.name || contract.courseName)
      .replace(/{{MODALIDADE}}/g, contract.metadata?.modality || "EAD")
      .replace(/{{DATA_INICIO}}/g, contract.metadata?.startDate ? new Date(contract.metadata.startDate).toLocaleDateString('pt-BR') : "Data a definir")
      .replace(/{{DATA_TERMINO}}/g, contract.metadata?.endDate ? new Date(contract.metadata.endDate).toLocaleDateString('pt-BR') : "Data a definir")
      
      // Dados financeiros
      .replace(/{{VALOR_TOTAL}}/g, formatCurrency(contract.paymentInfo.totalValue))
      .replace(/{{NUMERO_PARCELAS}}/g, contract.paymentInfo.installments.toString())
      .replace(/{{VALOR_PARCELA}}/g, formatCurrency(contract.paymentInfo.installmentValue))
      .replace(/{{DIA_VENCIMENTO}}/g, "10");  // Dia fixo para simplificar
    
    // Criar PDF
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(pdfPath);
    
    doc.pipe(stream);
    
    // Adicionar conteúdo ao PDF
    doc
      .fontSize(16)
      .text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS', { align: 'center' })
      .moveDown(2);
    
    doc
      .fontSize(12)
      .text(content, { align: 'justify' });
    
    doc.end();
    
    // Aguardar finalização da gravação
    await new Promise<void>((resolve, reject) => {
      stream.on('finish', () => {
        resolve();
      });
      stream.on('error', (err) => {
        reject(err);
      });
    });
    
    // Atualizar URL do contrato
    const contractUrl = `/api/student/contracts/${contract.id}/view`;
    await storage.updateContract(contract.id, { contractUrl });
    
    return pdfPath;
  } catch (error) {
    logger.error('Erro ao gerar PDF do contrato:', error);
    throw error;
  }
}

/**
 * Busca os contratos de um aluno
 * @param studentId ID do aluno
 * @returns Lista de contratos do aluno
 */
export async function getStudentContracts(studentId: number): Promise<Contract[]> {
  try {
    return await storage.getContracts({ studentId });
  } catch (error) {
    logger.error(`Erro ao buscar contratos do aluno ${studentId}:`, error);
    throw error;
  }
}

/**
 * Busca um contrato pelo ID
 * @param contractId ID do contrato
 * @returns Dados do contrato
 */
export async function getContractById(contractId: string): Promise<Contract | null> {
  try {
    return await storage.getContract(contractId);
  } catch (error) {
    logger.error(`Erro ao buscar contrato ${contractId}:`, error);
    throw error;
  }
}

/**
 * Assina digitalmente um contrato
 * @param contractId ID do contrato
 * @param studentId ID do aluno
 * @returns Contrato atualizado
 */
export async function signContract(contractId: string, studentId: number): Promise<Contract | null> {
  try {
    // Verificar se o contrato existe e pertence ao aluno
    const contract = await storage.getContract(contractId);
    
    if (!contract) {
      throw new Error(`Contrato ${contractId} não encontrado`);
    }
    
    if (contract.studentId !== studentId) {
      throw new Error(`Contrato ${contractId} não pertence ao aluno ${studentId}`);
    }
    
    if (contract.status !== 'PENDING') {
      throw new Error(`Contrato ${contractId} não está pendente de assinatura`);
    }
    
    // Atualizar contrato
    const updatedContract = await storage.updateContract(contractId, {
      status: 'SIGNED',
      signedAt: new Date().toISOString()
    });
    
    // Atualizar status da matrícula
    try {
      const enrollment = await getSimplifiedEnrollmentById(contract.enrollmentId);
      
      if (enrollment) {
        // Atualizar status da matrícula para "ENROLLMENT_COMPLETED"
        // Código removido para simplificar
      }
    } catch (err) {
      logger.warn(`Erro ao atualizar status da matrícula ${contract.enrollmentId}:`, err);
      // Não lançar erro para evitar que a assinatura do contrato falhe
    }
    
    return updatedContract;
  } catch (error) {
    logger.error(`Erro ao assinar contrato ${contractId}:`, error);
    throw error;
  }
}

/**
 * Gera um link para visualização do contrato
 * @param contractId ID do contrato
 * @returns URL para visualização
 */
export async function generateContractViewLink(contractId: string): Promise<string> {
  try {
    const contract = await storage.getContract(contractId);
    
    if (!contract) {
      throw new Error(`Contrato ${contractId} não encontrado`);
    }
    
    // Para simplificar, retornamos uma URL fixa
    // Na implementação real, poderia ser gerado um token temporário
    return `/api/student/contracts/${contractId}/view`;
  } catch (error) {
    logger.error(`Erro ao gerar link para contrato ${contractId}:`, error);
    throw error;
  }
}

/**
 * Obter o caminho do arquivo PDF do contrato
 * @param contractId ID do contrato
 * @returns Caminho para o arquivo PDF
 */
export async function getContractFilePath(contractId: string): Promise<string> {
  try {
    const contract = await storage.getContract(contractId);
    
    if (!contract) {
      throw new Error(`Contrato ${contractId} não encontrado`);
    }
    
    const pdfPath = path.join(CONTRACTS_DIR, contractId, `${contract.contractNumber}.pdf`);
    
    if (!fs.existsSync(pdfPath)) {
      // Se o arquivo não existir, tentar regerá-lo
      const template = await findTemplateForContract(contract.contractType);
      
      if (!template) {
        throw new Error(`Template de contrato não encontrado para o tipo: ${contract.contractType}`);
      }
      
      return await generateContractPDF(contract, template);
    }
    
    return pdfPath;
  } catch (error) {
    logger.error(`Erro ao obter caminho do arquivo do contrato ${contractId}:`, error);
    throw error;
  }
}

export default {
  generateContractFromEnrollment,
  getStudentContracts,
  getContractById,
  signContract,
  generateContractViewLink,
  getContractFilePath
};