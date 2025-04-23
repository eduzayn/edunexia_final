import { pgTable, serial, text, timestamp, integer, boolean, doublePrecision, pgEnum, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users, courses, institutions } from './schema';
import { certificates } from './certificate-schema';

// Enums para solicitações de certificação
export const certificationRequestStatusEnum = pgEnum("certification_request_status", [
  "pending", // Solicitação pendente de análise
  "under_review", // Em análise pela administração
  "approved", // Documentos aprovados, aguardando pagamento
  "rejected", // Documentos rejeitados
  "payment_pending", // Aguardando pagamento
  "payment_confirmed", // Pagamento confirmado
  "processing", // Processando emissão dos certificados
  "completed", // Certificados emitidos
  "cancelled" // Solicitação cancelada
]);

export const documentVerificationStatusEnum = pgEnum("document_verification_status", [
  "pending", // Aguardando verificação
  "verified", // Documento verificado e aprovado
  "rejected" // Documento rejeitado
]);

// Solicitações de certificação em lote
export const certificationRequests = pgTable("certification_requests", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // Código único da solicitação, ex: CERT2025001
  partnerId: integer("partner_id").notNull().references(() => users.id), // Parceiro que fez a solicitação
  institutionId: integer("institution_id").notNull().references(() => institutions.id), // Instituição para a qual a solicitação está sendo feita
  
  // Informações do lote
  title: text("title").notNull(), // Título descritivo da solicitação
  description: text("description"), // Descrição ou observações adicionais
  totalStudents: integer("total_students").notNull(), // Número total de alunos no lote
  unitPrice: doublePrecision("unit_price").notNull(), // Preço unitário por certificado
  totalAmount: doublePrecision("total_amount").notNull(), // Valor total da solicitação
  
  // Status e datas
  status: certificationRequestStatusEnum("status").default("pending").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(), // Data de submissão
  reviewedAt: timestamp("reviewed_at"), // Data da revisão
  reviewedById: integer("reviewed_by_id").references(() => users.id), // Admin que revisou
  rejectionReason: text("rejection_reason"), // Motivo de rejeição (se aplicável)
  
  // Informações de pagamento
  asaasPaymentId: text("asaas_payment_id"), // ID do pagamento no Asaas
  paymentLink: text("payment_link"), // Link para pagamento
  invoiceUrl: text("invoice_url"), // URL da fatura
  pixQrCodeUrl: text("pix_qr_code_url"), // URL do QR Code PIX
  pixCopiaECola: text("pix_copia_e_cola"), // Código PIX copia e cola
  paymentStatus: text("payment_status").default("pending"), // Status do pagamento
  paidAt: timestamp("paid_at"), // Data de pagamento
  
  // Metadados
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Estudantes incluídos na solicitação de certificação
export const certificationStudents = pgTable("certification_students", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => certificationRequests.id, { onDelete: 'cascade' }),
  name: text("name").notNull(), // Nome completo do aluno
  cpf: text("cpf").notNull(), // CPF do aluno
  email: text("email").notNull(), // Email do aluno
  phone: text("phone"), // Telefone do aluno
  courseId: integer("course_id").notNull().references(() => courses.id), // Curso a ser certificado
  courseName: text("course_name").notNull(), // Nome do curso (para redundância)
  
  // Status de processamento
  status: text("status").default("pending").notNull(), // pending, processing, complete, failed
  certificateId: integer("certificate_id").references(() => certificates.id), // ID do certificado gerado (quando completo)
  observations: text("observations"), // Observações ou notas adicionais
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Documentos enviados na solicitação de certificação
export const certificationDocuments = pgTable("certification_documents", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => certificationRequests.id, { onDelete: 'cascade' }),
  studentId: integer("student_id").references(() => certificationStudents.id), // Pode ser nulo se o documento for para todo o lote
  type: text("type").notNull(), // Tipo de documento: rg, cpf, diploma, historico, etc.
  fileName: text("file_name").notNull(), // Nome original do arquivo
  filePath: text("file_path").notNull(), // Caminho no servidor
  fileSize: integer("file_size").notNull(), // Tamanho em bytes
  mimeType: text("mime_type").notNull(), // Tipo MIME
  
  // Verificação de documentos
  verificationStatus: documentVerificationStatusEnum("verification_status").default("pending").notNull(),
  verifiedAt: timestamp("verified_at"), // Data de verificação
  verifiedById: integer("verified_by_id").references(() => users.id), // Admin que verificou
  rejectionReason: text("rejection_reason"), // Motivo de rejeição (se aplicável)
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Logs de atividades relacionadas às solicitações
export const certificationActivityLogs = pgTable("certification_activity_logs", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => certificationRequests.id, { onDelete: 'cascade' }),
  action: text("action").notNull(), // Tipo de ação: submissão, revisão, pagamento, emissão, etc.
  description: text("description").notNull(), // Descrição detalhada da ação
  performedById: integer("performed_by_id").references(() => users.id), // Usuário que realizou a ação
  metadata: json("metadata"), // Dados adicionais em JSON
  performedAt: timestamp("performed_at").defaultNow().notNull()
});

