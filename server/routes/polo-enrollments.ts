import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { requirePolo } from "../middleware/auth";
import { eq, and, like, desc, asc, or } from "drizzle-orm";
import { polos, users, courses, enrollments } from "@shared/schema";
import { randomBytes } from "crypto";
import { format } from "date-fns";

const router = Router();

// Middleware para garantir que apenas usuários do tipo polo possam acessar estas rotas
router.use(requirePolo);

// Rota para listar matrículas vinculadas ao polo
router.get("/enrollments", async (req, res) => {
  try {
    const poloUser = req.user;
    const { search, status, course, date } = req.query;

    // Obter o polo atual
    if (!poloUser || !poloUser.id) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    const userPolo = await storage.getPoloByUserId(poloUser.id);
    if (!userPolo) {
      return res.status(404).json({ message: "Polo não encontrado para este usuário" });
    }

    // Definir datas com base no filtro
    let dateStart: Date | undefined;
    let dateEnd: Date | undefined;

    if (date && date !== "all") {
      const now = new Date();
      dateEnd = now;

      switch(date) {
        case 'last30days':
          dateStart = new Date(now.setDate(now.getDate() - 30));
          break;
        case 'last3months':
          dateStart = new Date(now.setMonth(now.getMonth() - 3));
          break;
        case 'last6months':
          dateStart = new Date(now.setMonth(now.getMonth() - 6));
          break;
        case 'last12months':
          dateStart = new Date(now.setMonth(now.getMonth() - 12));
          break;
      }
    }

    // Obter matrículas vinculadas ao polo
    const enrollmentsList = await storage.getEnrollments(
      search as string, 
      status as string, 
      undefined, 
      course ? parseInt(course as string) : undefined,
      userPolo.id,
      undefined,
      undefined,
      dateStart,
      dateEnd
    );

    // Mapear matrículas para formato desejado na interface
    const enrollmentsWithDetails = await Promise.all(enrollmentsList.map(async enrollment => {
      // Obter dados do aluno
      const student = await storage.getUser(enrollment.studentId);

      // Obter dados do curso
      const course = await storage.getCourse(enrollment.courseId);

      // Verificar status da documentação (simulação)
      let documentsStatus: "pending" | "incomplete" | "complete" = "pending";

      // Na implementação real, seria verificado através de uma tabela de documentos
      if (enrollment.status === "active") {
        documentsStatus = Math.random() > 0.5 ? "complete" : "incomplete";
      }

      return {
        id: enrollment.id,
        code: enrollment.code,
        studentName: student?.fullName || "Nome não disponível",
        studentEmail: student?.email || "Email não disponível",
        courseName: course?.name || "Curso não disponível",
        status: enrollment.status,
        enrollmentDate: enrollment.createdAt,
        amount: enrollment.amount,
        paymentMethod: enrollment.paymentMethod || "boleto",
        paymentStatus: enrollment.paymentStatus || "pending",
        paymentDueDate: enrollment.paymentDueDate || undefined,
        documentsStatus,
        hasContract: enrollment.status === "active"
      };
    }));

    // Retornar dados para a interface
    return res.json({
      enrollments: enrollmentsWithDetails,
      total: enrollmentsList.length,
      filtered: enrollmentsWithDetails.length
    });
  } catch (error) {
    console.error("Erro ao listar matrículas:", error);
    return res.status(500).json({ message: "Erro ao carregar lista de matrículas" });
  }
});

