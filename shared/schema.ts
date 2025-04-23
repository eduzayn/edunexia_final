import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, json, pgEnum, date, varchar, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Tipos de portal
export const portalTypes = ["student", "partner", "polo", "admin"] as const;
export type PortalType = typeof portalTypes[number];

// Enums
export const courseStatusEnum = pgEnum("course_status", ["draft", "published", "archived"]);
export const evaluationMethodEnum = pgEnum("evaluation_method", ["quiz", "exam", "project", "mixed"]);
export const courseModalityEnum = pgEnum("course_modality", ["ead", "hybrid", "presential"]);
export const videoSourceEnum = pgEnum("video_source", ["youtube", "onedrive", "google_drive", "vimeo", "upload"]);
export const contentCompletionStatusEnum = pgEnum("content_completion_status", ["incomplete", "complete"]);
export const assessmentTypeEnum = pgEnum("assessment_type", ["simulado", "avaliacao_final"]);
export const institutionStatusEnum = pgEnum("institution_status", ["active", "inactive", "pending"]);
export const institutionPhaseEnum = pgEnum("institution_phase", ["trial", "setup", "active", "suspended", "cancelled"]);
export const poloStatusEnum = pgEnum("polo_status", ["active", "inactive"]);
export const enrollmentStatusEnum = pgEnum("enrollment_status", ["pending_payment", "active", "completed", "cancelled", "suspended"]);
export const paymentGatewayEnum = pgEnum("payment_gateway", ["asaas", "lytex"]);
export const integrationTypeEnum = pgEnum("integration_type", ["asaas", "lytex", "openai", "elevenlabs", "zapi"]);

// Enums para o módulo CRM e Gestão e Matrículas
// Enums para outros módulos
export const clientTypeEnum = pgEnum("client_type", ["pf", "pj"]);  // Pessoa Física ou Pessoa Jurídica
export const simplifiedEnrollmentStatusEnum = pgEnum("simplified_enrollment_status", ["pending", "waiting_payment", "payment_confirmed", "converted", "expired", "blocked", "cancelled"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "pending", "paid", "overdue", "cancelled", "partial"]);
export const paymentStatusEnum = pgEnum("payment_status", ["completed", "pending", "failed", "refunded"]);
export const paymentMethodEnum = pgEnum("payment_method", ["credit_card", "debit_card", "bank_slip", "bank_transfer", "pix", "cash", "other"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["trial", "active", "cancelled", "expired"]);
export const accessTypeEnum = pgEnum("access_type", ["after_link_completion", "after_payment_confirmation"]);

// Enums para o sistema de permissões
export const permissionResourceEnum = pgEnum("permission_resource", [
  "matricula", "pagamento", "curso", "disciplina", "polo", 
  "usuario", "papel", "relatorio", "configuracao", "instituicao",
  "lead", "cliente", "contato", "fatura", "assinatura", "certificado"
]);
export const permissionActionEnum = pgEnum("permission_action", [
  "criar", "ler", "atualizar", "deletar", "listar", "aprovar", 
  "rejeitar", "cancelar", "gerar_cobranca", "confirmar", "ler_historico", 
  "editar_grade", "publicar", "definir_comissao", "convidar", 
  "atribuir", "gerar_financeiro", "editar_instituicao"
]);

// Tipos de curso
export const courseTypes = pgTable("course_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Usuários
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  cpf: text("cpf"), // CPF do usuário (obrigatório para alunos)
  phone: text("phone"), // Telefone de contato do usuário
  address: text("address"), // Endereço completo
  city: text("city"), // Cidade
  state: text("state"), // Estado (UF)
  zipCode: text("zip_code"), // CEP
  birthDate: text("birth_date"), // Data de nascimento
  portalType: text("portal_type").notNull(),
  poloId: integer("polo_id").references(() => polos.id), // Referência ao polo (para usuários do tipo "polo")
});

