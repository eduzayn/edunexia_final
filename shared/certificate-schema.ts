import { pgTable, serial, text, timestamp, integer, boolean, json, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users, courses, disciplines, institutions } from './schema';

// Enums para certificados
export const certificateStatusEnum = pgEnum("certificate_status", ["draft", "pending", "issued", "revoked"]);
export const certificateTypeEnum = pgEnum("certificate_type", ["graduation", "postgrad", "extension", "free_course"]);

// Templates de certificados
export const certificateTemplates = pgTable("certificate_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: certificateTypeEnum("type").default("postgrad").notNull(),
  defaultTitle: text("default_title").default("Certificado de Conclusão"),
  headerHtml: text("header_html"),
  bodyHtml: text("body_html"),
  footerHtml: text("footer_html"),
  cssStyles: text("css_styles"),
  backgroundImageUrl: text("background_image_url"),
  previewImageUrl: text("preview_image_url"),
  logoPosition: text("logo_position").default("top-center"),
  orientation: text("orientation").default("landscape"),
  paperSize: text("paper_size").default("A4"),
  institutionId: integer("institution_id").references(() => institutions.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Signatários de certificados
export const certificateSigners = pgTable("certificate_signers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  institutionId: integer("institution_id").references(() => institutions.id),
  signatureImageUrl: text("signature_image_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Certificados
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  studentId: integer("student_id").notNull().references(() => users.id),
  courseId: integer("course_id").references(() => courses.id),
  courseName: text("course_name").notNull(),
  courseType: text("course_type").notNull(),
  title: text("title").default("Certificado de Conclusão"),
  templateId: integer("template_id").references(() => certificateTemplates.id),
  signerId: integer("signer_id").references(() => certificateSigners.id),
  institutionId: integer("institution_id").references(() => institutions.id),
  studentBirthplace: text("student_birthplace"),
  completionDate: timestamp("completion_date"),
  totalWorkload: integer("total_workload"),
  status: certificateStatusEnum("status").default("draft").notNull(),
  issuedAt: timestamp("issued_at"),
  revokedAt: timestamp("revoked_at"),
  revocationReason: text("revocation_reason"),
  metadata: json("metadata"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Disciplinas do certificado
export const certificateDisciplines = pgTable("certificate_disciplines", {
  id: serial("id").primaryKey(),
  certificateId: integer("certificate_id").notNull().references(() => certificates.id, { onDelete: 'cascade' }),
  disciplineId: integer("discipline_id").references(() => disciplines.id),
  disciplineName: text("discipline_name").notNull(),
  workload: integer("workload").notNull(),
  professorName: text("professor_name"),
  professorTitle: text("professor_title"),
  attendance: integer("attendance"),
  performance: integer("performance"),
  grade: text("grade"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Histórico de certificados
export const certificateHistory = pgTable("certificate_history", {
  id: serial("id").primaryKey(),
  certificateId: integer("certificate_id").notNull().references(() => certificates.id, { onDelete: 'cascade' }),
  action: text("action").notNull(),
  description: text("description").notNull(),
  performedById: integer("performed_by_id").references(() => users.id),
  performedAt: timestamp("performed_at").defaultNow().notNull()
});

// Relações
export const certificateTemplatesRelations = relations(certificateTemplates, ({ one }) => ({
  institution: one(institutions, {
    fields: [certificateTemplates.institutionId],
    references: [institutions.id]
  }),
  createdBy: one(users, {
    fields: [certificateTemplates.createdById],
    references: [users.id]
  })
}));

export const certificateSignersRelations = relations(certificateSigners, ({ one }) => ({
  institution: one(institutions, {
    fields: [certificateSigners.institutionId],
    references: [institutions.id]
  }),
  createdBy: one(users, {
    fields: [certificateSigners.createdById],
    references: [users.id]
  })
}));

export const certificatesRelations = relations(certificates, ({ one, many }) => ({
  student: one(users, {
    fields: [certificates.studentId],
    references: [users.id]
  }),
  course: one(courses, {
    fields: [certificates.courseId],
    references: [courses.id]
  }),
  template: one(certificateTemplates, {
    fields: [certificates.templateId],
    references: [certificateTemplates.id]
  }),
  signer: one(certificateSigners, {
    fields: [certificates.signerId],
    references: [certificateSigners.id]
  }),
  institution: one(institutions, {
    fields: [certificates.institutionId],
    references: [institutions.id]
  }),
  createdBy: one(users, {
    fields: [certificates.createdById],
    references: [users.id]
  }),
  disciplines: many(certificateDisciplines),
  history: many(certificateHistory)
}));

export const certificateDisciplinesRelations = relations(certificateDisciplines, ({ one }) => ({
  certificate: one(certificates, {
    fields: [certificateDisciplines.certificateId],
    references: [certificates.id]
  }),
  discipline: one(disciplines, {
    fields: [certificateDisciplines.disciplineId],
    references: [disciplines.id]
  })
}));

export const certificateHistoryRelations = relations(certificateHistory, ({ one }) => ({
  certificate: one(certificates, {
    fields: [certificateHistory.certificateId],
    references: [certificates.id]
  }),
  performedBy: one(users, {
    fields: [certificateHistory.performedById],
    references: [users.id]
  })
}));

// Schemas para validação
export const insertCertificateTemplateSchema = createInsertSchema(certificateTemplates, {
  // Adicionar validações personalizadas se necessário
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertCertificateSignerSchema = createInsertSchema(certificateSigners, {
  // Adicionar validações personalizadas se necessário
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertCertificateSchema = createInsertSchema(certificates, {
  // Adicionar validações personalizadas se necessário
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertCertificateDisciplineSchema = createInsertSchema(certificateDisciplines, {
  // Adicionar validações personalizadas se necessário
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertCertificateHistorySchema = createInsertSchema(certificateHistory, {
  // Adicionar validações personalizadas se necessário
}).omit({ id: true, performedAt: true });

// Types de inserção
export type InsertCertificateTemplate = z.infer<typeof insertCertificateTemplateSchema>;
export type InsertCertificateSigner = z.infer<typeof insertCertificateSignerSchema>;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type InsertCertificateDiscipline = z.infer<typeof insertCertificateDisciplineSchema>;
export type InsertCertificateHistory = z.infer<typeof insertCertificateHistorySchema>;

// Types de seleção
export type CertificateTemplate = typeof certificateTemplates.$inferSelect;
export type CertificateSigner = typeof certificateSigners.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
export type CertificateDiscipline = typeof certificateDisciplines.$inferSelect;
export type CertificateHistory = typeof certificateHistory.$inferSelect;