// Rota para criar nova matrícula
router.post("/enrollments", async (req, res) => {
  try {
    const poloUser = req.user;
    const enrollmentData = req.body;

    // Obter o polo atual
    if (!poloUser || !poloUser.id) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    const userPolo = await storage.getPoloByUserId(poloUser.id);
    if (!userPolo) {
      return res.status(404).json({ message: "Polo não encontrado para este usuário" });
    }

    // Validar se o curso existe
    const course = await storage.getCourse(parseInt(enrollmentData.courseId));
    if (!course) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    // Verificar se estamos criando matrícula para aluno existente ou novo aluno
    let student;

    if (enrollmentData.studentId) {
      // Caso de aluno existente
      student = await storage.getUser(parseInt(enrollmentData.studentId));
      if (!student) {
        return res.status(404).json({ message: "Aluno não encontrado" });
      }
    } 
    else if (enrollmentData.newStudent) {
      // Caso de novo aluno
      const newStudentData = enrollmentData.newStudent;

      // Verificar se já existe aluno com este email
      const existingStudent = await storage.getUserByEmail(newStudentData.email);

      if (existingStudent) {
        // Se aluno já existe, usamos o existente
        console.log(`Aluno com email ${newStudentData.email} já existe, ID: ${existingStudent.id}`);
        student = existingStudent;
      } else {
        // Gerar senha aleatória para o novo aluno
        const tempPassword = randomBytes(8).toString('hex');

        // Criar novo usuário com dados completos
        console.log(`Criando novo aluno: ${newStudentData.fullName}, email: ${newStudentData.email}`);
        student = await storage.createUser({
          username: newStudentData.email.split('@')[0],
          password: tempPassword, // Será alterada no primeiro acesso
          email: newStudentData.email,
          fullName: newStudentData.fullName,
          cpf: newStudentData.cpf || null,
          phone: newStudentData.phone || null,
          address: newStudentData.address || null,
          city: newStudentData.city || null,
          state: newStudentData.state || null,
          zipCode: newStudentData.zipCode || null,
          portalType: "student",
          poloId: userPolo.id
        });

        console.log(`Novo aluno criado com ID: ${student.id}`);
      }
    } else {
      return res.status(400).json({ message: "Dados do aluno não fornecidos" });
    }

    // Gerar código único para a matrícula (formato: MAT + ano + número sequencial)
    const year = new Date().getFullYear().toString();
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const enrollmentCode = `MAT${year.substring(2)}${randomSuffix}`;

    // Criar a matrícula
    const amount = course.price || 1000; // Valor padrão se o preço não estiver definido

    // Usar o gateway selecionado pelo usuário ou o padrão
    const paymentGateway = enrollmentData.paymentGateway || "asaas";

    const newEnrollment = await storage.createEnrollment({
      code: enrollmentCode,
      studentId: student.id,
      courseId: parseInt(enrollmentData.courseId),
      poloId: userPolo.id,
      institutionId: userPolo.institutionId,
      amount,
      paymentGateway: paymentGateway,
      paymentMethod: enrollmentData.paymentMethod,
      enrollmentDate: new Date(),
      status: "pending_payment",
      paymentStatus: "pending",
      createdById: poloUser.id,
      observations: enrollmentData.additionalInfo || "",
      contractTemplateId: enrollmentData.contractTemplateId ? parseInt(enrollmentData.contractTemplateId) : null
    });

    return res.status(201).json({
      id: newEnrollment.id,
      code: newEnrollment.code,
      message: "Matrícula criada com sucesso"
    });
  } catch (error) {
    console.error("Erro ao criar matrícula:", error);
    return res.status(500).json({ message: "Erro ao criar matrícula" });
  }
});

// Rota para gerar documentos relacionados à matrícula
router.post("/documents/generate", async (req, res) => {
  try {
    const { enrollmentId, documentType, options } = req.body;
    const poloUser = req.user;

    // Obter dados da matrícula
    const enrollment = await storage.getEnrollment(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ message: "Matrícula não encontrada" });
    }

    // Verificar se a matrícula pertence ao polo do usuário
    if (!poloUser || !poloUser.id) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    const userPolo = await storage.getPoloByUserId(poloUser.id);
    if (!userPolo || enrollment.poloId !== userPolo.id) {
      return res.status(403).json({ message: "Acesso negado a esta matrícula" });
    }

    // Obter dados adicionais necessários para o documento
    const student = await storage.getUser(enrollment.studentId);
    const course = await storage.getCourse(enrollment.courseId);
    const polo = await storage.getPolo(enrollment.poloId);
    const institution = await storage.getInstitution(enrollment.institutionId);

    // Simular geração de documento (na implementação real, geraria um PDF)
    // No mundo real, aqui integraria com uma biblioteca como PDFKit ou similar

    // URL simulada do documento gerado
    const timestamp = format(new Date(), "yyyyMMddHHmmss");
    const documentUrl = `/api/documents/${documentType}_${enrollment.id}_${timestamp}.pdf`;

    // Registrar a geração do documento no histórico
    await storage.createDocumentRecord({
      enrollmentId,
      documentType,
      generatedBy: poloUser.id,
      includeSignature: options.includeSignature,
      includeHeader: options.includeInstitutionHeader,
      additionalInfo: options.additionalInfo,
      documentUrl
    });

    return res.json({
      success: true,
      documentType,
      documentUrl,
      message: "Documento gerado com sucesso"
    });
  } catch (error) {
    console.error("Erro ao gerar documento:", error);
    return res.status(500).json({ message: "Erro ao gerar documento" });
  }
});

