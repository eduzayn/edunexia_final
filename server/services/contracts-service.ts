import { db } from '../db';
import { eq } from 'drizzle-orm';
import {
  educationalContracts,
  simplifiedEnrollments,
  courses,
  users,
  contractStatusEnum,
  type EducationalContract
} from '@shared/schema';
import PDFDocument from 'pdfkit';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface para um contrato educacional
 */
export interface EducationalContract {
  id: number;
  enrollmentId: number;
  studentId: number;
  courseId: number;
  contractType: string;
  contractNumber: string;
  status: 'pending' | 'signed' | 'cancelled';
  totalValue: number;
  installments: number;
  installmentValue: number;
  paymentMethod: string;
  discount: number;
  createdAt: Date;
  signatureDate: Date | null;
  signatureData: string | null;
  additionalTerms: string | null;
  startDate: Date;
  endDate: Date;
  campus: string;
}

/**
 * Gera um contrato educacional com base nos dados da matrícula
 * @param enrollmentId ID da matrícula simplificada
 */
export async function generateContract(enrollmentId: number): Promise<EducationalContract> {
  try {
    // Buscar dados da matrícula
    const [enrollment] = await db.select().from(simplifiedEnrollments)
      .where(eq(simplifiedEnrollments.id, enrollmentId));
    
    if (!enrollment) {
      throw new Error(`Matrícula com ID ${enrollmentId} não encontrada`);
    }
    
    // Buscar dados do curso
    const [course] = await db.select().from(courses)
      .where(eq(courses.id, enrollment.courseId));
    
    if (!course) {
      throw new Error(`Curso com ID ${enrollment.courseId} não encontrado`);
    }
    
    // Determinar o tipo de contrato com base no tipo de curso
    let contractType = 'graduacao';
    
    if (course.courseTypeId) {
      // Buscar dados do tipo de curso
      const [courseType] = await db.select().from(educationalContracts)
        .where(eq(educationalContracts.id, course.courseTypeId));
      
      if (courseType) {
        contractType = courseType.slug || 'graduacao';
      }
    }
    
    // Calcular valores financeiros
    const totalValue = enrollment.totalValue || 0;
    const installments = enrollment.installments || 1;
    const installmentValue = installments ? totalValue / installments : totalValue;
    
    const paymentMethod = enrollment.paymentMethod || 'boleto';
    const discount = enrollment.discount || 0;
    
    // Determinar datas de início e término
    const startDate = course.startDate || new Date();
    const courseMonths = Math.ceil(course.endDate ? (course.endDate.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000) : 24);
    const endDate = course.endDate || new Date(startDate.getTime() + courseMonths * 30 * 24 * 60 * 60 * 1000);
    
    // Determinar campus
    const campus = enrollment.campus || 'SEDE VIRTUAL';
    
    // Gerar número do contrato (formato: CTR-ANO-NÚMERO_SEQUENCIAL)
    const contractNumber = `CTR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`;
    
    // Inserir contrato no banco de dados
    const [contract] = await db.insert(educationalContracts).values({
      id: uuidv4(),
      enrollmentId: enrollment.id.toString(),
      studentId: enrollment.studentId,
      courseId: enrollment.courseId,
      contractNumber,
      contractType,
      status: 'pending',
      totalValue,
      installments,
      installmentValue,
      paymentMethod,
      discount,
      startDate,
      endDate,
      campus
    }).returning();
    
    return contract as unknown as EducationalContract;
  } catch (error) {
    console.error('Erro ao gerar contrato:', error);
    throw error;
  }
}

/**
 * Obtém um contrato pelo ID
 * @param contractId ID do contrato
 */
export async function getContractById(contractId: number): Promise<EducationalContract | null> {
  try {
    const [contract] = await db.select().from(educationalContracts)
      .where(eq(educationalContracts.id, contractId.toString()));
    
    return contract as unknown as EducationalContract;
  } catch (error) {
    console.error('Erro ao obter contrato:', error);
    throw error;
  }
}

/**
 * Obtém todos os contratos de um estudante
 * @param studentId ID do estudante
 */
export async function getContractsByStudentId(studentId: number): Promise<EducationalContract[]> {
  try {
    const contracts = await db.select().from(educationalContracts)
      .where(eq(educationalContracts.studentId, studentId));
    
    return contracts as unknown as EducationalContract[];
  } catch (error) {
    console.error('Erro ao obter contratos do estudante:', error);
    throw error;
  }
}