// Disciplinas (blocos de construção dos cursos)
export const disciplines = pgTable("disciplines", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  workload: integer("workload").notNull(), // Em horas
  syllabus: text("syllabus").notNull(), // Ementa da disciplina
  
  // Elementos de conteúdo
  videoAula1Url: text("video_aula1_url"), // URL do vídeo 1
  videoAula1Source: videoSourceEnum("video_aula1_source"), // Fonte do vídeo 1
  videoAula2Url: text("video_aula2_url"), // URL do vídeo 2
  videoAula2Source: videoSourceEnum("video_aula2_source"), // Fonte do vídeo 2
  videoAula3Url: text("video_aula3_url"), // URL do vídeo 3
  videoAula3Source: videoSourceEnum("video_aula3_source"), // Fonte do vídeo 3
  videoAula4Url: text("video_aula4_url"), // URL do vídeo 4
  videoAula4Source: videoSourceEnum("video_aula4_source"), // Fonte do vídeo 4
  videoAula5Url: text("video_aula5_url"), // URL do vídeo 5
  videoAula5Source: videoSourceEnum("video_aula5_source"), // Fonte do vídeo 5
  videoAula6Url: text("video_aula6_url"), // URL do vídeo 6
  videoAula6Source: videoSourceEnum("video_aula6_source"), // Fonte do vídeo 6
  videoAula7Url: text("video_aula7_url"), // URL do vídeo 7
  videoAula7Source: videoSourceEnum("video_aula7_source"), // Fonte do vídeo 7
  videoAula8Url: text("video_aula8_url"), // URL do vídeo 8
  videoAula8Source: videoSourceEnum("video_aula8_source"), // Fonte do vídeo 8
  videoAula9Url: text("video_aula9_url"), // URL do vídeo 9
  videoAula9Source: videoSourceEnum("video_aula9_source"), // Fonte do vídeo 9
  videoAula10Url: text("video_aula10_url"), // URL do vídeo 10
  videoAula10Source: videoSourceEnum("video_aula10_source"), // Fonte do vídeo 10
  apostilaPdfUrl: text("apostila_pdf_url"), // URL da apostila PDF
  ebookInterativoUrl: text("ebook_interativo_url"), // URL do e-book interativo
  
  // Status de completude
  contentStatus: contentCompletionStatusEnum("content_status").default("incomplete").notNull(),
  
  // Metadados
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Cursos (compostos por várias disciplinas)
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  status: courseStatusEnum("status").default("draft").notNull(),
  workload: integer("workload").notNull(), // Em horas
  price: doublePrecision("price"), // Preço do curso
  thumbnail: text("thumbnail"), // URL da imagem de capa
  requirements: text("requirements"), // Pré-requisitos (opcional)
  objectives: text("objectives"), // Objetivos do curso
  category: text("category"), // Categoria do curso
  modality: courseModalityEnum("modality").default("ead").notNull(), // Modalidade (EAD, híbrido, presencial)
  evaluationMethod: evaluationMethodEnum("evaluation_method").default("mixed"),
  
  // Metadados
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"), // Data de publicação
});

// Tabela de junção entre cursos e disciplinas
export const courseDisciplines = pgTable("course_disciplines", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  disciplineId: integer("discipline_id").notNull().references(() => disciplines.id, { onDelete: 'cascade' }),
  order: integer("order").notNull(), // Ordem da disciplina no curso
  isRequired: boolean("is_required").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Questões para simulados e avaliações
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  disciplineId: integer("discipline_id").notNull().references(() => disciplines.id, { onDelete: 'cascade' }),
  statement: text("statement").notNull(), // Enunciado da questão
  options: json("options").$type<string[]>().notNull(), // Alternativas
  correctOption: integer("correct_option").notNull(), // Índice da alternativa correta
  explanation: text("explanation"), // Explicação para feedback
  questionType: text("question_type").default("multiple_choice").notNull(), // Tipo de questão
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Avaliações (simulados e avaliações finais)
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  disciplineId: integer("discipline_id").notNull().references(() => disciplines.id, { onDelete: 'cascade' }),
  title: text("title").notNull(), // Título da atividade
  description: text("description"), // Descrição da atividade
  type: assessmentTypeEnum("type").notNull(), // Tipo: simulado ou avaliação final
  passingScore: integer("passing_score").default(60).notNull(), // Nota mínima para aprovação (%)
  timeLimit: integer("time_limit"), // Tempo limite em minutos (opcional)
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relação entre atividades avaliativas e questões
export const assessmentQuestions = pgTable("assessment_questions", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: 'cascade' }),
  order: integer("order").notNull(), // Ordem da questão na atividade
  weight: doublePrecision("weight").default(1).notNull(), // Peso da questão na nota final
});

