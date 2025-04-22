
/**
 * Script para verificar e reparar a integridade das matrículas em todo o sistema
 * Executa verificações em todas as matrículas e tenta reparar problemas de integração
 */

import { db } from '../db';
import { sql, eq, and, or } from 'drizzle-orm';
import { enrollments, simplifiedEnrollments, courses, users } from '../../shared/schema';
import { EnrollmentIntegrationService } from '../services/enrollment-integration-service';

async function main() {
  console.log("Iniciando verificação de integridade de matrículas...");
  
  try {
    // 1. Verificar matrículas formais
    console.log("\n=== Verificando matrículas formais ===");
    const formalEnrollments = await db.select().from(enrollments);
    console.log(`Total de matrículas formais: ${formalEnrollments.length}`);
    
    let formalIssuesCount = 0;
    
    for (const enrollment of formalEnrollments) {
      const result = await EnrollmentIntegrationService.validateEnrollment(enrollment.id);
      if (!result.isValid) {
        formalIssuesCount++;
        console.log(`[ISSUE] Matrícula #${enrollment.id}: ${result.message}`);
      }
    }
    
    console.log(`Matrículas com problemas: ${formalIssuesCount} (${((formalIssuesCount / formalEnrollments.length) * 100).toFixed(2)}%)`);
    
    // 2. Verificar matrículas simplificadas
    console.log("\n=== Verificando matrículas simplificadas ===");
    const simplifiedEntries = await db.select().from(simplifiedEnrollments);
    console.log(`Total de matrículas simplificadas: ${simplifiedEntries.length}`);
    
    // Verificar quais não possuem contrapartida no sistema formal
    let simplifiedWithoutFormal = 0;
    
    for (const simplified of simplifiedEntries) {
      // Checar se existe matrícula formal correspondente
      const formal = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments.externalReference, simplified.externalReference))
        .limit(1);
        
      if (!formal.length) {
        simplifiedWithoutFormal++;
        console.log(`[ISSUE] Matrícula simplificada #${simplified.id} sem correspondente formal`);
        
        // Tentar sincronizar
        if (simplified.status === 'payment_confirmed' || simplified.status === 'completed') {
          console.log(`[REPAIR] Tentando sincronizar matrícula simplificada #${simplified.id}`);
          const syncResult = await EnrollmentIntegrationService.syncSimplifiedEnrollment(simplified.id);
          console.log(`[REPAIR] Resultado: ${syncResult ? 'Sucesso' : 'Falha'}`);
        }
      }
    }
    
    console.log(`Matrículas simplificadas sem correspondente formal: ${simplifiedWithoutFormal} (${((simplifiedWithoutFormal / simplifiedEntries.length) * 100).toFixed(2)}%)`);
    
    // 3. Verificar alunos sem matrículas
    console.log("\n=== Verificando alunos ===");
    const studentsWithoutEnrollments = await db
      .select({ 
        id: users.id,
        name: users.fullName,
        email: users.email
      })
      .from(users)
      .leftJoin(enrollments, eq(users.id, enrollments.studentId))
      .where(and(
        eq(users.portalType, 'student'),
        eq(users.status, 'active'),
        eq(enrollments.id, null) // JOIN sem correspondência
      ));
    
    console.log(`Alunos ativos sem matrículas: ${studentsWithoutEnrollments.length}`);
    
    // 4. Verificar cursos sem matrículas
    console.log("\n=== Verificando cursos ===");
    const coursesWithoutEnrollments = await db
      .select({ 
        id: courses.id,
        name: courses.name
      })
      .from(courses)
      .leftJoin(enrollments, eq(courses.id, enrollments.courseId))
      .where(and(
        eq(courses.status, 'published'),
        eq(enrollments.id, null) // JOIN sem correspondência
      ));
    
    console.log(`Cursos ativos sem matrículas: ${coursesWithoutEnrollments.length}`);
    
    console.log("\n=== Verificação de integridade concluída ===");
    
  } catch (error) {
    console.error("Erro durante a verificação de integridade:", error);
  }
}

// Executar o script
main().catch(console.error);
