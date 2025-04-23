import express from "express";
import { db } from "../db";
import { 
  certificates, 
  insertCertificateSchema,
  certificateDisciplines,
  insertCertificateDisciplineSchema,
  certificateHistory,
  insertCertificateHistorySchema,
  enrollments,
  users
} from "@shared/schema";
import { eq, and, desc, inArray, like, isNull, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { generateUniqueCode } from "../utils";
import { 
  generateCertificatePdf, 
  generateTranscriptPdf, 
  saveCertificatePdf 
} from "../services/certificate-generator";
import fs from "fs";
import path from "path";

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(requireAuth);

// Listar todos os certificados
router.get("/", async (req, res) => {
  try {
    const status = req.query.status?.toString();
    const studentName = req.query.studentName?.toString();
    const courseId = req.query.courseId ? parseInt(req.query.courseId.toString()) : undefined;
    const page = parseInt(req.query.page?.toString() || "1");
    const pageSize = parseInt(req.query.pageSize?.toString() || "20");
    const offset = (page - 1) * pageSize;
    
    let query = db.select({
      certificates: certificates,
      studentName: users.fullName,
      courseName: sql<string>`certificates.course_name`,
      templateName: sql<string>`certificate_templates.name`,
      issueDate: certificates.issuedAt,
      status: certificates.status,
    })
    .from(certificates)
    .leftJoin(users, eq(certificates.studentId, users.id))
    .leftJoin("certificate_templates", eq(certificates.templateId, sql<number>`certificate_templates.id`));
    
    // Aplicar filtros
    const conditions = [];
    
    if (status) {
      conditions.push(eq(certificates.status, status));
    }
    
    if (studentName) {
      conditions.push(like(users.fullName, `%${studentName}%`));
    }
    
    if (courseId) {
      conditions.push(eq(certificates.courseId, courseId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Executar a consulta com paginação
    const totalQuery = db.select({ count: sql<number>`count(*)` })
      .from(certificates);
    
    if (conditions.length > 0) {
      totalQuery.where(and(...conditions));
    }
    
    const [{ count }] = await totalQuery;
    
    const results = await query
      .orderBy(desc(certificates.createdAt))
      .limit(pageSize)
      .offset(offset);
    
    return res.json({
      data: results,
      pagination: {
        totalItems: Number(count),
        totalPages: Math.ceil(Number(count) / pageSize),
        currentPage: page,
        pageSize,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar certificados:", error);
    return res.status(500).json({
      message: "Erro ao buscar certificados",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Buscar certificado por ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.id, parseInt(id)),
      with: {
        student: true,
        course: true,
        template: true,
        signer: true,
        createdBy: true,
        disciplines: {
          with: {
            discipline: true,
          },
        },
        history: {
          orderBy: [desc(certificateHistory.createdAt)],
        },
      },
    });
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificado não encontrado" });
    }
    
    return res.json(certificate);
  } catch (error) {
    console.error("Erro ao buscar certificado:", error);
    return res.status(500).json({
      message: "Erro ao buscar certificado",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Criar novo certificado
router.post("/", validateBody(insertCertificateSchema), async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user?.id;
    
    // Verificar se o aluno existe
    const student = await db.query.users.findFirst({
      where: eq(users.id, data.studentId),
    });
    
    if (!student) {
      return res.status(404).json({ message: "Aluno não encontrado" });
    }
    
    // Verificar se a matrícula existe e está ativa/concluída
    if (data.enrollmentId) {
      const enrollment = await db.query.enrollments.findFirst({
        where: eq(enrollments.id, data.enrollmentId),
      });
      
      if (!enrollment) {
        return res.status(404).json({ message: "Matrícula não encontrada" });
      }
      
      if (!["active", "completed"].includes(enrollment.status)) {
        return res.status(400).json({ 
          message: "Não é possível emitir certificado para uma matrícula que não está ativa ou concluída" 
        });
      }
    }
    
    // Gerar código único para o certificado
    const code = await generateUniqueCode("CERT", async (code) => {
      const existingCert = await db.query.certificates.findFirst({
        where: eq(certificates.code, code),
      });
      return !existingCert;
    });
    
    // Criar o certificado
    const [newCertificate] = await db.insert(certificates).values({
      ...data,
      code,
      createdById: userId || null,
      status: data.status || "draft",
    }).returning();
    
    // Registrar histórico de criação
    await db.insert(certificateHistory).values({
      certificateId: newCertificate.id,
      action: "created",
      description: "Certificado criado",
      performedById: userId || null,
    });
    
    return res.status(201).json(newCertificate);
  } catch (error) {
    console.error("Erro ao criar certificado:", error);
    return res.status(500).json({
      message: "Erro ao criar certificado",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Atualizar certificado
router.put("/:id", validateBody(insertCertificateSchema.partial()), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user?.id;
    
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.id, parseInt(id)),
    });
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificado não encontrado" });
    }
    
    // Verificar se o certificado já foi emitido e se está tentando alterar algo crítico
    if (certificate.status === "issued" && 
        (data.studentId || data.courseId || data.enrollmentId)) {
      return res.status(400).json({ 
        message: "Não é possível alterar informações críticas de um certificado já emitido" 
      });
    }
    
    // Atualizar certificado
    const [updatedCertificate] = await db.update(certificates)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(certificates.id, parseInt(id)))
      .returning();
    
    // Registrar histórico de atualização
    await db.insert(certificateHistory).values({
      certificateId: parseInt(id),
      action: "updated",
      description: "Certificado atualizado",
      performedById: userId || null,
    });
    
    return res.json(updatedCertificate);
  } catch (error) {
    console.error("Erro ao atualizar certificado:", error);
    return res.status(500).json({
      message: "Erro ao atualizar certificado",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Emitir certificado
router.post("/:id/issue", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.id, parseInt(id)),
    });
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificado não encontrado" });
    }
    
    if (certificate.status === "issued") {
      return res.status(400).json({ message: "Certificado já está emitido" });
    }
    
    if (certificate.status === "revoked") {
      return res.status(400).json({ message: "Não é possível emitir um certificado revogado" });
    }
    
    // Emitir o certificado
    const [issuedCertificate] = await db.update(certificates)
      .set({
        status: "issued",
        issuedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(certificates.id, parseInt(id)))
      .returning();
    
    // Registrar histórico de emissão
    await db.insert(certificateHistory).values({
      certificateId: parseInt(id),
      action: "issued",
      description: "Certificado emitido",
      performedById: userId || null,
    });
    
    return res.json(issuedCertificate);
  } catch (error) {
    console.error("Erro ao emitir certificado:", error);
    return res.status(500).json({
      message: "Erro ao emitir certificado",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Revogar certificado
router.post("/:id/revoke", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;
    
    if (!reason) {
      return res.status(400).json({ message: "É necessário informar o motivo da revogação" });
    }
    
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.id, parseInt(id)),
    });
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificado não encontrado" });
    }
    
    if (certificate.status === "draft") {
      return res.status(400).json({ 
        message: "Não é possível revogar um certificado que ainda não foi emitido" 
      });
    }
    
    if (certificate.status === "revoked") {
      return res.status(400).json({ message: "Certificado já está revogado" });
    }
    
    // Revogar o certificado
    const [revokedCertificate] = await db.update(certificates)
      .set({
        status: "revoked",
        updatedAt: new Date(),
      })
      .where(eq(certificates.id, parseInt(id)))
      .returning();
    
    // Registrar histórico de revogação
    await db.insert(certificateHistory).values({
      certificateId: parseInt(id),
      action: "revoked",
      description: `Certificado revogado. Motivo: ${reason}`,
      performedById: userId || null,
    });
    
    return res.json(revokedCertificate);
  } catch (error) {
    console.error("Erro ao revogar certificado:", error);
    return res.status(500).json({
      message: "Erro ao revogar certificado",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// ============== Rotas para disciplinas do certificado ==============

// Listar disciplinas de um certificado
router.get("/:certificateId/disciplines", async (req, res) => {
  try {
    const { certificateId } = req.params;
    
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.id, parseInt(certificateId)),
    });
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificado não encontrado" });
    }
    
    const disciplines = await db.query.certificateDisciplines.findMany({
      where: eq(certificateDisciplines.certificateId, parseInt(certificateId)),
      with: {
        discipline: true,
      },
    });
    
    return res.json(disciplines);
  } catch (error) {
    console.error("Erro ao buscar disciplinas do certificado:", error);
    return res.status(500).json({
      message: "Erro ao buscar disciplinas do certificado",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Adicionar disciplina ao certificado
router.post("/:certificateId/disciplines", validateBody(insertCertificateDisciplineSchema), async (req, res) => {
  try {
    const { certificateId } = req.params;
    const data = req.body;
    const userId = req.user?.id;
    
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.id, parseInt(certificateId)),
    });
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificado não encontrado" });
    }
    
    // Verificar se o certificado já foi emitido
    if (certificate.status === "issued") {
      return res.status(400).json({ 
        message: "Não é possível adicionar disciplinas a um certificado já emitido" 
      });
    }
    
    // Verificar se a disciplina já existe no certificado
    const existingDiscipline = await db.query.certificateDisciplines.findFirst({
      where: and(
        eq(certificateDisciplines.certificateId, parseInt(certificateId)),
        eq(certificateDisciplines.disciplineId, data.disciplineId)
      ),
    });
    
    if (existingDiscipline) {
      return res.status(400).json({ message: "Disciplina já adicionada ao certificado" });
    }
    
    // Adicionar disciplina ao certificado
    const [newCertificateDiscipline] = await db.insert(certificateDisciplines).values({
      certificateId: parseInt(certificateId),
      disciplineId: data.disciplineId,
      professorName: data.professorName,
      professorTitle: data.professorTitle,
      workload: data.workload,
      attendance: data.attendance,
      performance: data.performance,
    }).returning();
    
    // Registrar histórico
    await db.insert(certificateHistory).values({
      certificateId: parseInt(certificateId),
      action: "discipline_added",
      description: `Disciplina adicionada: ${data.disciplineId}`,
      performedById: userId || null,
    });
    
    // Buscar disciplina com dados completos
    const disciplineWithDetails = await db.query.certificateDisciplines.findFirst({
      where: eq(certificateDisciplines.id, newCertificateDiscipline.id),
      with: {
        discipline: true,
      },
    });
    
    return res.status(201).json(disciplineWithDetails);
  } catch (error) {
    console.error("Erro ao adicionar disciplina ao certificado:", error);
    return res.status(500).json({
      message: "Erro ao adicionar disciplina ao certificado",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Atualizar disciplina do certificado
router.put("/:certificateId/disciplines/:disciplineId", validateBody(insertCertificateDisciplineSchema.partial()), async (req, res) => {
  try {
    const { certificateId, disciplineId } = req.params;
    const data = req.body;
    const userId = req.user?.id;
    
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.id, parseInt(certificateId)),
    });
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificado não encontrado" });
    }
    
    // Verificar se o certificado já foi emitido
    if (certificate.status === "issued") {
      return res.status(400).json({ 
        message: "Não é possível modificar disciplinas de um certificado já emitido" 
      });
    }
    
    // Verificar se a disciplina existe no certificado
    const certificateDiscipline = await db.query.certificateDisciplines.findFirst({
      where: and(
        eq(certificateDisciplines.certificateId, parseInt(certificateId)),
        eq(certificateDisciplines.disciplineId, parseInt(disciplineId))
      ),
    });
    
    if (!certificateDiscipline) {
      return res.status(404).json({ message: "Disciplina não encontrada no certificado" });
    }
    
    // Atualizar disciplina
    const [updatedCertificateDiscipline] = await db.update(certificateDisciplines)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(certificateDisciplines.certificateId, parseInt(certificateId)),
          eq(certificateDisciplines.disciplineId, parseInt(disciplineId))
        )
      )
      .returning();
    
    // Registrar histórico
    await db.insert(certificateHistory).values({
      certificateId: parseInt(certificateId),
      action: "discipline_updated",
      description: `Disciplina atualizada: ${disciplineId}`,
      performedById: userId || null,
    });
    
    // Buscar disciplina com dados completos
    const disciplineWithDetails = await db.query.certificateDisciplines.findFirst({
      where: eq(certificateDisciplines.id, updatedCertificateDiscipline.id),
      with: {
        discipline: true,
      },
    });
    
    return res.json(disciplineWithDetails);
  } catch (error) {
    console.error("Erro ao atualizar disciplina do certificado:", error);
    return res.status(500).json({
      message: "Erro ao atualizar disciplina do certificado",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Remover disciplina do certificado
router.delete("/:certificateId/disciplines/:disciplineId", async (req, res) => {
  try {
    const { certificateId, disciplineId } = req.params;
    const userId = req.user?.id;
    
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.id, parseInt(certificateId)),
    });
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificado não encontrado" });
    }
    
    // Verificar se o certificado já foi emitido
    if (certificate.status === "issued") {
      return res.status(400).json({ 
        message: "Não é possível remover disciplinas de um certificado já emitido" 
      });
    }
    
    // Verificar se a disciplina existe no certificado
    const certificateDiscipline = await db.query.certificateDisciplines.findFirst({
      where: and(
        eq(certificateDisciplines.certificateId, parseInt(certificateId)),
        eq(certificateDisciplines.disciplineId, parseInt(disciplineId))
      ),
    });
    
    if (!certificateDiscipline) {
      return res.status(404).json({ message: "Disciplina não encontrada no certificado" });
    }
    
    // Remover disciplina
    await db.delete(certificateDisciplines)
      .where(
        and(
          eq(certificateDisciplines.certificateId, parseInt(certificateId)),
          eq(certificateDisciplines.disciplineId, parseInt(disciplineId))
        )
      );
    
    // Registrar histórico
    await db.insert(certificateHistory).values({
      certificateId: parseInt(certificateId),
      action: "discipline_removed",
      description: `Disciplina removida: ${disciplineId}`,
      performedById: userId || null,
    });
    
    return res.status(204).end();
  } catch (error) {
    console.error("Erro ao remover disciplina do certificado:", error);
    return res.status(500).json({
      message: "Erro ao remover disciplina do certificado",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Endpoint para verificação pública de certificado
router.get("/verify/:code", async (req, res) => {
  try {
    const { code } = req.params;
    
    // Esta rota deve ser pública (sem autenticação)
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.code, code),
      with: {
        student: {
          columns: {
            id: true,
            fullName: true,
            cpf: true,
          }
        },
        disciplines: {
          with: {
            discipline: true,
          },
        },
        template: true,
        signer: true,
      },
    });
    
    if (!certificate) {
      return res.status(404).json({ 
        valid: false,
        message: "Certificado não encontrado" 
      });
    }
    
    // Verificar se o certificado está emitido
    if (certificate.status !== "issued") {
      return res.json({
        valid: false,
        status: certificate.status,
        message: certificate.status === "revoked" 
          ? "Este certificado foi revogado" 
          : "Este certificado ainda não foi emitido"
      });
    }
    
    // Retornar informações verificáveis do certificado
    return res.json({
      valid: true,
      code: certificate.code,
      title: certificate.title,
      studentName: certificate.student.fullName,
      courseName: certificate.courseName,
      issueDate: certificate.issuedAt,
      disciplines: certificate.disciplines.map(d => ({
        name: d.discipline.name,
        professorName: d.professorName,
        workload: d.workload,
      })),
      totalWorkload: certificate.totalWorkload,
    });
  } catch (error) {
    console.error("Erro ao verificar certificado:", error);
    return res.status(500).json({
      valid: false,
      message: "Erro ao verificar certificado",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// ============== Rotas para geração e download de certificados em PDF ==============

// Gerar e visualizar certificado
router.get("/:id/pdf", async (req, res) => {
  try {
    const { id } = req.params;
    const certificateId = parseInt(id);
    
    // Verificar se o certificado existe
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.id, certificateId),
    });
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificado não encontrado" });
    }
    
    // Verificar se o certificado foi emitido
    if (certificate.status !== "issued") {
      return res.status(400).json({ 
        message: "Só é possível gerar PDF para certificados já emitidos" 
      });
    }
    
    // Gerar o PDF do certificado
    const pdfBuffer = await generateCertificatePdf(certificateId);
    
    // Configurar headers para visualização no navegador
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="certificado_${certificate.code}.pdf"`);
    
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Erro ao gerar PDF do certificado:", error);
    return res.status(500).json({
      message: "Erro ao gerar PDF do certificado",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Gerar e fazer download do certificado
router.get("/:id/pdf/download", async (req, res) => {
  try {
    const { id } = req.params;
    const certificateId = parseInt(id);
    
    // Verificar se o certificado existe
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.id, certificateId),
    });
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificado não encontrado" });
    }
    
    // Verificar se o certificado foi emitido
    if (certificate.status !== "issued") {
      return res.status(400).json({ 
        message: "Só é possível baixar PDF para certificados já emitidos" 
      });
    }
    
    // Gerar o PDF do certificado
    const pdfBuffer = await generateCertificatePdf(certificateId);
    
    // Configurar headers para download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificado_${certificate.code}.pdf"`);
    
    // Registrar no histórico
    await db.insert(certificateHistory).values({
      certificateId: certificateId,
      action: "downloaded",
      description: "PDF do certificado baixado",
      performedById: req.user?.id || null,
    });
    
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Erro ao gerar PDF do certificado para download:", error);
    return res.status(500).json({
      message: "Erro ao gerar PDF do certificado para download",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Gerar e visualizar histórico escolar
router.get("/:id/transcript", async (req, res) => {
  try {
    const { id } = req.params;
    const certificateId = parseInt(id);
    
    // Verificar se o certificado existe
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.id, certificateId),
    });
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificado não encontrado" });
    }
    
    // Verificar se o certificado foi emitido
    if (certificate.status !== "issued") {
      return res.status(400).json({ 
        message: "Só é possível gerar histórico escolar para certificados já emitidos" 
      });
    }
    
    // Gerar o PDF do histórico escolar
    const pdfBuffer = await generateTranscriptPdf(certificateId);
    
    // Configurar headers para visualização no navegador
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="historico_${certificate.code}.pdf"`);
    
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Erro ao gerar PDF do histórico escolar:", error);
    return res.status(500).json({
      message: "Erro ao gerar PDF do histórico escolar",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Gerar e fazer download do histórico escolar
router.get("/:id/transcript/download", async (req, res) => {
  try {
    const { id } = req.params;
    const certificateId = parseInt(id);
    
    // Verificar se o certificado existe
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.id, certificateId),
    });
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificado não encontrado" });
    }
    
    // Verificar se o certificado foi emitido
    if (certificate.status !== "issued") {
      return res.status(400).json({ 
        message: "Só é possível baixar histórico escolar para certificados já emitidos" 
      });
    }
    
    // Gerar o PDF do histórico escolar
    const pdfBuffer = await generateTranscriptPdf(certificateId);
    
    // Configurar headers para download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="historico_${certificate.code}.pdf"`);
    
    // Registrar no histórico
    await db.insert(certificateHistory).values({
      certificateId: certificateId,
      action: "transcript_downloaded",
      description: "PDF do histórico escolar baixado",
      performedById: req.user?.id || null,
    });
    
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Erro ao gerar PDF do histórico escolar para download:", error);
    return res.status(500).json({
      message: "Erro ao gerar PDF do histórico escolar para download",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Função auxiliar para salvar os PDFs temporariamente
const saveCertificatePdf = async (certificateId: number, pdfBuffer: Buffer, type: 'certificate' | 'transcript'): Promise<string> => {
  const fs = require('fs');
  const path = require('path');
  
  // Criar diretório uploads se não existir
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Criar diretório específico para certificados
  const certificatesDir = path.join(uploadsDir, 'certificates');
  if (!fs.existsSync(certificatesDir)) {
    fs.mkdirSync(certificatesDir, { recursive: true });
  }
  
  // Nome do arquivo com data e hora para evitar colisões
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${type}_${certificateId}_${timestamp}.pdf`;
  const filePath = path.join(certificatesDir, fileName);
  
  // Salvar o PDF no sistema de arquivos
  fs.writeFileSync(filePath, pdfBuffer);
  
  return filePath;
};

// Enviar certificado por e-mail
router.post("/:id/email", async (req, res) => {
  try {
    const { id } = req.params;
    const certificateId = parseInt(id);
    const userId = req.user?.id;
    
    // Verificar se o certificado existe
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.id, certificateId),
      with: {
        student: true,
      },
    });
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificado não encontrado" });
    }
    
    // Verificar se o certificado foi emitido
    if (certificate.status !== "issued") {
      return res.status(400).json({ 
        message: "Só é possível enviar por e-mail certificados já emitidos" 
      });
    }
    
    // Verificar se o estudante tem e-mail cadastrado
    if (!certificate.student?.email) {
      return res.status(400).json({ 
        message: "O estudante não possui e-mail cadastrado no sistema" 
      });
    }
    
    // Gerar os PDFs
    const certificatePdf = await generateCertificatePdf(certificateId);
    const transcriptPdf = await generateTranscriptPdf(certificateId);
    
    // Aqui você usaria seu serviço de e-mail para enviar os documentos
    // Por exemplo, com a biblioteca nodemailer ou um serviço como SendGrid/Mailgun
    
    // Exemplo de como seria a implementação usando nodemailer
    /*
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: certificate.student.email,
      subject: `Seu certificado do curso ${certificate.courseName}`,
      html: `
        <h1>Olá ${certificate.student.fullName},</h1>
        <p>Parabéns pela conclusão do curso <strong>${certificate.courseName}</strong>!</p>
        <p>Em anexo, você encontrará seu certificado e histórico escolar.</p>
        <p>Atenciosamente,<br>Equipe Edunexa</p>
      `,
      attachments: [
        {
          filename: `certificado_${certificate.code}.pdf`,
          content: certificatePdf,
          contentType: 'application/pdf',
        },
        {
          filename: `historico_${certificate.code}.pdf`,
          content: transcriptPdf,
          contentType: 'application/pdf',
        },
      ],
    });
    */
    
    // Como não temos implementação real de e-mail ainda, simulamos o envio com sucesso
    // e salvamos temporariamente os arquivos
    const certificatePath = await saveCertificatePdf(certificateId, certificatePdf, 'certificate');
    const transcriptPath = await saveCertificatePdf(certificateId, transcriptPdf, 'transcript');
    
    // Registrar no histórico
    await db.insert(certificateHistory).values({
      certificateId: certificateId,
      action: "email_sent",
      description: `Certificado enviado por e-mail para ${certificate.student.email}`,
      performedById: userId || null,
    });
    
    return res.json({ 
      success: true, 
      message: `Certificado enviado com sucesso para ${certificate.student.email}`,
      certificatePath,
      transcriptPath,
    });
  } catch (error) {
    console.error("Erro ao enviar certificado por e-mail:", error);
    return res.status(500).json({
      message: "Erro ao enviar certificado por e-mail",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;