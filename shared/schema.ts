import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, json, pgEnum, date, varchar, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Interface para dados de login
export interface LoginData {
  username: string;
  password: string;
  portalType?: string;
  rememberMe?: boolean;
}

// Importações para exportação de tabelas de certificados
import { 
  certificates, 
  certificateSigners, 
  certificateTemplates, 
  certificateDisciplines, 
  certificateHistory,
  certificateStatusEnum,
  certificateTypeEnum
} from './certificate-schema';

// Importações para exportação de tabelas de solicitações de certificação
import { 
  certificationRequests, 
  certificationStudents, 
  certificationDocuments, 
  certificationActivityLogs,
  certificationRequestStatusEnum,
  documentVerificationStatusEnum,
  InsertCertificationRequest,
  InsertCertificationStudent,
  InsertCertificationDocument,
  InsertCertificationActivityLog,
  insertCertificationRequestSchema,
  insertCertificationStudentSchema,
  insertCertificationDocumentSchema,
  insertCertificationActivityLogSchema
} from './certification-request-schema';

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
export const enrollmentStatusEnum = pgEnum("enrollment_status", ["pending_payment", "waiting_payment", "payment_confirmed", "active", "completed", "cancelled", "suspended", "blocked"]);
export const paymentGatewayEnum = pgEnum("payment_gateway", ["asaas", "lytex"]);
export const integrationTypeEnum = pgEnum("integration_type", ["asaas", "lytex", "openai", "elevenlabs", "zapi"]);

// Enums para o módulo CRM e Gestão e Matrículas
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
  poloId: integer("polo_id"), // Referência ao polo (para usuários do tipo "polo")
  asaasId: text("asaas_id"), // ID do cliente no Asaas para integrações de pagamento
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
  currentPlanId: integer("current_plan_id"),
  
  // Configurações de matrícula flexível
  enrollmentAccessType: accessTypeEnum("enrollment_access_type").default("after_link_completion"),
  daysUntilBlock: integer("days_until_block").default(10), // Dias de atraso para bloqueio
  daysUntilCancellation: integer("days_until_cancellation").default(30), // Dias de atraso para cancelamento
  accessPeriodDays: integer("access_period_days"), // Período padrão de acesso em dias após a concessão
  
  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Polos (unidades físicas da instituição)
export const polos = pgTable("polos", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  institutionId: integer("institution_id").notNull(),
  managerName: text("manager_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  status: poloStatusEnum("status").default("active").notNull(),
  capacity: integer("capacity"), // Capacidade de alunos
  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  videoAula1StartTime: text("video_aula1_start_time"), // Tempo de início do vídeo 1 (mm:ss)
  videoAula2Url: text("video_aula2_url"), // URL do vídeo 2
  videoAula2Source: videoSourceEnum("video_aula2_source"), // Fonte do vídeo 2
  videoAula2StartTime: text("video_aula2_start_time"), // Tempo de início do vídeo 2 (mm:ss)
  videoAula3Url: text("video_aula3_url"), // URL do vídeo 3
  videoAula3Source: videoSourceEnum("video_aula3_source"), // Fonte do vídeo 3
  videoAula3StartTime: text("video_aula3_start_time"), // Tempo de início do vídeo 3 (mm:ss)
  videoAula4Url: text("video_aula4_url"), // URL do vídeo 4
  videoAula4Source: videoSourceEnum("video_aula4_source"), // Fonte do vídeo 4
  videoAula4StartTime: text("video_aula4_start_time"), // Tempo de início do vídeo 4 (mm:ss)
  videoAula5Url: text("video_aula5_url"), // URL do vídeo 5
  videoAula5Source: videoSourceEnum("video_aula5_source"), // Fonte do vídeo 5
  videoAula5StartTime: text("video_aula5_start_time"), // Tempo de início do vídeo 5 (mm:ss)
  videoAula6Url: text("video_aula6_url"), // URL do vídeo 6
  videoAula6Source: videoSourceEnum("video_aula6_source"), // Fonte do vídeo 6
  videoAula6StartTime: text("video_aula6_start_time"), // Tempo de início do vídeo 6 (mm:ss)
  videoAula7Url: text("video_aula7_url"), // URL do vídeo 7
  videoAula7Source: videoSourceEnum("video_aula7_source"), // Fonte do vídeo 7
  videoAula7StartTime: text("video_aula7_start_time"), // Tempo de início do vídeo 7 (mm:ss)
  videoAula8Url: text("video_aula8_url"), // URL do vídeo 8
  videoAula8Source: videoSourceEnum("video_aula8_source"), // Fonte do vídeo 8
  videoAula8StartTime: text("video_aula8_start_time"), // Tempo de início do vídeo 8 (mm:ss)
  videoAula9Url: text("video_aula9_url"), // URL do vídeo 9
  videoAula9Source: videoSourceEnum("video_aula9_source"), // Fonte do vídeo 9
  videoAula9StartTime: text("video_aula9_start_time"), // Tempo de início do vídeo 9 (mm:ss)
  videoAula10Url: text("video_aula10_url"), // URL do vídeo 10
  videoAula10Source: videoSourceEnum("video_aula10_source"), // Fonte do vídeo 10
  videoAula10StartTime: text("video_aula10_start_time"), // Tempo de início do vídeo 10 (mm:ss)
  apostilaPdfUrl: text("apostila_pdf_url"), // URL da apostila PDF
  ebookInterativoUrl: text("ebook_interativo_url"), // URL do e-book interativo
  
  // Status de completude
  contentStatus: contentCompletionStatusEnum("content_status").default("incomplete").notNull(),
  
  // Metadados
  createdById: integer("created_by_id"),
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
  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"), // Data de publicação
});

