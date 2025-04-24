import { db } from '../db';
import { eq } from 'drizzle-orm';
import { educationalContracts } from '@shared/schema';
import { users } from '@shared/schema';
import { courses } from '@shared/schema';
import PDFDocument from 'pdfkit';

/**
 * Interface para representar um contrato educacional
 */
export interface EducationalContract {
  id: number;
  enrollmentId: string;
  studentId: number;
  courseId: number;
  contractNumber: string;
  createdAt: Date;
  signatureDate: Date | null;
  status: 'pending' | 'signed' | 'cancelled';
  contractType: string;
  contractUrl?: string;
  expiresAt?: Date;
  totalValue: number;
  installments: number;
  installmentValue: number;
  paymentMethod: string;
  discount: number;
  signatureData?: string;
  additionalTerms?: string;
  startDate: Date;
  endDate: Date;
  campus: string;
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
 * @param signatureData Dados da assinatura
 */
export async function signContract(contractId: number, signatureData: string): Promise<EducationalContract> {
  try {
    // Obter o contrato
    const contract = await getContractById(contractId);
    
    if (!contract) {
      throw new Error(`Contrato com ID ${contractId} não encontrado`);
    }
    
    // Verificar se o contrato já está assinado
    if (contract.status === 'signed') {
      throw new Error('Este contrato já está assinado');
    }
    
    // Atualizar o contrato com os dados da assinatura
    const [updatedContract] = await db.update(educationalContracts)
      .set({
        status: 'signed',
        signatureDate: new Date(),
        signatureData: signatureData
      })
      .where(eq(educationalContracts.id, contractId.toString()))
      .returning();
    
    // Registrar o log da assinatura
    console.log(`Contrato ${contractId} assinado com sucesso em ${new Date().toLocaleString()}`);
    
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
      
      // Dados do contrato
      doc.fontSize(14).text('CONTRATANTE:', { continued: true });
      doc.fontSize(12).text(` ${student.fullName}`, { align: 'left' });
      doc.fontSize(12).text(`CPF: ${student.cpf || 'Não informado'}`, { align: 'left' });
      doc.fontSize(12).text(`Email: ${student.email || 'Não informado'}`, { align: 'left' });
      doc.moveDown();
      
      doc.fontSize(14).text('CONTRATADA:', { continued: true });
      doc.fontSize(12).text(' Instituição de Ensino', { align: 'left' });
      doc.fontSize(12).text('CNPJ: XX.XXX.XXX/0001-XX', { align: 'left' });
      doc.moveDown(2);
      
      // Objeto do contrato
      doc.fontSize(14).text('OBJETO DO CONTRATO', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Curso: ${course.name}`, { align: 'left' });
      doc.fontSize(12).text(`Tipo de curso: ${contract.contractType}`, { align: 'left' });
      doc.fontSize(12).text(`Período: ${new Date(contract.startDate).toLocaleDateString()} a ${new Date(contract.endDate).toLocaleDateString()}`, { align: 'left' });
      doc.fontSize(12).text(`Campus: ${contract.campus}`, { align: 'left' });
      doc.moveDown(2);
      
      // Condições financeiras
      doc.fontSize(14).text('CONDIÇÕES FINANCEIRAS', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Valor total: R$ ${contract.totalValue.toFixed(2)}`, { align: 'left' });
      doc.fontSize(12).text(`Forma de pagamento: ${contract.paymentMethod}`, { align: 'left' });
      doc.fontSize(12).text(`Parcelamento: ${contract.installments}x de R$ ${contract.installmentValue.toFixed(2)}`, { align: 'left' });
      
      if (contract.discount > 0) {
        doc.fontSize(12).text(`Desconto: ${contract.discount}%`, { align: 'left' });
      }
      
      doc.moveDown(2);
      
      // Termos e condições
      doc.fontSize(14).text('TERMOS E CONDIÇÕES', { align: 'center' });
      doc.moveDown();
      
      const terms = `
      1. O presente contrato tem por objeto a prestação de serviços educacionais pela CONTRATADA ao CONTRATANTE, conforme especificado acima.
      
      2. O CONTRATANTE declara estar ciente e de acordo com o conteúdo programático, carga horária, duração, cronograma, critérios de avaliação, aprovação e certificação do curso.
      
      3. O CONTRATANTE se compromete a cumprir o regimento interno da instituição, bem como as normas e procedimentos estabelecidos pela CONTRATADA.
      
      4. A CONTRATADA se compromete a oferecer instalações adequadas, corpo docente qualificado e material didático necessário para o desenvolvimento do curso.
      
      5. O atraso no pagamento das parcelas acarretará multa de 2% sobre o valor devido, além de juros de 1% ao mês, sem prejuízo da atualização monetária.
      
      6. O não comparecimento do CONTRATANTE às aulas não o exime do pagamento das parcelas, tendo em vista que os serviços estão sendo colocados à sua disposição.
      
      7. A rescisão do contrato por iniciativa do CONTRATANTE deverá ser formalizada por escrito, com antecedência mínima de 30 dias, ficando o CONTRATANTE obrigado ao pagamento das parcelas vencidas até a data da rescisão.
      
      8. Este contrato tem início na data de sua assinatura e término previsto conforme especificado acima.
      `;
      
      doc.fontSize(10).text(terms.trim(), { align: 'left' });
      
      // Adicionar termos adicionais se existirem
      if (contract.additionalTerms) {
        doc.moveDown();
        doc.fontSize(14).text('TERMOS ADICIONAIS', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(contract.additionalTerms, { align: 'left' });
      }
      
      doc.moveDown(2);
      
      // Assinatura
      doc.fontSize(12).text(`Local e data: ${contract.campus}, ${new Date().toLocaleDateString()}`, { align: 'left' });
      doc.moveDown(2);
      
      doc.fontSize(12).text('____________________________________', { align: 'left' });
      doc.fontSize(10).text('CONTRATANTE', { align: 'left' });
      doc.moveDown();
      
      doc.fontSize(12).text('____________________________________', { align: 'right' });
      doc.fontSize(10).text('CONTRATADA', { align: 'right' });
      
      // Se o contrato estiver assinado, adicionar a assinatura
      if (contract.status === 'signed' && contract.signatureData) {
        doc.moveDown(2);
        doc.fontSize(12).text('ASSINATURA DIGITAL:', { align: 'left' });
        doc.fontSize(10).text(`Assinado digitalmente por ${student.fullName}`, { align: 'left' });
        doc.fontSize(10).text(`Data da assinatura: ${new Date(contract.signatureDate!).toLocaleString()}`, { align: 'left' });
        doc.fontSize(10).text(`Assinatura: ${contract.signatureData}`, { align: 'left' });
      }
      
      // Finalizar o documento
      doc.end();
    });
    
    return pdfBuffer;
  } catch (error) {
    console.error('Erro ao gerar PDF do contrato:', error);
    throw error;
  }
}