// Instituições
export const institutions = pgTable("institutions", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  cnpj: text("cnpj").notNull().unique(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  status: institutionStatusEnum("status").default("active").notNull(),
  logo: text("logo"), // URL do logo
  primaryColor: text("primary_color").default("#4CAF50"),
  website: text("website"),
  
  // Campos para gerenciamento do trial
  isOnTrial: boolean("is_on_trial").default(false),
  trialStartDate: timestamp("trial_start_date"),
  trialEndDate: timestamp("trial_end_date"),
  
  // Fase da instituição (para ABAC)
  phase: institutionPhaseEnum("phase").default("trial").notNull(),
  
  // Plano atual
  currentPlanId: integer("current_plan_id").references(() => subscriptionPlans.id),
  
  // Configurações de matrícula flexível
  enrollmentAccessType: accessTypeEnum("enrollment_access_type").default("after_link_completion"),
  daysUntilBlock: integer("days_until_block").default(10), // Dias de atraso para bloqueio
  daysUntilCancellation: integer("days_until_cancellation").default(30), // Dias de atraso para cancelamento
  
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Polos (unidades físicas da instituição)
export const polos = pgTable("polos", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  institutionId: integer("institution_id").notNull().references(() => institutions.id, { onDelete: 'cascade' }),
  managerName: text("manager_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  status: poloStatusEnum("status").default("active").notNull(),
  capacity: integer("capacity"), // Capacidade de alunos
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Transações financeiras
export const financialTransactions = pgTable("financial_transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // entrada ou saida
  amount: doublePrecision("amount").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  status: text("status").notNull(), // concluído, pendente, agendado
  institutionId: integer("institution_id").references(() => institutions.id),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Categorias financeiras
export const financialCategories = pgTable("financial_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // entrada ou saida
  description: text("description"),
  institutionId: integer("institution_id").references(() => institutions.id),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Matrículas
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // Código único da matrícula, ex: MAT2025001
  studentId: integer("student_id").notNull().references(() => users.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  poloId: integer("polo_id").references(() => polos.id), // Opcional
  institutionId: integer("institution_id").notNull().references(() => institutions.id),
  partnerId: integer("partner_id").references(() => users.id), // Opcional, para comissões
  
  // Dados financeiros
  amount: doublePrecision("amount").notNull(), // Valor total da matrícula
  paymentGateway: paymentGatewayEnum("payment_gateway").notNull(), // Asaas ou Lytex
  paymentExternalId: text("payment_external_id"), // ID da cobrança no gateway
  paymentUrl: text("payment_url"), // URL de pagamento
  paymentMethod: text("payment_method"), // boleto, pix, cartão, etc
  
  // Datas importantes
  enrollmentDate: timestamp("enrollment_date").defaultNow().notNull(), // Data da matrícula
  startDate: timestamp("start_date"), // Data de início do curso
  expectedEndDate: timestamp("expected_end_date"), // Data prevista de conclusão
  actualEndDate: timestamp("actual_end_date"), // Data efetiva de conclusão
  
  // Status e informações adicionais
  status: enrollmentStatusEnum("status").default("pending_payment").notNull(),
  observations: text("observations"),
  
  // Rastreamento e Auditoria
  sourceChannel: text("source_channel"), // Canal de origem: admin, polo_portal, website, app, etc.
  referenceCode: text("reference_code"), // Código de referência para rastreamento de campanhas  
  
  // Metadados
  createdById: integer("created_by_id").references(() => users.id), // Quem criou a matrícula
  updatedById: integer("updated_by_id").references(() => users.id), // Quem atualizou por último
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Histórico de status das matrículas
export const enrollmentStatusHistory = pgTable("enrollment_status_history", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
  previousStatus: enrollmentStatusEnum("previous_status"),
  newStatus: enrollmentStatusEnum("new_status").notNull(),
  changeDate: timestamp("change_date").defaultNow().notNull(),
  changeReason: text("change_reason"),
  changedById: integer("changed_by_id").references(() => users.id),
  metadata: json("metadata"), // Pode armazenar payloads de webhooks ou informações adicionais
  poloId: integer("polo_id").references(() => polos.id), // Qual polo realizou a operação (se aplicável)
  sourceChannel: text("source_channel"), // Canal de origem da operação (admin, polo, website)
  ipAddress: text("ip_address"), // Endereço IP de onde veio a requisição
  userAgent: text("user_agent"), // Informações do navegador/dispositivo
});

// Matrículas simplificadas (fluxo de captação rápida)
export const simplifiedEnrollments = pgTable("simplified_enrollments", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  institutionId: integer("institution_id").notNull().references(() => institutions.id),
  studentName: text("student_name").notNull(),
  studentEmail: text("student_email").notNull(),
  studentPhone: text("student_phone"),
  studentCpf: text("student_cpf"),
  poloId: integer("polo_id").references(() => polos.id),
  status: simplifiedEnrollmentStatusEnum("status").default("pending").notNull(),
  externalReference: text("external_reference"), // ID para integração com sistemas externos
  paymentGateway: paymentGatewayEnum("payment_gateway"),
  paymentUrl: text("payment_url"), // URL para pagamento
  paymentLinkId: text("payment_link_id"), // ID do link de pagamento (Asaas)
  paymentLinkUrl: text("payment_link_url"), // URL do link de pagamento (Asaas)
  paymentId: text("payment_id"), // ID da cobrança/pagamento (Asaas)
  asaasCustomerId: text("asaas_customer_id"), // ID do cliente no Asaas
  amount: doublePrecision("amount"), // Valor da matrícula
  
  // Campos para controle de acesso e datas para regras de negócio
  accessGrantedAt: timestamp("access_granted_at"), // Data quando o acesso foi liberado
  paymentConfirmedAt: timestamp("payment_confirmed_at"), // Data de confirmação do pagamento
  blockScheduledAt: timestamp("block_scheduled_at"), // Data programada para bloqueio
  blockExecutedAt: timestamp("block_executed_at"), // Data real do bloqueio
  cancellationScheduledAt: timestamp("cancellation_scheduled_at"), // Data programada para cancelamento
  cancellationExecutedAt: timestamp("cancellation_executed_at"), // Data real do cancelamento
  paymentDueDate: timestamp("payment_due_date"), // Data de vencimento do pagamento
  
  errorDetails: text("error_details"), // Detalhes do erro em caso de falha
  sourceChannel: text("source_channel"), // Canal de origem (web, app, etc.)
  processedAt: timestamp("processed_at"), // Data de processamento
  processedById: integer("processed_by_id").references(() => users.id), // Usuário que processou
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdById: integer("created_by_id").references(() => users.id), // Usuário que criou
  updatedById: integer("updated_by_id").references(() => users.id), // Usuário que atualizou
  expiresAt: timestamp("expires_at"), // Data de expiração da matrícula simplificada
  convertedEnrollmentId: integer("converted_enrollment_id").references(() => enrollments.id), // Referência à matrícula completa quando convertida
});

// Log de alterações de status das matrículas simplificadas
export const simplifiedEnrollmentStatusLog = pgTable("simplified_enrollment_status_log", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull().references(() => simplifiedEnrollments.id, { onDelete: 'cascade' }),
  previousStatus: simplifiedEnrollmentStatusEnum("previous_status"),
  newStatus: simplifiedEnrollmentStatusEnum("new_status").notNull(),
  changeDate: timestamp("change_date").defaultNow().notNull(),
  changeReason: text("change_reason"),
  changedById: integer("changed_by_id").references(() => users.id),
  metadata: json("metadata"), // Pode armazenar payloads de webhooks ou informações adicionais
  ipAddress: text("ip_address"), // Endereço IP de onde veio a requisição
  userAgent: text("user_agent"), // Informações do navegador/dispositivo
});

// Auditoria de matrículas (mais abrangente que o histórico de status)
export const enrollmentAudits = pgTable("enrollment_audits", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
  actionType: text("action_type").notNull(), // create, update, status_change, payment_update
  performedById: integer("performed_by_id").references(() => users.id),
  performedByType: text("performed_by_type").notNull(), // admin, polo, system, student
  poloId: integer("polo_id").references(() => polos.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  details: json("details"), // Detalhes específicos da ação
  beforeState: json("before_state"), // Estado antes da alteração
  afterState: json("after_state"), // Estado após a alteração
});

// Planos de assinatura
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  billingCycle: text("billing_cycle").notNull(), // monthly, quarterly, yearly
  features: json("features").$type<string[]>(), // Lista de recursos incluídos
  isActive: boolean("is_active").default(true).notNull(),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schemas e types para inserção
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertDisciplineSchema = createInsertSchema(disciplines).omit({ id: true });
export type InsertDiscipline = z.infer<typeof insertDisciplineSchema>;
export type Discipline = typeof disciplines.$inferSelect;

export const insertCourseSchema = createInsertSchema(courses).omit({ id: true });
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

export const insertCourseDisciplineSchema = createInsertSchema(courseDisciplines).omit({ id: true });
export type InsertCourseDiscipline = z.infer<typeof insertCourseDisciplineSchema>;
export type CourseDiscipline = typeof courseDisciplines.$inferSelect;

export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true });
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

export const insertAssessmentSchema = createInsertSchema(assessments).omit({ id: true });
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessments.$inferSelect;

export const insertAssessmentQuestionSchema = createInsertSchema(assessmentQuestions).omit({ id: true });
export type InsertAssessmentQuestion = z.infer<typeof insertAssessmentQuestionSchema>;
export type AssessmentQuestion = typeof assessmentQuestions.$inferSelect;

export const insertInstitutionSchema = createInsertSchema(institutions).omit({ id: true });
export type InsertInstitution = z.infer<typeof insertInstitutionSchema>;
export type Institution = typeof institutions.$inferSelect;

export const insertPoloSchema = createInsertSchema(polos).omit({ id: true });
export type InsertPolo = z.infer<typeof insertPoloSchema>;
export type Polo = typeof polos.$inferSelect;

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true });
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;

