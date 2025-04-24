import { storage } from '../storage';
import { db } from '../db';
import { 
  courses, 
  users, 
  simplifiedEnrollments, 
  educationalContracts,
  type User,
  type SimplifiedEnrollment
} from '@shared/schema';
import { eq } from 'drizzle-orm';
import { generateEducationalContract } from './contract-generator-service';
import { sendStudentCredentialsEmail } from './email-service';
import bcrypt from 'bcrypt';

/**
 * Serviço para integração de matrículas simplificadas
 * Responsável por:
 * 1. Validar e sincronizar matrículas simplificadas
 * 2. Criar perfis de estudantes automaticamente
 * 3. Gerar contratos educacionais
 * 4. Enviar credenciais de acesso aos alunos
 */
class EnrollmentIntegrationService {
  
  /**
   * Sincroniza uma matrícula simplificada, criando perfil de estudante e contrato educacional
   * @param simplifiedEnrollmentId ID da matrícula simplificada
   * @returns Promise<boolean> Sucesso da sincronização
   */
  async syncSimplifiedEnrollment(simplifiedEnrollmentId: number): Promise<boolean> {
    try {
      console.log(`Iniciando sincronização da matrícula simplificada #${simplifiedEnrollmentId}`);
      
      // 1. Buscar dados da matrícula simplificada
      const enrollment = await storage.getSimplifiedEnrollment(simplifiedEnrollmentId);
      if (!enrollment) {
        console.error(`Matrícula simplificada #${simplifiedEnrollmentId} não encontrada`);
        return false;
      }
      
      // Verificar se a matrícula já foi processada
      if (enrollment.status === 'converted' || enrollment.convertedToEnrollmentId) {
        console.log(`Matrícula simplificada #${simplifiedEnrollmentId} já foi processada anteriormente`);
        return true;
      }
      
      // 2. Verificar se o estudante já existe por e-mail
      let student: User | undefined = await storage.getUserByEmail(enrollment.studentEmail);
      
      // 3. Se o estudante não existir, criar um novo perfil
      if (!student) {
        console.log(`Criando novo perfil de estudante para: ${enrollment.studentEmail}`);
        
        // Remover formatação do CPF (pontos e traços)
        const cleanCpf = enrollment.studentCpf ? enrollment.studentCpf.replace(/[^\d]/g, '') : '';
        
        // Hash da senha (CPF sem formatação)
        const hashedPassword = await bcrypt.hash(cleanCpf, 10);
        
        // Criar perfil de estudante
        student = await storage.createUser({
          username: enrollment.studentEmail,
          password: hashedPassword,
          fullName: enrollment.studentName,
          email: enrollment.studentEmail,
          cpf: enrollment.studentCpf,
          phone: enrollment.studentPhone,
          status: 'active',
          portalType: 'student',
          role: 'student',
          // Usar como base o primeiro nome como username se necessário
          displayName: enrollment.studentName.split(' ')[0],
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log(`Perfil de estudante criado com sucesso. ID: ${student.id}`);
      } else {
        console.log(`Estudante já existe no sistema: ${student.email} (ID: ${student.id})`);
      }
      
      // 4. Buscar detalhes do curso
      const course = await storage.getCourse(enrollment.courseId);
      if (!course) {
        console.error(`Curso ID #${enrollment.courseId} não encontrado`);
        return false;
      }
      
      // 5. Gerar a matrícula formal com base na simplificada
      const formalEnrollment = await storage.convertSimplifiedEnrollment(enrollment.id, student);
      
      if (!formalEnrollment) {
        console.error(`Erro ao converter matrícula simplificada #${enrollment.id}`);
        return false;
      }
      
      // 6. Gerar contrato educacional
      const contractId = await generateEducationalContract({
        studentId: student.id,
        enrollmentId: enrollment.uuid,
        courseId: enrollment.courseId,
        course,
        enrollmentData: enrollment
      });
      
      if (!contractId) {
        console.error(`Erro ao gerar contrato educacional para matrícula #${enrollment.id}`);
        return false;
      }
      
      // 7. Enviar e-mail com as credenciais de acesso
      const emailSent = await sendStudentCredentialsEmail(
        student.email,
        student.cpf || '',
        student.fullName,
        course.name
      );
      
      if (!emailSent) {
        console.warn(`Alerta: Não foi possível enviar e-mail de credenciais para ${student.email}`);
        // Continuamos com o processo mesmo se o e-mail falhar
      } else {
        console.log(`E-mail de credenciais enviado com sucesso para ${student.email}`);
      }
      
      // 8. Registrar log da sincronização
      await storage.createSimplifiedEnrollmentStatusLog({
        enrollmentId: enrollment.id,
        fromStatus: enrollment.status,
        toStatus: 'converted',
        reason: 'Matrícula processada com sucesso, criando perfil de estudante e contrato',
        createdAt: new Date(),
        userId: enrollment.createdById
      });
      
      console.log(`Matrícula simplificada #${simplifiedEnrollmentId} sincronizada com sucesso`);
      return true;
    } catch (error) {
      console.error(`Erro ao sincronizar matrícula simplificada #${simplifiedEnrollmentId}:`, error);
      return false;
    }
  }
  
  /**
   * Verifica e processa todas as matrículas simplificadas pendentes
   * que estão com status 'payment_confirmed' ou 'completed'
   */
  async processPendingEnrollments(): Promise<{ processed: number, failed: number }> {
    try {
      // Buscar todas as matrículas com status de pagamento confirmado que ainda não foram convertidas
      const pendingEnrollments = await db
        .select()
        .from(simplifiedEnrollments)
        .where(
          eq(simplifiedEnrollments.status, 'payment_confirmed')
        );
      
      console.log(`Encontradas ${pendingEnrollments.length} matrículas pendentes de processamento`);
      
      let processed = 0;
      let failed = 0;
      
      // Processar cada matrícula pendente
      for (const enrollment of pendingEnrollments) {
        const success = await this.syncSimplifiedEnrollment(enrollment.id);
        
        if (success) {
          processed++;
        } else {
          failed++;
        }
      }
      
      return { processed, failed };
    } catch (error) {
      console.error('Erro ao processar matrículas pendentes:', error);
      throw error;
    }
  }
}

export default new EnrollmentIntegrationService();