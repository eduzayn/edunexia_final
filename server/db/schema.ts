
import { pgTable, serial, text, timestamp, integer, boolean, doublePrecision } from 'drizzle-orm/pg-core';

// Simplified Enrollments schema
export const simplifiedEnrollments = pgTable('simplified_enrollments', {
  id: serial('id').primaryKey(),
  studentName: text('student_name').notNull(),
  studentEmail: text('student_email').notNull(),
  studentCpf: text('student_cpf').notNull(),
  studentPhone: text('student_phone'),
  courseId: integer('course_id').notNull(),
  courseName: text('course_name').notNull(),
  institutionId: integer('institution_id').notNull(),
  institutionName: text('institution_name').notNull(),
  poloId: integer('polo_id'),
  poloName: text('polo_name'),
  amount: doublePrecision('amount').notNull(),
  status: text('status').notNull().default('pending'),
  paymentId: text('payment_id'),
  paymentLinkId: text('payment_link_id'),
  paymentLinkUrl: text('payment_link_url'),
  asaasCustomerId: text('asaas_customer_id'),
  externalReference: text('external_reference'),
  sourceChannel: text('source_channel'),
  errorDetails: text('error_details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdById: integer('created_by_id'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedById: integer('updated_by_id')
});
