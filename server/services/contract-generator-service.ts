import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { 
  courses, 
  educationalContracts, 
  simplifiedEnrollments, 
  type Course,
  type SimplifiedEnrollment
} from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Interface para os dados de criação de um contrato educacional
 */
interface ContractGenerationData {
  studentId: number;
  enrollmentId: string;
  courseId: number;
  course: Course;
  enrollmentData: SimplifiedEnrollment;
  contractType?: string;
  totalValue?: number;
  installments?: number;
  paymentMethod?: string;
  discount?: number;
  campus?: string;
}

/**
 * Gera um contrato educacional a partir dos dados de matrícula
 * 
 * @param data Dados para geração do contrato
 * @returns Promise<string> ID do contrato gerado
 */
export async function generateEducationalContract(data: ContractGenerationData): Promise<string> {
  try {
    console.log(`Gerando contrato educacional para matrícula ${data.enrollmentId}`);
    
    // Gerar um ID único para o contrato
    const contractId = uuidv4();
    
    // Gerar número do contrato com base no ID do curso, data e ID do aluno
    const contractNumber = `${data.course.code || 'C'}-${data.studentId}-${Date.now().toString().substring(7, 13)}`;
    
    // Definir tipo de contrato com base no curso (ou usar o tipo fornecido)
    const courseType = data.contractType || getCourseType(data.course);
    
    // Calcular datas de início e término do curso (estimativas baseadas na data atual)
    const startDate = new Date();
    // Adicionar 18 meses (padrão para pós-graduação) - pode ser ajustado com base no tipo de curso
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 18);
    
    // Usar valores fornecidos ou valores padrão baseados nos dados da matrícula
    const totalValue = data.totalValue || data.enrollmentData.fullPrice || 0;
    const installments = data.installments || 18; // Padrão para cursos de pós-graduação
    const installmentValue = totalValue / installments;
    const paymentMethod = data.paymentMethod || 'credit_card';
    const discount = data.discount || (data.enrollmentData.discountPrice ? 
      ((data.enrollmentData.fullPrice - data.enrollmentData.discountPrice) / data.enrollmentData.fullPrice) * 100 : 0);
    
    // Criar dados do contrato
    const contractData = {
      id: contractId,
      enrollmentId: data.enrollmentId,
      studentId: data.studentId,
      courseId: data.courseId,
      contractNumber,
      contractType: courseType,
      status: 'pending',
      totalValue,
      installments,
      installmentValue,
      paymentMethod,
      discount,
      startDate,
      endDate,
      campus: data.campus || 'Campus Virtual',
      createdAt: new Date()
    };
    
    // Inserir contrato no banco de dados
    await db.insert(educationalContracts).values(contractData);
    
    console.log(`Contrato educacional gerado com sucesso. ID: ${contractId}, Número: ${contractNumber}`);
    
    return contractId;
  } catch (error) {
    console.error('Erro ao gerar contrato educacional:', error);
    throw error;
  }
}

/**
 * Determina o tipo de contrato com base nas informações do curso
 */
function getCourseType(course: Course): string {
  // Implementação básica - idealmente isso seria determinado por propriedades do curso
  // ou por uma configuração no banco de dados
  
  // Verificar o nome do curso para determinar o tipo
  const courseName = course.name.toLowerCase();
  
  if (courseName.includes('graduação') && courseName.includes('segunda')) {
    return 'SEGUNDA_GRADUACAO';
  } else if (courseName.includes('graduação') && courseName.includes('pós')) {
    return 'POS_GRADUACAO';
  } else if (courseName.includes('mba')) {
    return 'MBA';
  } else if (courseName.includes('técnico')) {
    return 'TECNICO';
  } else if (courseName.includes('livre') || courseName.includes('extensão')) {
    return 'CURSO_LIVRE';
  } else {
    return 'GRADUACAO'; // Tipo padrão
  }
}