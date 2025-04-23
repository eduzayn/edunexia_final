import express from "express";
import { db } from "../db";
import { users, institutions, courses } from "@shared/schema";
import { certificates } from "@shared/certificate-schema";
import { 
  certificationRequests,
  certificationStudents,
  certificationDocuments,
  certificationActivityLogs,
  insertCertificationRequestSchema,
  insertCertificationStudentSchema,
  insertCertificationDocumentSchema,
  insertCertificationActivityLogSchema
} from "@shared/certification-request-schema";
import { eq, and, desc, inArray, like, isNull, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { generateUniqueCode } from "../utils";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), "uploads", "certification-documents");
    
    // Criar diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (req, file, cb) => {
    // Permitir apenas PDF, imagens e documentos Office
    const allowedFileTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];
    
    if (allowedFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo não permitido. Apenas PDF, imagens e documentos Office são aceitos."));
    }
  }
});

// Middleware de autenticação para todas as rotas
router.use(requireAuth);

// ============== Rotas para solicitações de certificação ==============

// Listar solicitações de certificação (com filtros e paginação)
router.get("/", async (req, res) => {
  try {
    const status = req.query.status?.toString();
    const partnerId = req.query.partnerId ? parseInt(req.query.partnerId.toString()) : undefined;
    const institutionId = req.query.institutionId ? parseInt(req.query.institutionId.toString()) : undefined;
    const page = parseInt(req.query.page?.toString() || "1");
    const pageSize = parseInt(req.query.pageSize?.toString() || "20");
    const offset = (page - 1) * pageSize;
    
    let query = db.select({
      certificationRequests: certificationRequests,
      partnerName: users.fullName,
      institutionName: institutions.name,
      totalStudents: certificationRequests.totalStudents,
      totalAmount: certificationRequests.totalAmount,
      status: certificationRequests.status,
      submittedAt: certificationRequests.submittedAt
    })
    .from(certificationRequests)
    .leftJoin(users, eq(certificationRequests.partnerId, users.id))
    .leftJoin(institutions, eq(certificationRequests.institutionId, institutions.id));
    
    // Aplicar filtros
    const conditions = [];
    
    if (status) {
      conditions.push(eq(certificationRequests.status, status));
    }
    
    if (partnerId) {
      conditions.push(eq(certificationRequests.partnerId, partnerId));
    }
    
    if (institutionId) {
      conditions.push(eq(certificationRequests.institutionId, institutionId));
    }
    
    // Filtro por tipo de usuário
    // Parceiros só veem suas próprias solicitações
    if (req.user?.portalType === "partner") {
      conditions.push(eq(certificationRequests.partnerId, req.user.id));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Executar a consulta com paginação
    const totalQuery = db.select({ count: sql<number>`count(*)` })
      .from(certificationRequests);
    
    if (conditions.length > 0) {
      totalQuery.where(and(...conditions));
    }
    
    const [{ count }] = await totalQuery;
    
    const results = await query
      .orderBy(desc(certificationRequests.submittedAt))
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
    console.error("Erro ao buscar solicitações de certificação:", error);
    return res.status(500).json({
      message: "Erro ao buscar solicitações de certificação",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Obter uma solicitação de certificação por ID (com todos os detalhes)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const requestId = parseInt(id);
    
    // Verificar permissão
    if (req.user?.portalType === "partner") {
      const ownRequest = await db.query.certificationRequests.findFirst({
        where: and(
          eq(certificationRequests.id, requestId),
          eq(certificationRequests.partnerId, req.user.id)
        )
      });
      
      if (!ownRequest) {
        return res.status(403).json({ message: "Você não tem permissão para acessar esta solicitação" });
      }
    }
    
    // Buscar a solicitação com todos os dados relacionados
    const certRequest = await db.query.certificationRequests.findFirst({
      where: eq(certificationRequests.id, requestId),
      with: {
        partner: true,
        institution: true,
        reviewedBy: true,
        students: {
          with: {
            course: true,
            certificate: true,
            documents: true
          }
        },
        documents: {
          with: {
            verifiedBy: true
          }
        },
        activityLogs: {
          with: {
            performedBy: true
          },
          orderBy: [desc(certificationActivityLogs.performedAt)]
        }
      }
    });
    
    if (!certRequest) {
      return res.status(404).json({ message: "Solicitação de certificação não encontrada" });
    }
    
    return res.json(certRequest);
  } catch (error) {
    console.error("Erro ao buscar solicitação de certificação:", error);
    return res.status(500).json({
      message: "Erro ao buscar solicitação de certificação",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Criar nova solicitação de certificação
router.post("/", validateBody(insertCertificationRequestSchema), async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user?.id;
    
    // Verificar se o usuário é parceiro
    if (req.user?.portalType !== "partner" && req.user?.portalType !== "admin") {
      return res.status(403).json({ 
        message: "Apenas parceiros podem criar solicitações de certificação" 
      });
    }
    
    // Verificar se a instituição existe
    const institution = await db.query.institutions.findFirst({
      where: eq(institutions.id, data.institutionId)
    });
    
    if (!institution) {
      return res.status(404).json({ message: "Instituição não encontrada" });
    }
    
    // Gerar código único para a solicitação
    const code = await generateUniqueCode("CERT", async (code) => {
      const existingRequest = await db.query.certificationRequests.findFirst({
        where: eq(certificationRequests.code, code)
      });
      return !existingRequest;
    });
    
    // Criar a solicitação
    const [newRequest] = await db.insert(certificationRequests).values({
      ...data,
      code,
      partnerId: userId || data.partnerId,
      status: "pending",
      submittedAt: new Date()
    }).returning();
    
    // Registrar atividade
    await db.insert(certificationActivityLogs).values({
      requestId: newRequest.id,
      action: "created",
      description: "Solicitação de certificação criada",
      performedById: userId,
      performedAt: new Date()
    });
    
    return res.status(201).json(newRequest);
  } catch (error) {
    console.error("Erro ao criar solicitação de certificação:", error);
    return res.status(500).json({
      message: "Erro ao criar solicitação de certificação",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Atualizar solicitação de certificação
router.put("/:id", validateBody(insertCertificationRequestSchema.partial()), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user?.id;
    
    const requestId = parseInt(id);
    
    // Buscar a solicitação
    const certRequest = await db.query.certificationRequests.findFirst({
      where: eq(certificationRequests.id, requestId)
    });
    
    if (!certRequest) {
      return res.status(404).json({ message: "Solicitação de certificação não encontrada" });
    }
    
    // Verificar permissão (apenas parceiro dono ou admin)
    if (req.user?.portalType === "partner" && certRequest.partnerId !== userId) {
      return res.status(403).json({ 
        message: "Você não tem permissão para atualizar esta solicitação" 
      });
    }
    
    // Não permitir atualização de solicitações que já estão em estados avançados
    const lockedStatuses = ["approved", "payment_confirmed", "processing", "completed"];
    if (lockedStatuses.includes(certRequest.status)) {
      return res.status(400).json({
        message: `Não é possível atualizar uma solicitação com status "${certRequest.status}"`
      });
    }
    
    // Atualizar a solicitação
    const [updatedRequest] = await db.update(certificationRequests)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(certificationRequests.id, requestId))
      .returning();
    
    // Registrar atividade
    await db.insert(certificationActivityLogs).values({
      requestId: requestId,
      action: "updated",
      description: "Solicitação de certificação atualizada",
      performedById: userId,
      performedAt: new Date()
    });
    
    return res.json(updatedRequest);
  } catch (error) {
    console.error("Erro ao atualizar solicitação de certificação:", error);
    return res.status(500).json({
      message: "Erro ao atualizar solicitação de certificação",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Alterar status da solicitação
router.post("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const userId = req.user?.id;
    
    if (!status) {
      return res.status(400).json({ message: "Status é obrigatório" });
    }
    
    const requestId = parseInt(id);
    
    // Buscar a solicitação
    const certRequest = await db.query.certificationRequests.findFirst({
      where: eq(certificationRequests.id, requestId)
    });
    
    if (!certRequest) {
      return res.status(404).json({ message: "Solicitação de certificação não encontrada" });
    }
    
    // Verificar transições de status permitidas
    const allowedTransitions: Record<string, string[]> = {
      "pending": ["under_review", "cancelled"],
      "under_review": ["approved", "rejected", "cancelled"],
      "rejected": ["under_review", "cancelled"],
      "approved": ["payment_pending", "rejected", "cancelled"],
      "payment_pending": ["payment_confirmed", "cancelled"],
      "payment_confirmed": ["processing", "cancelled"],
      "processing": ["completed", "cancelled"],
      "completed": [],
      "cancelled": []
    };
    
    if (!allowedTransitions[certRequest.status].includes(status)) {
      return res.status(400).json({
        message: `Não é possível alterar o status de "${certRequest.status}" para "${status}"`
      });
    }
    
    // Verificar permissões específicas para cada tipo de transição
    if ((status === "under_review" || status === "approved" || status === "rejected") 
        && req.user?.portalType !== "admin") {
      return res.status(403).json({
        message: "Apenas administradores podem revisar ou aprovar solicitações"
      });
    }
    
    // Campos adicionais a serem atualizados
    const additionalFields: any = {};
    
    if (status === "under_review") {
      additionalFields.reviewedById = userId;
      additionalFields.reviewedAt = new Date();
    }
    
    if (status === "rejected" && !reason) {
      return res.status(400).json({
        message: "É necessário informar o motivo da rejeição"
      });
    }
    
    if (status === "rejected") {
      additionalFields.rejectionReason = reason;
    }
    
    // Atualizar status
    const [updatedRequest] = await db.update(certificationRequests)
      .set({
        status,
        ...additionalFields,
        updatedAt: new Date()
      })
      .where(eq(certificationRequests.id, requestId))
      .returning();
    
    // Registrar atividade
    const description = status === "rejected" 
      ? `Solicitação rejeitada. Motivo: ${reason}`
      : `Status alterado para ${status}`;
    
    await db.insert(certificationActivityLogs).values({
      requestId: requestId,
      action: `status_${status}`,
      description: description,
      performedById: userId,
      performedAt: new Date()
    });
    
    return res.json(updatedRequest);
  } catch (error) {
    console.error("Erro ao alterar status da solicitação:", error);
    return res.status(500).json({
      message: "Erro ao alterar status da solicitação",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// ============== Rotas para estudantes da solicitação ==============

// Listar estudantes de uma solicitação
router.get("/:requestId/students", async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // Verificar se a solicitação existe
    const certRequest = await db.query.certificationRequests.findFirst({
      where: eq(certificationRequests.id, parseInt(requestId))
    });
    
    if (!certRequest) {
      return res.status(404).json({ message: "Solicitação de certificação não encontrada" });
    }
    
    // Verificar permissão para parceiros
    if (req.user?.portalType === "partner" && certRequest.partnerId !== req.user.id) {
      return res.status(403).json({
        message: "Você não tem permissão para acessar os estudantes desta solicitação"
      });
    }
    
    // Buscar estudantes
    const students = await db.query.certificationStudents.findMany({
      where: eq(certificationStudents.requestId, parseInt(requestId)),
      with: {
        course: true,
        certificate: true,
        documents: true
      }
    });
    
    return res.json(students);
  } catch (error) {
    console.error("Erro ao buscar estudantes da solicitação:", error);
    return res.status(500).json({
      message: "Erro ao buscar estudantes da solicitação",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Adicionar estudante à solicitação
router.post("/:requestId/students", validateBody(insertCertificationStudentSchema), async (req, res) => {
  try {
    const { requestId } = req.params;
    const data = req.body;
    const userId = req.user?.id;
    
    // Verificar se a solicitação existe
    const certRequest = await db.query.certificationRequests.findFirst({
      where: eq(certificationRequests.id, parseInt(requestId))
    });
    
    if (!certRequest) {
      return res.status(404).json({ message: "Solicitação de certificação não encontrada" });
    }
    
    // Verificar permissão para parceiros
    if (req.user?.portalType === "partner" && certRequest.partnerId !== req.user.id) {
      return res.status(403).json({
        message: "Você não tem permissão para adicionar estudantes a esta solicitação"
      });
    }
    
    // Verificar se a solicitação está em um estado que permite adicionar estudantes
    const allowedStatuses = ["pending", "under_review", "rejected"];
    if (!allowedStatuses.includes(certRequest.status)) {
      return res.status(400).json({
        message: `Não é possível adicionar estudantes a uma solicitação com status "${certRequest.status}"`
      });
    }
    
    // Verificar se o curso existe
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, data.courseId)
    });
    
    if (!course) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }
    
    // Verificar se o CPF já existe na mesma solicitação
    const existingStudent = await db.query.certificationStudents.findFirst({
      where: and(
        eq(certificationStudents.requestId, parseInt(requestId)),
        eq(certificationStudents.cpf, data.cpf)
      )
    });
    
    if (existingStudent) {
      return res.status(400).json({
        message: "Já existe um estudante com este CPF nesta solicitação"
      });
    }
    
    // Adicionar estudante
    const [newStudent] = await db.insert(certificationStudents).values({
      ...data,
      requestId: parseInt(requestId),
      courseName: course.name, // Armazenando o nome do curso para redundância
      status: "pending"
    }).returning();
    
    // Registrar atividade
    await db.insert(certificationActivityLogs).values({
      requestId: parseInt(requestId),
      action: "student_added",
      description: `Estudante adicionado: ${data.name} (${data.cpf})`,
      performedById: userId,
      performedAt: new Date()
    });
    
    // Atualizar contador de estudantes na solicitação
    const studentCount = await db.select({ count: sql<number>`count(*)` })
      .from(certificationStudents)
      .where(eq(certificationStudents.requestId, parseInt(requestId)));
    
    await db.update(certificationRequests)
      .set({
        totalStudents: Number(studentCount[0].count),
        totalAmount: certRequest.unitPrice * Number(studentCount[0].count),
        updatedAt: new Date()
      })
      .where(eq(certificationRequests.id, parseInt(requestId)));
    
    return res.status(201).json(newStudent);
  } catch (error) {
    console.error("Erro ao adicionar estudante:", error);
    return res.status(500).json({
      message: "Erro ao adicionar estudante",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Atualizar estudante
router.put("/:requestId/students/:studentId", validateBody(insertCertificationStudentSchema.partial()), async (req, res) => {
  try {
    const { requestId, studentId } = req.params;
    const data = req.body;
    const userId = req.user?.id;
    
    // Verificar se a solicitação existe
    const certRequest = await db.query.certificationRequests.findFirst({
      where: eq(certificationRequests.id, parseInt(requestId))
    });
    
    if (!certRequest) {
      return res.status(404).json({ message: "Solicitação de certificação não encontrada" });
    }
    
    // Verificar permissão para parceiros
    if (req.user?.portalType === "partner" && certRequest.partnerId !== req.user.id) {
      return res.status(403).json({
        message: "Você não tem permissão para atualizar estudantes desta solicitação"
      });
    }
    
    // Verificar se a solicitação está em um estado que permite atualizar estudantes
    const allowedStatuses = ["pending", "under_review", "rejected"];
    if (!allowedStatuses.includes(certRequest.status)) {
      return res.status(400).json({
        message: `Não é possível atualizar estudantes de uma solicitação com status "${certRequest.status}"`
      });
    }
    
    // Verificar se o estudante existe
    const student = await db.query.certificationStudents.findFirst({
      where: and(
        eq(certificationStudents.id, parseInt(studentId)),
        eq(certificationStudents.requestId, parseInt(requestId))
      )
    });
    
    if (!student) {
      return res.status(404).json({ message: "Estudante não encontrado na solicitação" });
    }
    
    // Se estiver atualizando o curso, verificar se o curso existe
    if (data.courseId) {
      const course = await db.query.courses.findFirst({
        where: eq(courses.id, data.courseId)
      });
      
      if (!course) {
        return res.status(404).json({ message: "Curso não encontrado" });
      }
      
      // Atualizar também o nome do curso
      data.courseName = course.name;
    }
    
    // Atualizar estudante
    const [updatedStudent] = await db.update(certificationStudents)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(certificationStudents.id, parseInt(studentId)),
        eq(certificationStudents.requestId, parseInt(requestId))
      ))
      .returning();
    
    // Registrar atividade
    await db.insert(certificationActivityLogs).values({
      requestId: parseInt(requestId),
      action: "student_updated",
      description: `Estudante atualizado: ${updatedStudent.name} (${updatedStudent.cpf})`,
      performedById: userId,
      performedAt: new Date()
    });
    
    return res.json(updatedStudent);
  } catch (error) {
    console.error("Erro ao atualizar estudante:", error);
    return res.status(500).json({
      message: "Erro ao atualizar estudante",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Remover estudante
router.delete("/:requestId/students/:studentId", async (req, res) => {
  try {
    const { requestId, studentId } = req.params;
    const userId = req.user?.id;
    
    // Verificar se a solicitação existe
    const certRequest = await db.query.certificationRequests.findFirst({
      where: eq(certificationRequests.id, parseInt(requestId))
    });
    
    if (!certRequest) {
      return res.status(404).json({ message: "Solicitação de certificação não encontrada" });
    }
    
    // Verificar permissão para parceiros
    if (req.user?.portalType === "partner" && certRequest.partnerId !== req.user.id) {
      return res.status(403).json({
        message: "Você não tem permissão para remover estudantes desta solicitação"
      });
    }
    
    // Verificar se a solicitação está em um estado que permite remover estudantes
    const allowedStatuses = ["pending", "under_review", "rejected"];
    if (!allowedStatuses.includes(certRequest.status)) {
      return res.status(400).json({
        message: `Não é possível remover estudantes de uma solicitação com status "${certRequest.status}"`
      });
    }
    
    // Verificar se o estudante existe
    const student = await db.query.certificationStudents.findFirst({
      where: and(
        eq(certificationStudents.id, parseInt(studentId)),
        eq(certificationStudents.requestId, parseInt(requestId))
      )
    });
    
    if (!student) {
      return res.status(404).json({ message: "Estudante não encontrado na solicitação" });
    }
    
    // Remover documentos do estudante
    await db.delete(certificationDocuments)
      .where(eq(certificationDocuments.studentId, parseInt(studentId)));
    
    // Remover estudante
    await db.delete(certificationStudents)
      .where(and(
        eq(certificationStudents.id, parseInt(studentId)),
        eq(certificationStudents.requestId, parseInt(requestId))
      ));
    
    // Registrar atividade
    await db.insert(certificationActivityLogs).values({
      requestId: parseInt(requestId),
      action: "student_removed",
      description: `Estudante removido: ${student.name} (${student.cpf})`,
      performedById: userId,
      performedAt: new Date()
    });
    
    // Atualizar contador de estudantes na solicitação
    const studentCount = await db.select({ count: sql<number>`count(*)` })
      .from(certificationStudents)
      .where(eq(certificationStudents.requestId, parseInt(requestId)));
    
    await db.update(certificationRequests)
      .set({
        totalStudents: Number(studentCount[0].count),
        totalAmount: certRequest.unitPrice * Number(studentCount[0].count),
        updatedAt: new Date()
      })
      .where(eq(certificationRequests.id, parseInt(requestId)));
    
    return res.json({ message: "Estudante removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover estudante:", error);
    return res.status(500).json({
      message: "Erro ao remover estudante",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// ============== Rotas para documentos da solicitação ==============

// Listar documentos de uma solicitação
router.get("/:requestId/documents", async (req, res) => {
  try {
    const { requestId } = req.params;
    const studentId = req.query.studentId ? parseInt(req.query.studentId.toString()) : undefined;
    
    // Verificar se a solicitação existe
    const certRequest = await db.query.certificationRequests.findFirst({
      where: eq(certificationRequests.id, parseInt(requestId))
    });
    
    if (!certRequest) {
      return res.status(404).json({ message: "Solicitação de certificação não encontrada" });
    }
    
    // Verificar permissão para parceiros
    if (req.user?.portalType === "partner" && certRequest.partnerId !== req.user.id) {
      return res.status(403).json({
        message: "Você não tem permissão para acessar os documentos desta solicitação"
      });
    }
    
    // Buscar documentos
    let conditions = [eq(certificationDocuments.requestId, parseInt(requestId))];
    
    if (studentId) {
      conditions.push(eq(certificationDocuments.studentId, studentId));
    }
    
    const documents = await db.query.certificationDocuments.findMany({
      where: and(...conditions),
      with: {
        verifiedBy: true,
        student: true
      }
    });
    
    return res.json(documents);
  } catch (error) {
    console.error("Erro ao buscar documentos da solicitação:", error);
    return res.status(500).json({
      message: "Erro ao buscar documentos da solicitação",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Upload de documento para a solicitação ou para um estudante específico
router.post("/:requestId/documents/upload", upload.single("document"), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { type, studentId } = req.body;
    const userId = req.user?.id;
    
    if (!req.file) {
      return res.status(400).json({ message: "Nenhum arquivo enviado" });
    }
    
    if (!type) {
      return res.status(400).json({ message: "Tipo de documento é obrigatório" });
    }
    
    // Verificar se a solicitação existe
    const certRequest = await db.query.certificationRequests.findFirst({
      where: eq(certificationRequests.id, parseInt(requestId))
    });
    
    if (!certRequest) {
      return res.status(404).json({ message: "Solicitação de certificação não encontrada" });
    }
    
    // Verificar permissão para parceiros
    if (req.user?.portalType === "partner" && certRequest.partnerId !== req.user.id) {
      return res.status(403).json({
        message: "Você não tem permissão para adicionar documentos a esta solicitação"
      });
    }
    
    // Verificar se a solicitação está em um estado que permite adicionar documentos
    const allowedStatuses = ["pending", "under_review", "rejected"];
    if (!allowedStatuses.includes(certRequest.status)) {
      return res.status(400).json({
        message: `Não é possível adicionar documentos a uma solicitação com status "${certRequest.status}"`
      });
    }
    
    // Se específico para um estudante, verificar se o estudante existe
    if (studentId) {
      const student = await db.query.certificationStudents.findFirst({
        where: and(
          eq(certificationStudents.id, parseInt(studentId)),
          eq(certificationStudents.requestId, parseInt(requestId))
        )
      });
      
      if (!student) {
        return res.status(404).json({ message: "Estudante não encontrado na solicitação" });
      }
    }
    
    // Salvar informações do documento no banco
    const [newDocument] = await db.insert(certificationDocuments).values({
      requestId: parseInt(requestId),
      studentId: studentId ? parseInt(studentId) : null,
      type,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      verificationStatus: "pending"
    }).returning();
    
    // Registrar atividade
    const description = studentId 
      ? `Documento adicionado para estudante ID ${studentId}: ${type}`
      : `Documento adicionado para a solicitação: ${type}`;
    
    await db.insert(certificationActivityLogs).values({
      requestId: parseInt(requestId),
      action: "document_uploaded",
      description,
      performedById: userId,
      performedAt: new Date()
    });
    
    return res.status(201).json(newDocument);
  } catch (error) {
    console.error("Erro ao fazer upload de documento:", error);
    return res.status(500).json({
      message: "Erro ao fazer upload de documento",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Verificar documento (aprovar/rejeitar)
router.post("/:requestId/documents/:documentId/verify", async (req, res) => {
  try {
    const { requestId, documentId } = req.params;
    const { status, reason } = req.body;
    const userId = req.user?.id;
    
    // Apenas admins podem verificar documentos
    if (req.user?.portalType !== "admin") {
      return res.status(403).json({
        message: "Apenas administradores podem verificar documentos"
      });
    }
    
    if (!status || !["verified", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status de verificação inválido. Use 'verified' ou 'rejected'"
      });
    }
    
    if (status === "rejected" && !reason) {
      return res.status(400).json({
        message: "É necessário informar o motivo da rejeição"
      });
    }
    
    // Verificar se o documento existe
    const document = await db.query.certificationDocuments.findFirst({
      where: and(
        eq(certificationDocuments.id, parseInt(documentId)),
        eq(certificationDocuments.requestId, parseInt(requestId))
      )
    });
    
    if (!document) {
      return res.status(404).json({ message: "Documento não encontrado" });
    }
    
    // Atualizar status do documento
    const [updatedDocument] = await db.update(certificationDocuments)
      .set({
        verificationStatus: status,
        verifiedById: userId,
        verifiedAt: new Date(),
        rejectionReason: status === "rejected" ? reason : null,
        updatedAt: new Date()
      })
      .where(and(
        eq(certificationDocuments.id, parseInt(documentId)),
        eq(certificationDocuments.requestId, parseInt(requestId))
      ))
      .returning();
    
    // Registrar atividade
    const description = status === "verified" 
      ? `Documento verificado e aprovado: ${document.type}`
      : `Documento rejeitado: ${document.type}. Motivo: ${reason}`;
    
    await db.insert(certificationActivityLogs).values({
      requestId: parseInt(requestId),
      action: `document_${status}`,
      description,
      performedById: userId,
      performedAt: new Date()
    });
    
    return res.json(updatedDocument);
  } catch (error) {
    console.error("Erro ao verificar documento:", error);
    return res.status(500).json({
      message: "Erro ao verificar documento",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Excluir documento
router.delete("/:requestId/documents/:documentId", async (req, res) => {
  try {
    const { requestId, documentId } = req.params;
    const userId = req.user?.id;
    
    // Verificar se o documento existe
    const document = await db.query.certificationDocuments.findFirst({
      where: and(
        eq(certificationDocuments.id, parseInt(documentId)),
        eq(certificationDocuments.requestId, parseInt(requestId))
      )
    });
    
    if (!document) {
      return res.status(404).json({ message: "Documento não encontrado" });
    }
    
    // Verificar permissão
    const certRequest = await db.query.certificationRequests.findFirst({
      where: eq(certificationRequests.id, parseInt(requestId))
    });
    
    if (req.user?.portalType === "partner" && certRequest?.partnerId !== req.user.id) {
      return res.status(403).json({
        message: "Você não tem permissão para excluir documentos desta solicitação"
      });
    }
    
    // Verificar se a solicitação está em um estado que permite excluir documentos
    const allowedStatuses = ["pending", "under_review", "rejected"];
    if (!allowedStatuses.includes(certRequest?.status || "")) {
      return res.status(400).json({
        message: `Não é possível excluir documentos de uma solicitação com status "${certRequest?.status}"`
      });
    }
    
    // Remover arquivo físico
    try {
      fs.unlinkSync(document.filePath);
    } catch (err) {
      console.warn("Não foi possível excluir o arquivo físico:", err);
    }
    
    // Remover registro do banco
    await db.delete(certificationDocuments)
      .where(and(
        eq(certificationDocuments.id, parseInt(documentId)),
        eq(certificationDocuments.requestId, parseInt(requestId))
      ));
    
    // Registrar atividade
    await db.insert(certificationActivityLogs).values({
      requestId: parseInt(requestId),
      action: "document_deleted",
      description: `Documento excluído: ${document.type} (${document.fileName})`,
      performedById: userId,
      performedAt: new Date()
    });
    
    return res.json({ message: "Documento excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir documento:", error);
    return res.status(500).json({
      message: "Erro ao excluir documento",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Processar certificados para uma solicitação aprovada
router.post("/:id/process-certificates", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    // Apenas administradores podem processar certificados
    if (req.user?.portalType !== "admin") {
      return res.status(403).json({
        message: "Apenas administradores podem processar certificados"
      });
    }
    
    const requestId = parseInt(id);
    
    // Verificar se a solicitação existe
    const certRequest = await db.query.certificationRequests.findFirst({
      where: eq(certificationRequests.id, requestId),
      with: {
        institution: true,
        students: {
          with: {
            course: true
          }
        }
      }
    });
    
    if (!certRequest) {
      return res.status(404).json({ message: "Solicitação de certificação não encontrada" });
    }
    
    // Verificar se a solicitação está no estado correto
    if (certRequest.status !== "payment_confirmed") {
      return res.status(400).json({
        message: `Não é possível processar certificados de uma solicitação com status "${certRequest.status}". A solicitação deve estar com status "payment_confirmed"`
      });
    }
    
    // Atualizar status da solicitação para "processing"
    await db.update(certificationRequests)
      .set({
        status: "processing",
        updatedAt: new Date()
      })
      .where(eq(certificationRequests.id, requestId));
    
    // Registrar atividade de início do processamento
    await db.insert(certificationActivityLogs).values({
      requestId: requestId,
      action: "certificates_processing_started",
      description: "Início do processamento de certificados",
      performedById: userId,
      performedAt: new Date()
    });
    
    // Aqui seria feito o processamento dos certificados de forma assíncrona
    // Por enquanto, vamos apenas retornar sucesso na iniciação do processo
    
    return res.json({
      message: "Processamento de certificados iniciado",
      requestId: requestId,
      totalStudents: certRequest.students.length
    });
  } catch (error) {
    console.error("Erro ao iniciar processamento de certificados:", error);
    return res.status(500).json({
      message: "Erro ao iniciar processamento de certificados",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;