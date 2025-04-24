/**
 * Rotas para matrículas simplificadas
 */

import express from 'express';
import {
  createSimplifiedEnrollment,
  getSimplifiedEnrollment,
  listSimplifiedEnrollments,
  processWebhook,
  processEnrollment,
  cancelEnrollment,
  generatePaymentLink
} from '../controllers/simplified-enrollment-controller';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/permission-middleware';

const router = express.Router();

// Rota pública para webhook do Asaas
router.post('/webhook/asaas', processWebhook);

// Rotas protegidas para gerenciamento de matrículas simplificadas
router.get('/', requireAuth, requirePermission('matricula', 'listar'), listSimplifiedEnrollments);
router.post('/', requireAuth, requirePermission('matricula', 'criar'), createSimplifiedEnrollment);
router.get('/:id', requireAuth, requirePermission('matricula', 'ler'), getSimplifiedEnrollment);
router.post('/:id/process', requireAuth, requirePermission('matricula', 'aprovar'), processEnrollment);
router.post('/:id/cancel', requireAuth, requirePermission('matricula', 'cancelar'), cancelEnrollment);
router.post('/:id/generate-payment-link', requireAuth, requirePermission('matricula', 'editar'), generatePaymentLink);

export default router;
router.post('/:id/fix-student-account', requireAuth, requirePermission('matricula', 'editar'), async (req, res) => {
  try {
    const { id } = req.params;
    const enrollmentId = parseInt(id);
    
    if (isNaN(enrollmentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de matrícula inválido'
      });
    }
    
    // Buscar matrícula simplificada
    const enrollment = await db.select()
      .from(simplifiedEnrollments)
      .where(eq(simplifiedEnrollments.id, enrollmentId))
      .limit(1);
    
    if (!enrollment.length) {
      return res.status(404).json({
        success: false,
        message: 'Matrícula não encontrada'
      });
    }
    
    const simplifiedEnrollment = enrollment[0];
    
    // Verificar se já existe um usuário com esse email
    const storage = require('../storage').storage;
    let existingUser = await storage.getUserByUsername(simplifiedEnrollment.studentEmail);
    
    // Se o usuário não existir, criar um novo
    if (!existingUser) {
      // Usar CPF como senha inicial (remover pontos e traços)
      const initialPassword = simplifiedEnrollment.studentCpf ? 
        simplifiedEnrollment.studentCpf.replace(/[^\d]/g, '') : 
        Math.random().toString(36).slice(-8);
      
      // Criar o usuário no sistema
      existingUser = await storage.createUser({
        username: simplifiedEnrollment.studentEmail,
        password: initialPassword,
        fullName: simplifiedEnrollment.studentName,
        email: simplifiedEnrollment.studentEmail,
        cpf: simplifiedEnrollment.studentCpf ? simplifiedEnrollment.studentCpf.replace(/[^\d]/g, '') : null,
        phone: simplifiedEnrollment.studentPhone,
        portalType: 'student',
        status: 'active',
        asaasId: simplifiedEnrollment.asaasCustomerId || null
      });
      
      // Enviar email com as credenciais
      try {
        const emailService = require('../services/email-service');
        const courseResult = await db.select().from(courses).where(eq(courses.id, simplifiedEnrollment.courseId)).limit(1);
        const courseName = courseResult.length ? courseResult[0].name : 'Curso';
        
        await emailService.sendStudentCredentialsEmail({
          to: existingUser.email,
          name: existingUser.fullName,
          username: existingUser.username,
          password: initialPassword,
          courseName: courseName
        });
      } catch (emailError) {
        console.error(`Erro ao enviar email com credenciais:`, emailError);
      }
    }
    
    // Atualizar a matrícula com o ID do usuário
    await db.update(simplifiedEnrollments)
      .set({ 
        studentId: existingUser.id, 
        updatedAt: new Date() 
      })
      .where(eq(simplifiedEnrollments.id, enrollmentId));
    
    res.json({
      success: true,
      message: 'Conta de estudante verificada e corrigida com sucesso',
      userId: existingUser.id,
      username: existingUser.username
    });
  } catch (error) {
    console.error('Erro ao verificar/corrigir conta de estudante:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar/corrigir conta de estudante',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});