export const insertSimplifiedEnrollmentSchema = createInsertSchema(simplifiedEnrollments).omit({ id: true });
export type InsertSimplifiedEnrollment = z.infer<typeof insertSimplifiedEnrollmentSchema>;
export type SimplifiedEnrollment = typeof simplifiedEnrollments.$inferSelect;

export const insertSimplifiedEnrollmentStatusLogSchema = createInsertSchema(simplifiedEnrollmentStatusLog).omit({ id: true });
export type InsertSimplifiedEnrollmentStatusLog = z.infer<typeof insertSimplifiedEnrollmentStatusLogSchema>;
export type SimplifiedEnrollmentStatusLog = typeof simplifiedEnrollmentStatusLog.$inferSelect;

// Relações entre tabelas
export const usersRelations = relations(users, ({ many }) => ({
  enrollments: many(enrollments, { relationName: "userEnrollments" }),
  createdCourses: many(courses, { relationName: "courseCreator" }),
  createdDisciplines: many(disciplines, { relationName: "disciplineCreator" }),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  creator: one(users, {
    fields: [courses.createdById],
    references: [users.id],
    relationName: "courseCreator",
  }),
  disciplines: many(courseDisciplines),
  enrollments: many(enrollments),
}));

export const disciplinesRelations = relations(disciplines, ({ one, many }) => ({
  creator: one(users, {
    fields: [disciplines.createdById],
    references: [users.id],
    relationName: "disciplineCreator",
  }),
  courses: many(courseDisciplines),
  questions: many(questions),
  assessments: many(assessments),
}));

