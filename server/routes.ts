import express from 'express';
import * as http from 'http';
import { Express, Request, Response, NextFunction } from 'express';
import z from 'zod';
import { Server } from 'http';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
// Importar rotas e serviços
import debugRouter from './routes/debug-route';
import authRouter from './routes/auth-route';
import asaasCustomersService from './services/asaas-customers-service';
import { setupAuth } from './auth';
import { createLead, getLeads, getLeadById, updateLead, addLeadActivity } from './controllers/leads-controller';
import { createAsaasCustomer, searchAsaasCustomerByCpfCnpj } from './controllers/crm-controller';
import { NewSimplifiedEnrollmentController } from './controllers/new-simplified-enrollment-controller';

export async function registerRoutes(app: Express): Promise<Server> {
  const server = http.createServer(app);

  // Configurar autenticação
  setupAuth(app);

  // Middleware para verificar autenticação
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Você precisa estar autenticado para acessar este recurso.' });
    }
    next();
  };

  // Middleware para verificar permissão de administrador
  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Você precisa estar autenticado para acessar este recurso.' });
    }

    const user = req.user as any;
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Você não tem permissão para acessar este recurso.' });
    }

    next();
  };

  // Middleware para verificar permissão de estudante
  const requireStudent = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Você precisa estar autenticado para acessar este recurso.' });
    }

    const user = req.user as any;
    if (user.role !== 'student') {
      return res.status(403).json({ message: 'Este recurso é exclusivo para estudantes.' });
    }

    next();
  };

  // Rota para verificar rota da API
  app.get('/api/healthcheck', (req, res) => {
    res.status(200).json({ message: 'API funcionando corretamente!', timestamp: new Date() });
  });

  // Usar as rotas de autenticação com um prefixo especial para evitar a interceptação pelo Vite
  app.use('/api-json', authRouter);

  // Usar as rotas de debug
  app.use('/api/debug', debugRouter);
  
  // Adicionar redirecionamentos de compatibilidade para rotas de autenticação antigas
  app.post('/api/login', (req, res) => {
    console.log('Redirecionando /api/login para /api-json/login');
    // Garantir que a resposta seja JSON
    res.setHeader('Content-Type', 'application/json');
    
    // Redirecionar a requisição para o novo endpoint
    req.url = '/api-json/login';
    app._router.handle(req, res);
  });
  
  app.post('/api/logout', (req, res) => {
    console.log('Redirecionando /api/logout para /api-json/logout');
    // Garantir que a resposta seja JSON
    res.setHeader('Content-Type', 'application/json');
    
    // Redirecionar a requisição para o novo endpoint
    req.url = '/api-json/logout';
    app._router.handle(req, res);
  });
  
  app.get('/api/user', (req, res) => {
    console.log('Redirecionando /api/user para /api-json/user');
    // Garantir que a resposta seja JSON
    res.setHeader('Content-Type', 'application/json');
    
    // Redirecionar a requisição para o novo endpoint
    req.url = '/api-json/user';
    app._router.handle(req, res);
  });

  // Redirecionar rotas obsoletas para novos endpoints
  // - Antigos endpoints de clientes agora são redirecionados para a implementação do Asaas
  app.get('/api/admin/clients', (req, res) => {
    res.status(410).json({
      message: 'Este endpoint está obsoleto. Use /api/debug/asaas-customers no lugar.',
      redirectTo: '/api/debug/asaas-customers'
    });
  });

  app.post('/api/admin/clients', (req, res) => {
    res.status(410).json({
      message: 'Este endpoint está obsoleto. Use /api/debug/asaas-customers no lugar.',
      redirectTo: '/api/debug/asaas-customers'
    });
  });

  app.get('/api/admin/clients/:id', (req, res) => {
    const { id } = req.params;
    res.status(410).json({
      message: 'Este endpoint está obsoleto. Use /api/debug/asaas-customer/:id no lugar.',
      redirectTo: `/api/debug/asaas-customer/${id}`
    });
  });

  app.put('/api/admin/clients/:id', (req, res) => {
    res.status(410).json({
      message: 'Este endpoint está obsoleto. Use a API Asaas correspondente.',
      redirectTo: '/api/debug/asaas-customers'
    });
  });

  app.delete('/api/admin/clients/:id', (req, res) => {
    res.status(410).json({
      message: 'Este endpoint está obsoleto. Use a API Asaas correspondente.',
      redirectTo: '/api/debug/asaas-customers'
    });
  });

  // - Antigos endpoints de contatos agora são redirecionados para clientes do Asaas
  app.get('/api/admin/contacts', (req, res) => {
    res.status(410).json({
      message: 'Este endpoint está obsoleto. Use /api/debug/asaas-customers no lugar.',
      redirectTo: '/api/debug/asaas-customers'
    });
  });

  app.post('/api/admin/contacts', (req, res) => {
    res.status(410).json({
      message: 'Este endpoint está obsoleto. Use /api/debug/asaas-customers no lugar.',
      redirectTo: '/api/debug/asaas-customers'
    });
  });

  app.get('/api/admin/contacts/:id', (req, res) => {
    res.status(410).json({
      message: 'Este endpoint está obsoleto. Use a API Asaas correspondente.',
      redirectTo: '/api/debug/asaas-customers'
    });
  });

  app.put('/api/admin/contacts/:id', (req, res) => {
    res.status(410).json({
      message: 'Este endpoint está obsoleto. Use a API Asaas correspondente.',
      redirectTo: '/api/debug/asaas-customers'
    });
  });

  app.delete('/api/admin/contacts/:id', (req, res) => {
    res.status(410).json({
      message: 'Este endpoint está obsoleto. Use a API Asaas correspondente.',
      redirectTo: '/api/debug/asaas-customers'
    });
  });

  // Leads (sistema CRM) 
  app.post('/api/v2/leads', requireAuth, createLead);
  app.get('/api/v2/leads', requireAuth, getLeads);
  app.get('/api/v2/leads/:id', requireAuth, getLeadById);
  app.put('/api/v2/leads/:id', requireAuth, updateLead);
  app.post('/api/v2/leads/:leadId/activities', requireAuth, addLeadActivity);

  // Asaas CRM
  app.post('/api/v2/crm/asaas-customers', requireAuth, createAsaasCustomer);
  app.get('/api/v2/crm/search-customer-by-cpf', requireAuth, searchAsaasCustomerByCpfCnpj);

  // Matrículas Simplificadas
  app.post('/api/v2/simplified-enrollments', requireAuth, NewSimplifiedEnrollmentController.create);
  app.get('/api/v2/simplified-enrollments', requireAuth, NewSimplifiedEnrollmentController.getAll);
  app.get('/api/v2/simplified-enrollments/:id', requireAuth, NewSimplifiedEnrollmentController.getById);
  app.post('/api/v2/simplified-enrollments/:id/generate-payment-link', requireAuth, NewSimplifiedEnrollmentController.generatePaymentLink);
  app.post('/api/v2/simplified-enrollments/:id/update-payment-status', requireAuth, NewSimplifiedEnrollmentController.updatePaymentStatus);
  app.post('/api/v2/simplified-enrollments/:id/cancel', requireAuth, NewSimplifiedEnrollmentController.cancel);

  return server;
}