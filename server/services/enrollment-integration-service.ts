
import { db } from '../db';
import { sql, eq, and } from 'drizzle-orm';
import { enrollments, courses, students, users } from '../../shared/schema';

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
      
      /* Código para implementação futura quando a tabela de configurações estiver pronta
      // Verificar se existe um backup temporário das disciplinas do curso
      // Este é um cache temporário que podemos usar para recuperar as seleções
      const cacheKey = `temp_course_disciplines_${courseId}`;
      
      // Aqui precisamos implementar uma tabela de configurações para armazenar estes dados
      const cachedDisciplines = []; 
        
      if (!cachedDisciplines.length) {
        console.log(`Nenhum cache de disciplinas encontrado para o curso ${courseId}`);
        return false;
      }
      
      // Tentar recuperar as disciplinas do cache
      const disciplineIds = JSON.parse(cachedDisciplines[0].value);
      
      if (!Array.isArray(disciplineIds) || disciplineIds.length === 0) {
        console.log(`Cache de disciplinas inválido para o curso ${courseId}`);
        return false;
      }
      
      // Implementar a lógica para persistir as disciplinas no curso
      console.log(`Disciplinas recuperadas com sucesso para o curso ${courseId}`);
      return true;
      */
      
    } catch (error) {
      console.error(`Erro ao reparar disciplinas do curso ${courseId}:`, error);
      return false;
    }
  },
  
  /**
   * Sincroniza uma matrícula simplificada com o sistema central
   * Nota: Esta função está temporariamente desativada e servirá como modelo
   * para implementação futura quando o sistema de matrículas simplificadas for implementado
   */
  async syncSimplifiedEnrollment(simplifiedId: number): Promise<boolean> {
    try {
      console.log(`Sincronização de matrícula simplificada não implementada ainda.`);
      return false;
      
      /* Código comentado para implementação futura
      // Buscar a matrícula simplificada
      const simplified = await db
        .select()
        .from(/* tabela de matrículas simplificadas */)
        .where(eq(/* id da matrícula simplificada */, simplifiedId))
        .limit(1);
      
      if (!simplified.length) {
        console.error(`Matrícula simplificada ${simplifiedId} não encontrada`);
        return false;
      }
      
      const simplifiedData = simplified[0];
      
      // Verificar se já existe uma matrícula formal para esta simplificada
      const existingEnrollment = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments.externalReference, "referência"))
        .limit(1);
      
      if (existingEnrollment.length) {
        console.log(`Matrícula formal já existe para a simplificada ${simplifiedId}`);
        return true;
      }
      
      // Criar ou verificar o aluno
      let studentId: number;
      
      // Verificar se já existe um aluno com este e-mail
      const existingStudent = await db
        .select()
        .from(users)
        .where(eq(users.email, "email do aluno"))
        .limit(1);
      
      if (existingStudent.length) {
        studentId = existingStudent[0].id;
      } else {
        // Criar um novo aluno
        console.log(`Criando novo aluno para matrícula simplificada ${simplifiedId}`);
        
        studentId = 0; // Você substituiria isso pelo ID real do aluno criado
      }
      
      // Criar a matrícula formal
      console.log(`Criando matrícula formal para a simplificada ${simplifiedId}`);
      
      return true;
      */
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
