import { storage } from '../storage';
import { db } from '../db';
import { 
  courses, 
  users, 
  simplifiedEnrollments, 
  educationalContracts,
  enrollments,
  type User,
  type SimplifiedEnrollment
} from '@shared/schema';
import { sql, eq, and, or, isNull, not, gt, gte, lt } from 'drizzle-orm';
import { generateEducationalContract } from './contract-generator-service';
import { sendStudentCredentialsEmail } from './email-service';
import { sendStudentCredentialsSMS } from './sms-service';
import bcrypt from 'bcrypt';

/**
 * Serviço para integração de matrículas simplificadas
 * Responsável por:
 * 1. Validar e sincronizar matrículas simplificadas
 * 2. Criar perfis de estudantes automaticamente
 * 3. Gerar contratos educacionais
 * 4. Enviar credenciais de acesso aos alunos
 * 5. Recuperar matrículas com problemas de conversão
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
      const formalEnrollment = await storage.convertSimplifiedToFullEnrollment(enrollment.id);
      
      if (!formalEnrollment) {
        console.error(`Erro ao converter matrícula simplificada #${enrollment.id}`);
        return false;
      }
      
      // 6. Gerar contrato educacional
      try {
        const contractData = {
          studentId: student.id,
          enrollmentId: enrollment.uuid,
          courseId: enrollment.courseId,
          course,
          enrollmentData: enrollment
        };
        
        const contractId = await generateEducationalContract(contractData);
        
        if (!contractId) {
          console.error(`Erro ao gerar contrato educacional para matrícula #${enrollment.id}`);
          // Continuamos mesmo sem contrato
        }
      } catch (contractError) {
        console.error(`Erro ao gerar contrato: ${contractError}`);
        // Continuamos mesmo sem contrato
      }
      
      // 7. Enviar e-mail com as credenciais de acesso
      try {
        const emailSent = await sendStudentCredentialsEmail(student.email, student.cpf || '', student.fullName, course.name);
        
        if (!emailSent) {
          console.warn(`Alerta: Não foi possível enviar e-mail de credenciais para ${student.email}`);
        } else {
          console.log(`E-mail de credenciais enviado com sucesso para ${student.email}`);
        }
      } catch (emailError) {
        console.error(`Erro ao enviar e-mail: ${emailError}`);
      }
      
      // 8. Enviar SMS com as credenciais se o telefone estiver disponível
      if (student.phone) {
        try {
          const smsSent = await sendStudentCredentialsSMS(student.phone, student.cpf || '', student.fullName, student.email);
          
          if (!smsSent) {
            console.warn(`Alerta: Não foi possível enviar SMS de credenciais para ${student.phone}`);
          } else {
            console.log(`SMS de credenciais enviado com sucesso para ${student.phone}`);
          }
        } catch (smsError) {
          console.error(`Erro ao enviar SMS: ${smsError}`);
        }
      } else {
        console.log(`Aluno ${student.fullName} não possui telefone cadastrado. SMS de credenciais não enviado.`);
      }
      
      // 9. Registrar log da sincronização
      try {
        await db
          .insert(simplifiedEnrollments)
          .values({
            id: enrollment.id,
            status: 'converted',
            processedAt: new Date(),
            updatedAt: new Date(),
            updatedById: enrollment.createdById || null,
            convertedToEnrollmentId: formalEnrollment.id
          })
          .onConflictDoUpdate({
            target: simplifiedEnrollments.id,
            set: {
              status: 'converted',
              processedAt: new Date(),
              updatedAt: new Date(),
              updatedById: enrollment.createdById || null,
              convertedToEnrollmentId: formalEnrollment.id
            }
          });
        
        console.log(`Matrícula simplificada #${simplifiedEnrollmentId} sincronizada com sucesso`);
      } catch (logError) {
        console.error(`Erro ao registrar log de sincronização: ${logError}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Erro ao sincronizar matrícula simplificada #${simplifiedEnrollmentId}:`, error);
      return false;
    }
  }
  
  /**
   * Verifica e processa todas as matrículas simplificadas pendentes
   * que estão com status 'payment_confirmed' ou 'waiting_payment'
   */
  async processPendingEnrollments(): Promise<{ processed: number, failed: number }> {
    try {
      // Buscar todas as matrículas com status de pagamento confirmado ou aguardando que ainda não foram convertidas
      const pendingEnrollments = await db
        .select()
        .from(simplifiedEnrollments)
        .where(
          and(
            or(
              eq(simplifiedEnrollments.status, 'payment_confirmed'),
              eq(simplifiedEnrollments.status, 'waiting_payment')
            ),
            isNull(simplifiedEnrollments.convertedToEnrollmentId)
          )
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
  
  /**
   * Verifica e recupera matrículas com problemas de conversão
   * Identifica matrículas que deveriam ter sido convertidas mas não foram
   * @returns {Promise<{processed: number, recovered: Array<Object>, failed: number}>} Estatísticas do processo
   */
  async recoverIncompleteEnrollments(): Promise<{ 
    processed: number, 
    recovered: Array<{
      id: number, 
      studentName: string, 
      courseName: string,
      enrollmentId?: number
    }>, 
    failed: number 
  }> {
    try {
      console.log('Iniciando recuperação de matrículas incompletas...');
      
      // Buscar matrículas simplificadas antigas (com mais de 1 dia) que ainda não foram convertidas
      // mas têm status que já deveriam ter sido processadas (waiting_payment ou payment_confirmed)
      const problematicEnrollments = await db
        .select({
          simplified: simplifiedEnrollments,
          course: {
            name: courses.name
          }
        })
        .from(simplifiedEnrollments)
        .leftJoin(courses, eq(courses.id, simplifiedEnrollments.courseId))
        .where(
          and(
            or(
              eq(simplifiedEnrollments.status, 'waiting_payment'),
              eq(simplifiedEnrollments.status, 'payment_confirmed')
            ),
            isNull(simplifiedEnrollments.convertedToEnrollmentId),
            // Matrículas com mais de 1 dia (86400000 ms = 1 dia)
            lt(simplifiedEnrollments.createdAt, new Date(Date.now() - 86400000))
          )
        );
      
      console.log(`Encontradas ${problematicEnrollments.length} matrículas com problemas de conversão`);
      
      let processed = problematicEnrollments.length;
      let failedCount = 0;
      const recoveredEnrollments: Array<{
        id: number, 
        studentName: string, 
        courseName: string,
        enrollmentId?: number
      }> = [];
      
      // Tentar recuperar cada matrícula problemática
      for (const { simplified: enrollment, course } of problematicEnrollments) {
        console.log(`Tentando recuperar matrícula simplificada #${enrollment.id} (${enrollment.studentName})`);
        
        let enrollmentId: number | undefined;
        
        // Verificar se já existe um estudante com o mesmo email
        let student = await storage.getUserByEmail(enrollment.studentEmail);
        
        // Verificar se já existe uma matrícula formal para este estudante e curso
        if (student) {
          const existingEnrollments = await db
            .select()
            .from(enrollments)
            .where(
              and(
                eq(enrollments.studentId, student.id),
                eq(enrollments.courseId, enrollment.courseId)
              )
            );
          
          // Se já existe uma matrícula formal, apenas atualize a simplificada
          if (existingEnrollments.length > 0) {
            console.log(`Encontrada matrícula formal existente #${existingEnrollments[0].id} para o estudante ${student.id}`);
            
            try {
              await db
                .update(simplifiedEnrollments)
                .set({
                  status: 'converted',
                  convertedToEnrollmentId: existingEnrollments[0].id,
                  processedAt: new Date(),
                  updatedAt: new Date()
                })
                .where(eq(simplifiedEnrollments.id, enrollment.id));
              
              enrollmentId = existingEnrollments[0].id;
              
              recoveredEnrollments.push({
                id: enrollment.id,
                studentName: enrollment.studentName,
                courseName: course?.name || `Curso ID: ${enrollment.courseId}`,
                enrollmentId
              });
              
              continue;
            } catch (updateError) {
              console.error(`Erro ao atualizar matrícula simplificada: ${updateError}`);
              failedCount++;
              continue;
            }
          }
        }
        
        // Caso contrário, tente sincronizar a matrícula
        const success = await this.syncSimplifiedEnrollment(enrollment.id);
        
        if (success) {
          // Buscar a matrícula simplificada atualizada para obter o ID da matrícula formal
          const updatedEnrollment = await storage.getSimplifiedEnrollment(enrollment.id);
          
          recoveredEnrollments.push({
            id: enrollment.id,
            studentName: enrollment.studentName,
            courseName: course?.name || `Curso ID: ${enrollment.courseId}`,
            enrollmentId: updatedEnrollment?.convertedToEnrollmentId || undefined
          });
        } else {
          failedCount++;
        }
      }
      
      console.log(`Recuperação concluída: ${recoveredEnrollments.length} recuperadas, ${failedCount} falhas`);
      return { 
        processed,
        recovered: recoveredEnrollments, 
        failed: failedCount 
      };
    } catch (error) {
      console.error('Erro ao recuperar matrículas incompletas:', error);
      throw error;
    }
  }
}

export default new EnrollmentIntegrationService();