// Tabela de junção entre cursos e disciplinas
export const courseDisciplines = pgTable("course_disciplines", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  disciplineId: integer("discipline_id").notNull(),
  order: integer("order").notNull(), // Ordem da disciplina no curso
  isRequired: boolean("is_required").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema de questões e avaliações removido timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relação entre atividades avaliativas e questões
export const assessmentQuestions = pgTable("assessment_questions", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  questionId: integer("question_id").notNull(),
  order: integer("order").notNull(), // Ordem da questão na atividade
  weight: doublePrecision("weight").default(1).notNull(), // Peso da questão na nota final
});

// Planos de assinatura
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: doublePrecision("price").notNull(),
  features: json("features").$type<string[]>(),
  maxStudents: integer("max_students"),
  maxCourses: integer("max_courses"),
  maxDisciplines: integer("max_disciplines"),
  maxPolos: integer("max_polos"),
  hasWhiteLabel: boolean("has_white_label").default(false),
  hasCustomDomain: boolean("has_custom_domain").default(false),
  hasPremiumSupport: boolean("has_premium_support").default(false),
  status: subscriptionStatusEnum("status").default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Matrículas
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // Código único da matrícula, ex: MAT2025001
  studentId: integer("student_id").notNull(),
  courseId: integer("course_id").notNull(),
  poloId: integer("polo_id"), // Opcional
  institutionId: integer("institution_id").notNull(),
  partnerId: integer("partner_id"), // Opcional, para comissões
  
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
  
  // Controle de acesso ao portal
  accessGrantedAt: timestamp("access_granted_at"), // Data quando o acesso foi liberado
  accessExpiresAt: timestamp("access_expires_at"), // Data quando o acesso expira
  
  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Histórico de status de matrículas
