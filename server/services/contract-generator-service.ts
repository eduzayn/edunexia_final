import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { 
  courses, 
  educationalContracts, 
  simplifiedEnrollments, 
  enrollments,
  type Course,
  type SimplifiedEnrollment,
  type Enrollment
} from '@shared/schema';
import { eq } from 'drizzle-orm';
import { storage } from '../storage';

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

/**
 * Interface para os dados de criação de contrato de estudante
 */
interface StudentContractParams {
  studentId: number;
  courseId: number;
  courseName: string;
  institutionId: number;
  institutionName: string;
  studentName: string;
  studentEmail: string;
  studentCpf: string;
  totalValue: number;
  discount?: number;
  installments?: number;
  paymentMethod?: string;
  metadata?: any;
}

/**
 * Gera um contrato educacional para um estudante
 * @param params Parâmetros do contrato
 * @returns Contrato gerado ou null se houver erro
 */
export async function generateStudentContract(params: StudentContractParams): Promise<any> {
  try {
    console.log(`[CONTRATO] Gerando contrato para estudante ${params.studentId} no curso ${params.courseId}`);
    
    // Buscar curso completo
    const course = await storage.getCourse(params.courseId);
    if (!course) {
      throw new Error(`Curso não encontrado: ${params.courseId}`);
    }
    
    // Gerar UUID para contrato
    const contractId = uuidv4();
    
    // Gerar número de contrato
    const contractNumber = `${course.code || 'C'}-${params.studentId}-${Date.now().toString().substring(7, 13)}`;
    
    // Definir tipo de contrato baseado no curso
    const contractType = getCourseType(course);
    
    // Calcular datas de início e término (estimativas)
    const startDate = new Date();
    // Adicionar período baseado no tipo do curso (18 meses é padrão para pós)
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 18);
    
    // Configurar valores financeiros
    const totalValue = params.totalValue;
    const installments = params.installments || 18;
    const installmentValue = totalValue / installments;
    const paymentMethod = params.paymentMethod || 'boleto';
    const discount = params.discount || 0;
    
    // Dados para o contrato
    const contractData = {
      id: contractId,
      studentId: params.studentId,
      courseId: params.courseId,
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
      campus: params.metadata?.poloName || 'Campus Virtual',
      createdAt: new Date(),
      // Adicionar metadados como JSON
      metadata: JSON.stringify({
        institutionId: params.institutionId,
        institutionName: params.institutionName,
        enrollmentId: params.metadata?.enrollmentId,
        customData: params.metadata
      })
    };
    
    // Inserir contrato no banco de dados
    await db.insert(educationalContracts).values(contractData);
    
    console.log(`[CONTRATO] Contrato educacional gerado com sucesso. ID: ${contractId}, Número: ${contractNumber}`);
    
    // Recuperar o contrato inserido para retorno
    const [newContract] = await db
      .select()
      .from(educationalContracts)
      .where(eq(educationalContracts.id, contractId))
      .limit(1);
    
    return newContract;
  } catch (error) {
    console.error('[CONTRATO] Erro ao gerar contrato educacional:', error);
    throw error;
  }
}

/**
 * Gera um contrato a partir de uma matrícula
 * @param enrollmentId ID da matrícula
 * @param studentId ID do estudante
 * @param courseId ID do curso
 * @returns Contrato gerado ou null se houver erro
 */
export async function generateContractFromEnrollment(
  enrollmentId: number, 
  studentId: number,
  courseId: number
): Promise<any> {
  try {
    console.log(`[CONTRATO] Gerando contrato para matrícula ${enrollmentId}`);
    
    // Buscar dados necessários
    const enrollment = await storage.getEnrollment(enrollmentId);
    const course = await storage.getCourse(courseId);
    const student = await storage.getUser(studentId);
    
    if (!enrollment || !course || !student) {
      throw new Error('Dados incompletos para geração de contrato');
    }
    
    // Obter instituição
    const institution = await storage.getInstitution(enrollment.institutionId || 1);
    if (!institution) {
      throw new Error('Instituição não encontrada');
    }
    
    // Gerar contrato para o estudante
    return await generateStudentContract({
      studentId,
      courseId,
      courseName: course.name,
      institutionId: institution.id,
      institutionName: institution.name,
      studentName: student.fullName,
      studentEmail: student.email,
      studentCpf: student.cpf || '',
      totalValue: course.price || 0,
      metadata: {
        enrollmentId,
        enrollmentData: enrollment
      }
    });
  } catch (error) {
    console.error('[CONTRATO] Erro ao gerar contrato a partir de matrícula:', error);
    return null;
  }
}