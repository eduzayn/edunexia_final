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
// import { setupAuth } from './auth';
// import { setupEmergencyAuth } from './dev-auth';
import { setupSimpleAuth } from './dev-simple-auth';
import { storage } from './storage';
import { createLead, getLeads, getLeadById, updateLead, addLeadActivity } from './controllers/leads-controller';
import { createAsaasCustomer, searchAsaasCustomerByCpfCnpj } from './controllers/crm-controller';
import { 
  listSimplifiedEnrollments,
  getSimplifiedEnrollmentById,
  createSimplifiedEnrollment, 
  generatePaymentLink,
  updatePaymentStatus,
  cancelEnrollment
} from './controllers/new-simplified-enrollment-controller';

export async function registerRoutes(app: Express): Promise<Server> {
  const server = http.createServer(app);

  // Configurar autenticação simplificada em vez da autenticação normal
  // setupAuth(app);
  // setupEmergencyAuth(app);
  setupSimpleAuth(app);

  // ======= MODO DE EMERGÊNCIA =======
  // Estes middlewares são simplificados para situações de emergência
  // e permitem acesso sem verificação rigorosa
  
  // Middleware para verificar autenticação - MODO DE EMERGÊNCIA
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    console.log('🔥 MODO DE EMERGÊNCIA: Permitindo acesso aos recursos protegidos');
    
    // Permitir acesso sem verificar autenticação
    if (!req.session || !req.session.user) {
      // MODO DE EMERGÊNCIA: Simular usuário admin para todas as requisições
      req.session = req.session || {} as any;
      req.session.user = { 
        id: 18, 
        username: 'admin', 
        portalType: 'admin',
        role: 'admin'
      };
      req.session.authenticated = true;
      req.user = req.session.user;
    }
    
    next();
  };

  // Middleware para verificar permissão de administrador - MODO DE EMERGÊNCIA
  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    console.log('🔥 MODO DE EMERGÊNCIA: Permitindo acesso admin aos recursos protegidos');
    
    // Permitir acesso sem verificar autenticação
    if (!req.session || !req.session.user) {
      // MODO DE EMERGÊNCIA: Simular usuário admin para todas as requisições
      req.session = req.session || {} as any;
      req.session.user = { 
        id: 18, 
        username: 'admin', 
        portalType: 'admin',
        role: 'admin'
      };
      req.session.authenticated = true;
      req.user = req.session.user;
    }
    
    next();
  };

  // Middleware para verificar permissão de estudante - MODO DE EMERGÊNCIA 
  const requireStudent = (req: Request, res: Response, next: NextFunction) => {
    console.log('🔥 MODO DE EMERGÊNCIA: Permitindo acesso estudante aos recursos protegidos');
    
    // Permitir acesso sem verificar autenticação
    if (!req.session || !req.session.user) {
      // MODO DE EMERGÊNCIA: Simular usuário estudante para todas as requisições
      req.session = req.session || {} as any;
      req.session.user = { 
        id: 99, 
        username: 'estudante', 
        portalType: 'student',
        role: 'student'
      };
      req.session.authenticated = true;
      req.user = req.session.user;
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
  
  // Adicionar redirecionamentos para endpoints acadêmicos
  app.get('/api/admin/courses', (req, res) => {
    console.log('Redirecionando /api/admin/courses para /api-json/admin/courses');
    // Garantir que a resposta seja JSON
    res.setHeader('Content-Type', 'application/json');
    
    try {
      // Consultar diretamente da base de dados
      storage.getAllCourses()
        .then(courses => {
          return res.status(200).json(courses);
        })
        .catch(error => {
          console.error('Erro ao buscar cursos:', error);
          return res.status(500).json({ error: 'Erro ao buscar cursos' });
        });
    } catch (error) {
      console.error('Erro ao processar requisição de cursos:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
  
  app.get('/api/admin/disciplines', (req, res) => {
    console.log('Redirecionando /api/admin/disciplines para /api-json/admin/disciplines');
    // Garantir que a resposta seja JSON
    res.setHeader('Content-Type', 'application/json');
    
    try {
      // Consultar diretamente da base de dados sem paginação
      storage.getDisciplines()
        .then(disciplines => {
          return res.status(200).json(disciplines);
        })
        .catch(error => {
          console.error('Erro ao buscar disciplinas:', error);
          return res.status(500).json({ error: 'Erro ao buscar disciplinas' });
        });
    } catch (error) {
      console.error('Erro ao processar requisição de disciplinas:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
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
  
  // Rota para buscar clientes do Asaas por nome (para o componente de autocompletar)
  app.get('/api-json/crm/asaas-customers-search', async (req, res) => {
    try {
      const { name } = req.query;
      
      if (!name || typeof name !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Nome de busca é obrigatório'
        });
      }
      
      const customers = await asaasCustomersService.searchCustomersByName(name);
      
      res.json({
        success: true,
        data: customers
      });
    } catch (error) {
      console.error('[API] Erro ao buscar clientes do Asaas por nome:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar clientes',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Matrículas Simplificadas
  app.post('/api/v2/simplified-enrollments', requireAuth, createSimplifiedEnrollment);
  app.get('/api/v2/simplified-enrollments', requireAuth, listSimplifiedEnrollments);
  app.get('/api/v2/simplified-enrollments/:id', requireAuth, getSimplifiedEnrollmentById);
  app.post('/api/v2/simplified-enrollments/:id/generate-payment-link', requireAuth, generatePaymentLink);
  app.post('/api/v2/simplified-enrollments/:id/update-payment-status', requireAuth, updatePaymentStatus);
  app.post('/api/v2/simplified-enrollments/:id/cancel', requireAuth, cancelEnrollment);

  return server;
}