// Rota para obter detalhes de uma matrícula específica
router.get("/enrollments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const poloUser = req.user;

    // Obter dados da matrícula
    const enrollment = await storage.getEnrollment(parseInt(id));
    if (!enrollment) {
      return res.status(404).json({ message: "Matrícula não encontrada" });
    }

    // Verificar se a matrícula pertence ao polo do usuário
    if (!poloUser || !poloUser.id) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    const userPolo = await storage.getPoloByUserId(poloUser.id);
    if (!userPolo || enrollment.poloId !== userPolo.id) {
      return res.status(403).json({ message: "Acesso negado a esta matrícula" });
    }

    // Obter dados adicionais
    const student = await storage.getUser(enrollment.studentId);
    const course = await storage.getCourse(enrollment.courseId);
    const polo = await storage.getPolo(enrollment.poloId);

    // Formatar dados para retorno
    const enrollmentDetails = {
      id: enrollment.id,
      code: enrollment.code,
      student: {
        id: student?.id,
        name: student?.fullName,
        email: student?.email,
        phone: student?.phone
      },
      course: {
        id: course?.id,
        name: course?.name,
        duration: course?.durationMonths
      },
      polo: {
        id: polo?.id,
        name: polo?.name
      },
      enrollmentDate: enrollment.createdAt,
      status: enrollment.status,
      amount: enrollment.amount,
      paymentMethod: enrollment.paymentMethod,
      paymentStatus: enrollment.paymentStatus,
      paymentDueDate: enrollment.paymentDueDate,
      observations: enrollment.observations
    };

    return res.json(enrollmentDetails);
  } catch (error) {
    console.error("Erro ao obter detalhes da matrícula:", error);
    return res.status(500).json({ message: "Erro ao carregar detalhes da matrícula" });
  }
});

// Rota para enviar link de pagamento por email
router.post("/enrollments/:id/send-payment-link", async (req, res) => {
  try {
    const { id } = req.params;
    const { studentEmail, paymentUrl } = req.body;
    const poloUser = req.user;

    // Validar parâmetros obrigatórios
    if (!studentEmail || !paymentUrl) {
      return res.status(400).json({ 
        message: "Email do aluno e link de pagamento são obrigatórios" 
      });
    }

    // Obter dados da matrícula
    const enrollment = await storage.getEnrollment(parseInt(id));
    if (!enrollment) {
      return res.status(404).json({ message: "Matrícula não encontrada" });
    }

    // Verificar se a matrícula pertence ao polo do usuário
    if (!poloUser || !poloUser.id) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    const userPolo = await storage.getPoloByUserId(poloUser.id);
    if (!userPolo || enrollment.poloId !== userPolo.id) {
      return res.status(403).json({ message: "Acesso negado a esta matrícula" });
    }

    // Obter dados adicionais
    const student = await storage.getUser(enrollment.studentId);
    const course = await storage.getCourse(enrollment.courseId);
    const polo = await storage.getPolo(enrollment.poloId);

    if (!student) {
      return res.status(404).json({ message: "Aluno não encontrado" });
    }

    if (!course) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    // Simulação de envio de email (na implementação real, integrar com serviço de email)
    // Na implementação real, usaríamos nodemailer ou similar para envio de email

    console.log(`
      [SIMULAÇÃO DE EMAIL]
      Para: ${studentEmail}
      Assunto: Link de Pagamento - Matrícula ${enrollment.code}
      Corpo:
      Olá ${student.fullName},

      Segue o link para pagamento da sua matrícula no curso ${course.name}:
      ${paymentUrl}

      Valor: ${new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(enrollment.amount)}

      Este link permite que você efetue o pagamento de forma segura e rápida.
      Após a confirmação do pagamento, sua matrícula será ativada automaticamente.

      Atenciosamente,
      Equipe ${polo?.name}
    `);

    // Registrar o envio do email no histórico (opcional, para auditoria)
    // Aqui seria uma implementação real para registrar o envio no banco de dados
    // await storage.createEmailLog({
    //   enrollmentId: enrollment.id,
    //   emailType: "payment_link",
    //   sentTo: studentEmail,
    //   sentBy: poloUser.id,
    //   content: paymentUrl
    // });

    return res.json({
      success: true,
      message: "Link de pagamento enviado com sucesso"
    });
  } catch (error) {
    console.error("Erro ao enviar link de pagamento:", error);
    return res.status(500).json({ 
      message: "Erro ao enviar link de pagamento por email" 
    });
  }
});

export default router;