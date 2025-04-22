
import { db } from '../db';
import { sql, eq, and } from 'drizzle-orm';
import { enrollments, courses, users } from '../../shared/schema';
// Nota: simplifiedEnrollments foi removido pois não existe no schema atual

/**
 * Serviço para garantir a integração das matrículas entre os diferentes portais
 */
export const EnrollmentIntegrationService = {
  /**
   * Verifica se uma matrícula está corretamente integrada com o sistema central
   */
  async verifyIntegration(enrollmentId: number): Promise<{ isIntegrated: boolean, issues: string[] }> {
    try {
      const issues: string[] = [];
      
      // Verificar se a matrícula existe nos registros centrais
      const enrollment = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments.id, enrollmentId))
        .limit(1);
      
      if (!enrollment.length) {
        return { 
          isIntegrated: false, 
          issues: ['Matrícula não encontrada no sistema central'] 
        };
      }
      
      const enrollmentData = enrollment[0];
      
      // Verificar se o aluno existe
      const student = await db
        .select()
        .from(users)
        .where(eq(users.id, enrollmentData.studentId))
        .limit(1);
      
      if (!student.length) {
        issues.push('Aluno não encontrado ou não está ativo');
      }
      
      // Verificar se o curso existe
      const course = await db
        .select()
        .from(courses)
        .where(eq(courses.id, enrollmentData.courseId))
        .limit(1);
      
      if (!course.length) {
        issues.push('Curso não encontrado ou não está ativo');
      }
      
      return {
        isIntegrated: issues.length === 0,
        issues
      };
    } catch (error) {
      console.error('Erro ao verificar integração da matrícula:', error);
      return {
        isIntegrated: false,
        issues: ['Erro ao verificar integração: ' + (error instanceof Error ? error.message : 'Erro desconhecido')]
      };
    }
  },
  
  /**
   * Função para reparar ou recuperar disciplinas associadas a um curso
   * Esta função está temporariamente desativada até implementarmos o sistema 
   * de configurações/settings adequado
   */
  async repairCourseDisciplines(courseId: number): Promise<boolean> {
    try {
      console.log(`Funcionalidade de reparo de disciplinas não implementada.`);
      return false;
    } catch (error) {
      console.error(`Erro ao reparar disciplinas do curso ${courseId}:`, error);
      return false;
    }
  },
  
  /**
   * Sincroniza uma matrícula simplificada com o sistema central
   * Nota: Esta função está temporariamente desativada até implementarmos o sistema
   * de matrículas simplificadas
   */
  async syncSimplifiedEnrollment(simplifiedId: number): Promise<boolean> {
    try {
      console.log(`Funcionalidade de matrículas simplificadas não implementada ainda.`);
      return false;
    } catch (error) {
      console.error('Erro ao sincronizar matrícula simplificada:', error);
      return false;
    }
  },
  
  /**
   * Valida uma matrícula verificando consistência dos dados
   */
  async validateEnrollment(enrollmentId: number): Promise<{ isValid: boolean, message?: string }> {
    try {
      // Verificar se a matrícula existe
      const enrollment = await db
        .select({
          id: enrollments.id,
          studentId: enrollments.studentId,
          courseId: enrollments.courseId,
          status: enrollments.status
        })
        .from(enrollments)
        .where(eq(enrollments.id, enrollmentId))
        .limit(1);
      
      if (!enrollment.length) {
        return { isValid: false, message: 'Matrícula não encontrada' };
      }
      
      const enrollmentData = enrollment[0];
      
      // Verificar se o aluno existe
      const student = await db
        .select({
          id: users.id,
          status: users.status
        })
        .from(users)
        .where(eq(users.id, enrollmentData.studentId))
        .limit(1);
      
      if (!student.length) {
        return { isValid: false, message: 'Aluno não encontrado' };
      }
      
      if (student[0].status !== 'active') {
        return { isValid: false, message: 'Aluno não está ativo' };
      }
      
      // Verificar se o curso existe
      const course = await db
        .select({
          id: courses.id,
          status: courses.status
        })
        .from(courses)
        .where(eq(courses.id, enrollmentData.courseId))
        .limit(1);
      
      if (!course.length) {
        return { isValid: false, message: 'Curso não encontrado' };
      }
      
      if (course[0].status !== 'published') {
        return { isValid: false, message: 'Curso não está ativo' };
      }
      
      return { isValid: true };
    } catch (error) {
      console.error('Erro ao validar matrícula:', error);
      return { 
        isValid: false, 
        message: 'Erro ao validar matrícula: ' + (error instanceof Error ? error.message : 'Erro desconhecido') 
      };
    }
  }
};