export const courseDisciplinesRelations = relations(courseDisciplines, ({ one }) => ({
  course: one(courses, {
    fields: [courseDisciplines.courseId],
    references: [courses.id],
  }),
  discipline: one(disciplines, {
    fields: [courseDisciplines.disciplineId],
    references: [disciplines.id],
  }),
}));

export const institutionsRelations = relations(institutions, ({ one, many }) => ({
  creator: one(users, {
    fields: [institutions.createdById],
    references: [users.id],
  }),
  polos: many(polos),
  enrollments: many(enrollments),
  subscriptionPlan: one(subscriptionPlans, {
    fields: [institutions.currentPlanId],
    references: [subscriptionPlans.id],
  }),
}));

export const polosRelations = relations(polos, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [polos.institutionId],
    references: [institutions.id],
  }),
  enrollments: many(enrollments),
  users: many(users),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(users, {
    fields: [enrollments.studentId],
    references: [users.id],
    relationName: "userEnrollments",
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
  institution: one(institutions, {
    fields: [enrollments.institutionId],
    references: [institutions.id],
  }),
  polo: one(polos, {
    fields: [enrollments.poloId],
    references: [polos.id],
  }),
  creator: one(users, {
    fields: [enrollments.createdById],
    references: [users.id],
  }),
}));