/**
 * Obtém todos os contratos de uma matrícula
 * @param enrollmentId ID da matrícula
 */
export async function getContractsByEnrollmentId(enrollmentId: number): Promise<EducationalContract[]> {
  try {
    const contracts = await db.select().from(educationalContracts)
      .where(eq(educationalContracts.enrollmentId, enrollmentId.toString()));
    
    return contracts as unknown as EducationalContract[];
  } catch (error) {
    console.error('Erro ao obter contratos da matrícula:', error);
    throw error;
  }
}

/**
 * Assina um contrato
 * @param contractId ID do contrato
 * @param signatureData Dados da assinatura (imagem em base64 ou string)
 */
export async function signContract(
  contractId: number,
  signatureData: string
): Promise<EducationalContract> {
  try {
    const [contract] = await db.select().from(educationalContracts)
      .where(eq(educationalContracts.id, contractId.toString()));
    
    if (!contract) {
      throw new Error(`Contrato com ID ${contractId} não encontrado`);
    }
    
    if (contract.status === 'signed') {
      throw new Error('Este contrato já foi assinado');
    }
    
    // Atualizar contrato com dados de assinatura
    const [updatedContract] = await db.update(educationalContracts)
      .set({
        status: 'signed',
        signatureDate: new Date(),
        signatureData
      })
      .where(eq(educationalContracts.id, contractId.toString()))
      .returning();
    
    return updatedContract as unknown as EducationalContract;
  } catch (error) {
    console.error('Erro ao assinar contrato:', error);
    throw error;
  }
}

/**
 * Gera um PDF do contrato
 * @param contractId ID do contrato
 */