export const enrollmentStatusHistory = pgTable("enrollment_status_history", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull(),
  oldStatus: enrollmentStatusEnum("old_status").notNull(),
  newStatus: enrollmentStatusEnum("new_status").notNull(),
  reason: text("reason"),
  changedById: integer("changed_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabelas para módulo de matrículas simplificadas
export const simplifiedEnrollments = pgTable("simplified_enrollments", {
  id: serial("id").primaryKey(),
  uuid: text("uuid").notNull().unique(), // Identificador público para links
  courseId: integer("course_id").notNull(),
  institutionId: integer("institution_id").notNull(),
  
  // Dados do aluno potencial
  studentName: text("student_name").notNull(),
  studentEmail: text("student_email").notNull(),
  studentPhone: text("student_phone").notNull(),
  studentCpf: text("student_cpf"),
  
  // Histórico de preços
  fullPrice: doublePrecision("full_price").notNull(),
  discountPrice: doublePrecision("discount_price"),
  
  // Controle de acesso
  expiresAt: timestamp("expires_at").notNull(), // Data quando o link expira
  paymentGateway: paymentGatewayEnum("payment_gateway").notNull(),
  paymentExternalId: text("payment_external_id"), // ID no gateway externo
  paymentUrl: text("payment_url"), // URL do checkout
  status: simplifiedEnrollmentStatusEnum("status").default("pending").notNull(),
  
  // Rastreamento
  utm_source: text("utm_source"),
  utm_medium: text("utm_medium"),
  utm_campaign: text("utm_campaign"),
  
  // Metadados
  createdById: integer("created_by_id"),
  poloId: integer("polo_id"), // Opcional, para rastreamento de origem
  observations: text("observations"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  convertedToEnrollmentId: integer("converted_to_enrollment_id"), // ID da matrícula quando convertida
});

// Histórico de status de inscrições simplificadas
export const simplifiedEnrollmentStatusLog = pgTable("simplified_enrollment_status_log", {
  id: serial("id").primaryKey(),
  simplifiedEnrollmentId: integer("simplified_enrollment_id").notNull(),
  oldStatus: simplifiedEnrollmentStatusEnum("old_status").notNull(),
  newStatus: simplifiedEnrollmentStatusEnum("new_status").notNull(),
  reason: text("reason"),
  gatewayData: json("gateway_data"), // Dados adicionais do gateway
  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabelas para o módulo financeiro
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cpfCnpj: text("cpf_cnpj").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  type: clientTypeEnum("type").default("pf").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  price: doublePrecision("price").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  clientId: integer("client_id"),
  description: text("description"),
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  dueDate: timestamp("due_date").notNull(),
  totalAmount: doublePrecision("total_amount").notNull(),
  status: invoiceStatusEnum("status").default("draft").notNull(),
  notes: text("notes"),
  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  productId: integer("product_id"),
  description: text("description").notNull(),
  quantity: doublePrecision("quantity").notNull(),
  unitPrice: doublePrecision("unit_price").notNull(),
  discount: doublePrecision("discount").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  amount: doublePrecision("amount").notNull(),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  status: paymentStatusEnum("status").default("pending").notNull(),
  externalId: text("external_id"), // ID do pagamento no gateway
  notes: text("notes"),
  createdById: integer("created_by_id"),
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
  institutionId: integer("institution_id"),
  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Categorias financeiras
export const financialCategories = pgTable("financial_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // entrada ou saida
  description: text("description"),
  institutionId: integer("institution_id"),
  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  number: text("number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  status: text("status").notNull(), // active, completed, cancelled
  contractValue: doublePrecision("contract_value").notNull(),
  documentUrl: text("document_url"),
  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Enumeração para status de contrato educacional
export const contractStatusEnum = pgEnum('contract_status', ['pending', 'signed', 'cancelled']);

// Contratos educacionais
export const educationalContracts = pgTable("educational_contracts", {
  id: text("id").primaryKey(), // Formato: contract_UUID
  enrollmentId: text("enrollment_id").notNull(), // ID da matrícula simplificada
  studentId: integer("student_id").notNull().references(() => users.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  contractNumber: text("contract_number").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  signatureDate: timestamp("signature_date"), // Alterado de signedAt para signatureDate
  status: contractStatusEnum("status").notNull().default('pending'), // Usando enum para status
  contractType: text("contract_type").notNull(), // GRADUATION, POST_GRADUATION, etc.
  contractUrl: text("contract_url"),
  expiresAt: timestamp("expires_at"),
  totalValue: doublePrecision("total_value").notNull(),
  installments: integer("installments").notNull(),
  installmentValue: doublePrecision("installment_value").notNull(),
  paymentMethod: text("payment_method").notNull(),
  discount: doublePrecision("discount").default(0),
  signatureData: text("signature_data"), // Campo para armazenar dados da assinatura
  additionalTerms: text("additional_terms"), // Termos adicionais do contrato
  startDate: timestamp("start_date"), // Data de início do contrato
  endDate: timestamp("end_date"), // Data de término do contrato
  campus: text("campus"), // Campus do curso
  // Metadados adicionais em formato JSON
  metadata: json("metadata"),
});

// Exportar tabelas do módulo de certificação (importadas de certificate-schema.ts)
export { certificates, certificateSigners, certificateTemplates, certificateDisciplines, certificateHistory };

// Schemas de inserção e tipos para usuários
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Schemas de inserção e tipos para disciplinas
export const insertDisciplineSchema = createInsertSchema(disciplines).omit({ id: true });
export type InsertDiscipline = z.infer<typeof insertDisciplineSchema>;
export type Discipline = typeof disciplines.$inferSelect;

// Schemas de inserção e tipos para cursos
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true });
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

// Schemas de inserção e tipos para curso-disciplinas
export const insertCourseDisciplineSchema = createInsertSchema(courseDisciplines).omit({ id: true });
export type InsertCourseDiscipline = z.infer<typeof insertCourseDisciplineSchema>;
export type CourseDiscipline = typeof courseDisciplines.$inferSelect;

// Schemas de inserção e tipos para módulo financeiro
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export const insertClientSchema = createInsertSchema(clients).omit({ id: true });
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ id: true });
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;

export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export const insertContractSchema = createInsertSchema(contracts).omit({ id: true });
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;

// Schema para contratos educacionais
export const insertEducationalContractSchema = createInsertSchema(educationalContracts);
export type InsertEducationalContract = z.infer<typeof insertEducationalContractSchema>;
export type EducationalContract = typeof educationalContracts.$inferSelect;

// Schemas para operações financeiras
export const insertFinancialTransactionSchema = createInsertSchema(financialTransactions).omit({ id: true });
export type InsertFinancialTransaction = z.infer<typeof insertFinancialTransactionSchema>;
export type FinancialTransaction = typeof financialTransactions.$inferSelect;

export const insertFinancialCategorySchema = createInsertSchema(financialCategories).omit({ id: true });
export type InsertFinancialCategory = z.infer<typeof insertFinancialCategorySchema>;
export type FinancialCategory = typeof financialCategories.$inferSelect;

// Schemas de inserção e tipos para matrículas simplificadas
// Criar schema de inserção e personalizar validação para lidar com o campo expiresAt como Date ou string
export const insertSimplifiedEnrollmentSchema = createInsertSchema(simplifiedEnrollments)
  .omit({ id: true })
  .extend({
    // Permitir que expiresAt seja uma string ou Date
    expiresAt: z.union([
      z.string().transform((val) => new Date(val)),
      z.date()
    ])
  });
export type InsertSimplifiedEnrollment = z.infer<typeof insertSimplifiedEnrollmentSchema>;
export type SimplifiedEnrollment = typeof simplifiedEnrollments.$inferSelect;

export const insertSimplifiedEnrollmentStatusLogSchema = createInsertSchema(simplifiedEnrollmentStatusLog).omit({ id: true });
export type InsertSimplifiedEnrollmentStatusLog = z.infer<typeof insertSimplifiedEnrollmentStatusLogSchema>;
export type SimplifiedEnrollmentStatusLog = typeof simplifiedEnrollmentStatusLog.$inferSelect;

// Relações entre tabelas
export const usersRelations = relations(users, ({ many }) => ({
  matriculas: many(enrollments),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  disciplinas: many(courseDisciplines),
}));

export const disciplinesRelations = relations(disciplines, ({ one, many }) => ({
  cursos: many(courseDisciplines),
}));

export const courseDisciplinesRelations = relations(courseDisciplines, ({ one }) => ({
  curso: one(courses, {
    fields: [courseDisciplines.courseId],
    references: [courses.id],
  }),
  disciplina: one(disciplines, {
    fields: [courseDisciplines.disciplineId],
    references: [disciplines.id],
  }),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  invoices: many(invoices),
  contracts: many(contracts),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
    relationName: 'invoiceToClient',
  }),
  items: many(invoiceItems),
  payments: many(payments),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  product: one(products, {
    fields: [invoiceItems.productId],
    references: [products.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

export const contractsRelations = relations(contracts, ({ one }) => ({
  client: one(clients, {
    fields: [contracts.clientId],
    references: [clients.id],
  }),
}));

export const financialTransactionsRelations = relations(financialTransactions, ({ one }) => ({
  category: one(financialCategories, {
    fields: [financialTransactions.category],
    references: [financialCategories.name],
  }),
}));

export const financialCategoriesRelations = relations(financialCategories, ({ many }) => ({
  transactions: many(financialTransactions),
}));

// Relações para contratos educacionais
export const educationalContractsRelations = relations(educationalContracts, ({ one }) => ({
  student: one(users, {
    fields: [educationalContracts.studentId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [educationalContracts.courseId],
    references: [courses.id],
  }),
}));

// Modelo para login
export const loginSchema = z.object({
  username: z.string().min(1, "Nome de usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;