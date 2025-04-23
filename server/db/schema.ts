
import { pgTable, serial, text, timestamp, integer, boolean, doublePrecision, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Tabelas de permissões
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').notNull(),
  resource: text('resource').notNull(),
  action: text('action').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const rolePermissions = pgTable('role_permissions', {
  roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: integer('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.roleId, t.permissionId] }),
}));

export const userRoles = pgTable('user_roles', {
  userId: integer('user_id').notNull(),
  roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.roleId] }),
}));

// Relações para as tabelas de permissões
export const rolesRelations = relations(roles, ({ many }) => ({
  permissions: many(rolePermissions)
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  roles: many(rolePermissions)
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id]
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id]
  })
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id]
  })
}));

// Disciplinas
export const disciplines = pgTable('disciplines', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  workload: integer('workload'),
  syllabus: text('syllabus'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Alias para backward compatibility
export const disciplineTable = disciplines;

// Simplified Enrollments schema
export const simplifiedEnrollments = pgTable('simplified_enrollments', {
  id: serial('id').primaryKey(),
  studentName: text('student_name').notNull(),
  studentEmail: text('student_email').notNull(),
  studentCpf: text('student_cpf').notNull(),
  studentPhone: text('student_phone'),
  courseId: integer('course_id').notNull(),
  institutionId: integer('institution_id').notNull(),
  poloId: integer('polo_id'),
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
  updatedById: integer('updated_by_id'),
  // Campos adicionais que existem no banco de dados
  paymentGateway: text('payment_gateway'),
  enrollmentId: integer('enrollment_id'),
  financialPlanId: integer('financial_plan_id'),
  expiresAt: timestamp('expires_at'),
  paymentDueDate: timestamp('payment_due_date'),
  paymentUrl: text('payment_url'),
  metadata: text('metadata'),
  processedAt: timestamp('processed_at'),
  processedById: integer('processed_by_id'),
  convertedEnrollmentId: integer('converted_enrollment_id'),
  accessGrantedAt: timestamp('access_granted_at'),
  paymentConfirmedAt: timestamp('payment_confirmed_at'),
  blockScheduledAt: timestamp('block_scheduled_at'),
  blockExecutedAt: timestamp('block_executed_at'),
  cancellationScheduledAt: timestamp('cancellation_scheduled_at'),
  cancellationExecutedAt: timestamp('cancellation_executed_at'),
  webhookData: text('webhook_data')
});