export async function downloadContract(contractId: number): Promise<Buffer> {
  try {
    // Buscar contrato
    const contract = await getContractById(contractId);
    
    if (!contract) {
      throw new Error(`Contrato com ID ${contractId} não encontrado`);
    }
    
    // Buscar estudante
    const [student] = await db.select().from(users)
      .where(eq(users.id, contract.studentId));
    
    if (!student) {
      throw new Error(`Estudante com ID ${contract.studentId} não encontrado`);
    }
    
    // Buscar curso
    const [course] = await db.select().from(courses)
      .where(eq(courses.id, contract.courseId));
    
    if (!course) {
      throw new Error(`Curso com ID ${contract.courseId} não encontrado`);
    }
    
    // Criar PDF
    const pdfBuffer: Buffer = await new Promise((resolve) => {
      const doc = new PDFDocument({
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        size: 'A4'
      });
      
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      
      // Cabeçalho
      doc.fontSize(16).text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Contrato Nº: ${contract.contractNumber}`, { align: 'right' });
      doc.moveDown(2);
      
      // Informações do contrato
      doc.fontSize(12).text('CONTRATADA:', { continued: true }).fontSize(10).text(' Instituição de Ensino EdunexIA');
      doc.moveDown();
      doc.fontSize(12).text('CONTRATANTE:', { continued: true }).fontSize(10).text(` ${student.fullName}`);
      doc.moveDown();
      doc.fontSize(12).text('CPF:', { continued: true }).fontSize(10).text(` ${student.cpf || 'Não informado'}`);
      doc.moveDown();
      doc.fontSize(12).text('Telefone:', { continued: true }).fontSize(10).text(` ${student.phone || 'Não informado'}`);
      doc.moveDown();
      doc.fontSize(12).text('E-mail:', { continued: true }).fontSize(10).text(` ${student.email || 'Não informado'}`);
      doc.moveDown();
      doc.fontSize(12).text('Endereço:', { continued: true }).fontSize(10).text(` ${student.address || 'Não informado'}`);
      doc.moveDown(2);
      
      // Dados do curso
      doc.fontSize(14).text('DADOS DO CURSO', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text('Curso:', { continued: true }).fontSize(10).text(` ${course.name}`);
      doc.moveDown();
      doc.fontSize(12).text('Código:', { continued: true }).fontSize(10).text(` ${course.code}`);
      doc.moveDown();
      doc.fontSize(12).text('Campus:', { continued: true }).fontSize(10).text(` ${contract.campus}`);
      doc.moveDown();
      doc.fontSize(12).text('Início:', { continued: true }).fontSize(10).text(` ${new Date(contract.startDate).toLocaleDateString('pt-BR')}`);
      doc.moveDown();
      doc.fontSize(12).text('Término previsto:', { continued: true }).fontSize(10).text(` ${new Date(contract.endDate).toLocaleDateString('pt-BR')}`);
      doc.moveDown(2);
      
      // Dados financeiros
      doc.fontSize(14).text('DADOS FINANCEIROS', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text('Valor total do curso:', { continued: true }).fontSize(10).text(` R$ ${contract.totalValue.toFixed(2).replace('.', ',')}`);
      doc.moveDown();
      doc.fontSize(12).text('Número de parcelas:', { continued: true }).fontSize(10).text(` ${contract.installments}`);
      doc.moveDown();
      doc.fontSize(12).text('Valor da parcela:', { continued: true }).fontSize(10).text(` R$ ${contract.installmentValue.toFixed(2).replace('.', ',')}`);
      doc.moveDown();
      doc.fontSize(12).text('Forma de pagamento:', { continued: true }).fontSize(10).text(` ${formatPaymentMethod(contract.paymentMethod)}`);
      
      if (contract.discount > 0) {
        doc.moveDown();
        doc.fontSize(12).text('Desconto:', { continued: true }).fontSize(10).text(` ${contract.discount}%`);
      }
      
      doc.moveDown(2);
      
      // Texto do contrato
      doc.fontSize(14).text('TERMOS E CONDIÇÕES', { align: 'center' });
      doc.moveDown();
      
      const contractText = getContractTextByType(contract.contractType);
      doc.fontSize(10).text(contractText, { align: 'justify' });
      
      doc.moveDown(2);
      
      // Assinatura
      doc.fontSize(12).text('LOCAL E DATA:', { align: 'left' });
      doc.moveDown();
      doc.fontSize(10).text('__________________, _____ de ______________ de ________', { align: 'center' });
      doc.moveDown(2);
      
      doc.fontSize(12).text('ASSINATURAS:', { align: 'left' });
      doc.moveDown();
      
      // Linha para assinatura da instituição
      doc.fontSize(10).text('________________________________', { align: 'left' });
      doc.fontSize(10).text('INSTITUIÇÃO DE ENSINO', { align: 'left' });
      
      // Linha para assinatura do aluno
      doc.fontSize(10).text('________________________________', { align: 'right' });
      doc.fontSize(10).text('CONTRATANTE', { align: 'right' });
      
      // Se o contrato já foi assinado, adicionar informações da assinatura
      if (contract.status === 'signed' && contract.signatureDate) {
        doc.moveDown(2);
        doc.fontSize(12).text('INFORMAÇÕES DA ASSINATURA DIGITAL:', { align: 'left' });
        doc.moveDown();
        doc.fontSize(10).text(`Assinado digitalmente por: ${student.fullName}`);
        doc.fontSize(10).text(`Data: ${new Date(contract.signatureDate).toLocaleDateString('pt-BR')} às ${new Date(contract.signatureDate).toLocaleTimeString('pt-BR')}`);
        
        if (contract.signatureData) {
          doc.moveDown();
          doc.fontSize(10).text(`Assinatura: ${contract.signatureData}`);
        }
      }
      
      doc.end();
    });
    
    return pdfBuffer;
  } catch (error) {
    console.error('Erro ao gerar PDF do contrato:', error);
    throw error;
  }
}

/**
 * Formata o método de pagamento para exibição
 */
function formatPaymentMethod(method: string): string {
  const methods: Record<string, string> = {
    'boleto': 'Boleto Bancário',
    'credit_card': 'Cartão de Crédito',
    'debit_card': 'Cartão de Débito',
    'pix': 'PIX',
    'bank_transfer': 'Transferência Bancária',
    'cash': 'Dinheiro',
    'installment': 'Parcelamento'
  };
  
  return methods[method] || method;
}

/**
 * Retorna o texto do contrato com base no tipo
 */
function getContractTextByType(contractType: string): string {
  // Textos simplificados para fins de demonstração
  const texts: Record<string, string> = {
    'graduacao': `
      CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS - CURSO DE GRADUAÇÃO

      Pelo presente instrumento particular de CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS, de um lado, como CONTRATADA, a instituição de ensino superior qualificada no anverso, e, de outro lado, como CONTRATANTE, o aluno ou seu responsável legal, também qualificado no anverso, firmam o presente contrato, mediante as seguintes cláusulas e condições:

      CLÁUSULA 1ª - O objeto do presente contrato é a prestação de serviços educacionais correspondentes ao curso de graduação identificado no anverso, que serão ministrados em conformidade com a legislação aplicável, com o projeto pedagógico do curso e com o Regimento Geral da CONTRATADA.

      CLÁUSULA 2ª - A CONTRATADA se obriga a ministrar aulas presenciais e/ou por meios tecnológicos, conforme o caso, nas datas e locais preestabelecidos, de acordo com a legislação vigente e com o projeto pedagógico do curso.

      CLÁUSULA 3ª - São de inteira responsabilidade da CONTRATADA o planejamento e a prestação dos serviços educacionais, no que se refere à definição de calendários de aulas, de provas e de exames, fixação de cargas horárias, designação de professores, orientação didático-pedagógica e educacional, além de outras providências que as atividades docentes exigirem.

      CLÁUSULA 4ª - Em contraprestação aos serviços educacionais, o CONTRATANTE pagará à CONTRATADA o valor total do curso em parcelas mensais e consecutivas, conforme especificado no anverso, com vencimento no dia 5 (cinco) de cada mês.

      CLÁUSULA 5ª - O não comparecimento do aluno aos atos escolares ora contratados não o exime do pagamento, tendo em vista a disponibilidade do serviço colocado à sua disposição.

      CLÁUSULA 6ª - O presente contrato tem validade para o período letivo de duração do curso, conforme especificado no anverso, podendo ser rescindido nas seguintes hipóteses: a) pelo CONTRATANTE, por desistência formal; b) pela CONTRATADA, por infração disciplinar ou inadimplência do CONTRATANTE.

      CLÁUSULA 7ª - Para dirimir questões oriundas deste contrato, fica eleito o Foro da Comarca onde o curso é ministrado.
    `,
    'pos_graduacao': `
      CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS - CURSO DE PÓS-GRADUAÇÃO LATO SENSU

      Pelo presente instrumento particular de CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS, de um lado, como CONTRATADA, a instituição de ensino superior qualificada no anverso, e, de outro lado, como CONTRATANTE, o aluno também qualificado no anverso, firmam o presente contrato, mediante as seguintes cláusulas e condições:

      CLÁUSULA 1ª - O objeto do presente contrato é a prestação de serviços educacionais correspondentes ao curso de pós-graduação lato sensu identificado no anverso, que serão ministrados em conformidade com a legislação aplicável, com o projeto pedagógico do curso e com o Regimento Geral da CONTRATADA.

      CLÁUSULA 2ª - A CONTRATADA se obriga a ministrar aulas presenciais e/ou por meios tecnológicos, conforme o caso, nas datas e locais preestabelecidos, de acordo com a legislação vigente e com o projeto pedagógico do curso.

      CLÁUSULA 3ª - São de inteira responsabilidade da CONTRATADA o planejamento e a prestação dos serviços educacionais, no que se refere à definição de calendários de aulas, de provas e de exames, fixação de cargas horárias, designação de professores, orientação didático-pedagógica e educacional, além de outras providências que as atividades docentes exigirem.

      CLÁUSULA 4ª - Em contraprestação aos serviços educacionais, o CONTRATANTE pagará à CONTRATADA o valor total do curso em parcelas mensais e consecutivas, conforme especificado no anverso, com vencimento no dia 5 (cinco) de cada mês.

      CLÁUSULA 5ª - O não comparecimento do aluno aos atos escolares ora contratados não o exime do pagamento, tendo em vista a disponibilidade do serviço colocado à sua disposição.

      CLÁUSULA 6ª - O presente contrato tem validade para o período letivo de duração do curso, conforme especificado no anverso, podendo ser rescindido nas seguintes hipóteses: a) pelo CONTRATANTE, por desistência formal; b) pela CONTRATADA, por infração disciplinar ou inadimplência do CONTRATANTE.

      CLÁUSULA 7ª - Para dirimir questões oriundas deste contrato, fica eleito o Foro da Comarca onde o curso é ministrado.
    `,
    'mba': `
      CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS - CURSO DE MBA

      Pelo presente instrumento particular de CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS, de um lado, como CONTRATADA, a instituição de ensino superior qualificada no anverso, e, de outro lado, como CONTRATANTE, o aluno também qualificado no anverso, firmam o presente contrato, mediante as seguintes cláusulas e condições:

      CLÁUSULA 1ª - O objeto do presente contrato é a prestação de serviços educacionais correspondentes ao curso de MBA identificado no anverso, que serão ministrados em conformidade com a legislação aplicável, com o projeto pedagógico do curso e com o Regimento Geral da CONTRATADA.

      CLÁUSULA 2ª - A CONTRATADA se obriga a ministrar aulas presenciais e/ou por meios tecnológicos, conforme o caso, nas datas e locais preestabelecidos, de acordo com a legislação vigente e com o projeto pedagógico do curso.

      CLÁUSULA 3ª - São de inteira responsabilidade da CONTRATADA o planejamento e a prestação dos serviços educacionais, no que se refere à definição de calendários de aulas, de provas e de exames, fixação de cargas horárias, designação de professores, orientação didático-pedagógica e educacional, além de outras providências que as atividades docentes exigirem.

      CLÁUSULA 4ª - Em contraprestação aos serviços educacionais, o CONTRATANTE pagará à CONTRATADA o valor total do curso em parcelas mensais e consecutivas, conforme especificado no anverso, com vencimento no dia 5 (cinco) de cada mês.

      CLÁUSULA 5ª - O não comparecimento do aluno aos atos escolares ora contratados não o exime do pagamento, tendo em vista a disponibilidade do serviço colocado à sua disposição.

      CLÁUSULA 6ª - O presente contrato tem validade para o período letivo de duração do curso, conforme especificado no anverso, podendo ser rescindido nas seguintes hipóteses: a) pelo CONTRATANTE, por desistência formal; b) pela CONTRATADA, por infração disciplinar ou inadimplência do CONTRATANTE.

      CLÁUSULA 7ª - Para dirimir questões oriundas deste contrato, fica eleito o Foro da Comarca onde o curso é ministrado.
    `,
    'segunda_graduacao': `
      CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS - CURSO DE SEGUNDA GRADUAÇÃO

      Pelo presente instrumento particular de CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS, de um lado, como CONTRATADA, a instituição de ensino superior qualificada no anverso, e, de outro lado, como CONTRATANTE, o aluno também qualificado no anverso, firmam o presente contrato, mediante as seguintes cláusulas e condições:

      CLÁUSULA 1ª - O objeto do presente contrato é a prestação de serviços educacionais correspondentes ao curso de segunda graduação identificado no anverso, que serão ministrados em conformidade com a legislação aplicável, com o projeto pedagógico do curso e com o Regimento Geral da CONTRATADA.

      CLÁUSULA 2ª - A CONTRATADA se obriga a ministrar aulas presenciais e/ou por meios tecnológicos, conforme o caso, nas datas e locais preestabelecidos, de acordo com a legislação vigente e com o projeto pedagógico do curso.

      CLÁUSULA 3ª - São de inteira responsabilidade da CONTRATADA o planejamento e a prestação dos serviços educacionais, no que se refere à definição de calendários de aulas, de provas e de exames, fixação de cargas horárias, designação de professores, orientação didático-pedagógica e educacional, além de outras providências que as atividades docentes exigirem.

      CLÁUSULA 4ª - Em contraprestação aos serviços educacionais, o CONTRATANTE pagará à CONTRATADA o valor total do curso em parcelas mensais e consecutivas, conforme especificado no anverso, com vencimento no dia 5 (cinco) de cada mês.

      CLÁUSULA 5ª - O não comparecimento do aluno aos atos escolares ora contratados não o exime do pagamento, tendo em vista a disponibilidade do serviço colocado à sua disposição.

      CLÁUSULA 6ª - O presente contrato tem validade para o período letivo de duração do curso, conforme especificado no anverso, podendo ser rescindido nas seguintes hipóteses: a) pelo CONTRATANTE, por desistência formal; b) pela CONTRATADA, por infração disciplinar ou inadimplência do CONTRATANTE.

      CLÁUSULA 7ª - Para dirimir questões oriundas deste contrato, fica eleito o Foro da Comarca onde o curso é ministrado.
    `
  };
  
  return texts[contractType] || texts['graduacao'];
}