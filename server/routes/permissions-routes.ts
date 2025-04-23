import express from 'express';
import {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  listPermissions,
  getUserPermissions,
  listInstitutionPhaseRules,
  listPaymentStatusRules,
  listPeriodRules
} from '../controllers/permissions-controller';
import { isAuthenticated } from '../middleware/auth-middleware';

const router = express.Router();

// Rotas para gerenciamento de funções
router.get('/roles', isAuthenticated, listRoles);
router.get('/roles/:id', isAuthenticated, getRole);
router.post('/roles', isAuthenticated, createRole);
router.put('/roles/:id', isAuthenticated, updateRole);
router.delete('/roles/:id', isAuthenticated, deleteRole);

// Rotas para listar permissões
router.get('/list', isAuthenticated, listPermissions);
router.get('/user', isAuthenticated, getUserPermissions);

// Rotas para ABAC (Attribute-Based Access Control)
router.get('/abac/institution-phase', isAuthenticated, listInstitutionPhaseRules);
router.get('/abac/payment-status', isAuthenticated, listPaymentStatusRules);
router.get('/abac/period-rules', isAuthenticated, listPeriodRules);

export default router;