// Relações
export const certificationRequestsRelations = relations(certificationRequests, ({ one, many }) => ({
  partner: one(users, {
    fields: [certificationRequests.partnerId],
    references: [users.id]
  }),
  institution: one(institutions, {
    fields: [certificationRequests.institutionId],
    references: [institutions.id]
  }),
  reviewedBy: one(users, {
    fields: [certificationRequests.reviewedById],
    references: [users.id]
  }),
  students: many(certificationStudents),
  documents: many(certificationDocuments),
  activityLogs: many(certificationActivityLogs)
}));

export const certificationStudentsRelations = relations(certificationStudents, ({ one, many }) => ({
  request: one(certificationRequests, {
    fields: [certificationStudents.requestId],
    references: [certificationRequests.id]
  }),
  course: one(courses, {
    fields: [certificationStudents.courseId],
    references: [courses.id]
  }),
  certificate: one(certificates, {
    fields: [certificationStudents.certificateId],
    references: [certificates.id]
  }),
  documents: many(certificationDocuments, { relationName: "studentDocuments" })
}));

export const certificationDocumentsRelations = relations(certificationDocuments, ({ one }) => ({
  request: one(certificationRequests, {
    fields: [certificationDocuments.requestId],
    references: [certificationRequests.id]
  }),
  student: one(certificationStudents, {
    fields: [certificationDocuments.studentId],
    references: [certificationStudents.id],
    relationName: "studentDocuments"
  }),
  verifiedBy: one(users, {
    fields: [certificationDocuments.verifiedById],
    references: [users.id]
  })
}));

export const certificationActivityLogsRelations = relations(certificationActivityLogs, ({ one }) => ({
  request: one(certificationRequests, {
    fields: [certificationActivityLogs.requestId],
    references: [certificationRequests.id]
  }),
  performedBy: one(users, {
    fields: [certificationActivityLogs.performedById],
    references: [users.id]
  })
}));

// Schemas para validação
export const insertCertificationRequestSchema = createInsertSchema(certificationRequests);
export const insertCertificationStudentSchema = createInsertSchema(certificationStudents);
export const insertCertificationDocumentSchema = createInsertSchema(certificationDocuments);
export const insertCertificationActivityLogSchema = createInsertSchema(certificationActivityLogs);

// Types de inserção
export type InsertCertificationRequest = z.infer<typeof insertCertificationRequestSchema>;
export type InsertCertificationStudent = z.infer<typeof insertCertificationStudentSchema>;
export type InsertCertificationDocument = z.infer<typeof insertCertificationDocumentSchema>;
export type InsertCertificationActivityLog = z.infer<typeof insertCertificationActivityLogSchema>;

// Types de seleção
export type CertificationRequest = typeof certificationRequests.$inferSelect;
export type CertificationStudent = typeof certificationStudents.$inferSelect;
export type CertificationDocument = typeof certificationDocuments.$inferSelect;
export type CertificationActivityLog = typeof certificationActivityLogs.$inferSelect;