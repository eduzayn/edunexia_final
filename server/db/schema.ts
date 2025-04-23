
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