export const simplifiedEnrollmentsRelations = relations(simplifiedEnrollments, ({ one, many }) => ({
  course: one(courses, {
    fields: [simplifiedEnrollments.courseId],
    references: [courses.id],
  }),
  institution: one(institutions, {
    fields: [simplifiedEnrollments.institutionId],
    references: [institutions.id],
  }),
  polo: one(polos, {
    fields: [simplifiedEnrollments.poloId],
    references: [polos.id],
  }),
  creator: one(users, {
    fields: [simplifiedEnrollments.createdById],
    references: [users.id],
  }),
  statusLogs: many(simplifiedEnrollmentStatusLog),
  convertedTo: one(enrollments, {
    fields: [simplifiedEnrollments.convertedEnrollmentId],
    references: [enrollments.id],
  }),
}));

export const simplifiedEnrollmentStatusLogRelations = relations(simplifiedEnrollmentStatusLog, ({ one }) => ({
  enrollment: one(simplifiedEnrollments, {
    fields: [simplifiedEnrollmentStatusLog.enrollmentId],
    references: [simplifiedEnrollments.id],
  }),
  changedBy: one(users, {
    fields: [simplifiedEnrollmentStatusLog.changedById],
    references: [users.id],
  }),
}));

// Validação específica para inserção de usuários (exemplo)
export const extendedInsertUserSchema = insertUserSchema.extend({
  portalType: z.enum(portalTypes),
  password: z.string().min(8, { message: "A senha deve ter no mínimo 8 caracteres" }),
  passwordConfirmation: z.string(),
}).refine(data => {
  return data.password === data.passwordConfirmation;
}, {
  message: "As senhas não conferem",
  path: ["passwordConfirmation"],
});

// Schema de autenticação
export const loginSchema = z.object({
  username: z.string().min(1, { message: "O nome de usuário é obrigatório" }),
  password: z.string().min(1, { message: "A senha é obrigatória" }),
});

export type LoginCredentials = z.infer<typeof loginSchema>;