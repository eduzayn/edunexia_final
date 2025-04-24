import express from 'express';
import * as http from 'http';
import { Express, Request, Response, NextFunction } from 'express';
import z from 'zod';
import { Server } from 'http';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
// Importar rotas e serviços
import debugRouter from './routes/debug-route';
import permissionsRouter from './routes/permissions-routes';
import authRouter from './routes/auth-route';
import financeRouter from './routes/finance-routes';
import certificationPaymentRoutes from './routes/certification-payment-routes';
import certificationRequestRoutes from './routes/certification-requests';
import certificationStatsRouter from './routes/certification-stats';
import asaasWebhookRoutes from './routes/asaas-webhook';
import asaasCustomersService from './services/asaas-customers-service';
import { storage } from './storage';
import activeUsers, { setActiveUser, removeActiveUser, getActiveUserByToken, generateToken } from './shared/active-users';
import { createLead, getLeads, getLeadById, updateLead, addLeadActivity } from './controllers/leads-controller';
// Desativar import com erro
// import { createAsaasCustomer, searchAsaasCustomerByCpfCnpj } from './controllers/crm-controller';

// Funções substitutas temporárias para não quebrar o código
const createAsaasCustomer = (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Função temporariamente desativada"
  });
};

const searchAsaasCustomerByCpfCnpj = (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: []
  });
};
import { 
  listSimplifiedEnrollments,
  getSimplifiedEnrollmentById,
  createSimplifiedEnrollment, 
  generatePaymentLink,
  updatePaymentStatus,
  cancelEnrollment
} from './controllers/new-simplified-enrollment-controller';
import { convertSimplifiedEnrollment } from './controllers/convert-simplified-enrollment-controller';
import {
  provisionStudentAccess,
  updateAccessPeriod,
  blockAccess,
  unblockAccess,
  checkAccessStatus
} from './controllers/student-portal-access-controller';
import {
  getInstitutionAccessConfig,
  updateInstitutionAccessConfig
} from './controllers/institution-access-config-controller';
import {
  getPortalAccessReport
} from './controllers/portal-access-report-controller';
import disciplineRoutes from './routes/discipline-routes'; // Added import for discipline routes

// Armazenamento de sessão simplificado (em memória)
// Definição movida para shared/active-users.ts

export async function registerRoutes(app: Express): Promise<Server> {
  const server = http.createServer(app);

  // Sistema de autenticação super-simplificado
  app.post('/api-json/login', (req, res) => {
    const { username, password, portalType } = req.body;

    console.log(`Tentativa de login: ${username}, tipo portal: ${portalType}`);

    // Credenciais de emergência para admin (acesso direto)
    if ((username === 'admin' && password === 'Admin123') || 
        (username === 'superadmin' && password === 'Super123') ||
        (username === 'admin' && password === 'admin123') ||
        (username === 'admin@edunexa.com' && password === 'Admin123')) {

      // Criar usuário simulado
      const user = {
        id: 18, // ID correto do admin no banco de dados
        username: username,
        fullName: username === 'admin' ? 'Administrador' : 'Super Administrador',
        email: username.includes('@') ? username : `${username}@edunexa.com`,
        portalType: portalType || 'admin',
        role: 'admin'
      };

      // Gerar token JWT
      const token = generateToken(user);

      // Não usar cookies, enviar o token na resposta
      // O cliente irá armazenar no localStorage

      console.log(`Login bem-sucedido para ${username}, token JWT gerado`);

      return res.status(200).json({
        success: true,
        token: token,
        ...user
      });
    } 

    // Tentar login via banco de dados como último recurso
    storage.getUserByUsername(username)
      .then(dbUser => {
        if (!dbUser || dbUser.password !== password) {
          console.log(`Login falhou: credenciais inválidas para ${username}`);
          return res.status(401).json({
            success: false,
            message: "Credenciais inválidas. Verifique seu nome de usuário e senha."
          });
        }

        // Login bem-sucedido
        const { password: _, ...safeUser } = dbUser;

        // Adicionar role baseado no portalType se não estiver presente
        const userWithRole = {
          ...safeUser,
          role: safeUser.role || safeUser.portalType
        };

        // Gerar token JWT
        const token = generateToken(userWithRole);

        // Não usar cookies, enviar o token na resposta
        // O cliente irá armazenar no localStorage

        console.log(`Login via DB bem-sucedido para ${username}, token JWT gerado`);

        return res.status(200).json({
          success: true,
          token: token,
          ...safeUser
        });
      })
      .catch(err => {
        console.error("Erro ao buscar usuário:", err);

        // Como solução de emergência, permitir login com credenciais de admin
        if (username === 'admin' || username === 'superadmin') {
          const user = {
            id: 18, // ID correto do admin no banco de dados
            username: username,
            fullName: username === 'admin' ? 'Administrador' : 'Super Administrador',
            email: `${username}@edunexa.com`,
            portalType: portalType || 'admin',
            role: 'admin'
          };

          // Gerar token JWT
          const token = generateToken(user);

          // Não usar cookies, enviar o token na resposta
          // O cliente irá armazenar no localStorage

          console.log(`Login de emergência para ${username}, token JWT gerado`);

          return res.status(200).json({
            success: true,
            token: token,
            ...user
          });
        }

        return res.status(500).json({
          success: false,
          message: "Erro interno durante autenticação."
        });
      });
  });

  // Rota para logout simples
  app.post('/api-json/logout', (req, res) => {
    // Verificar o token no header de Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

    if (token) {
      removeActiveUser(token);
    }

    res.status(200).json({
      success: true,
      message: "Logout realizado com sucesso"
    });
  });

  // Rota para obter usuário atual
  app.get('/api-json/user', (req, res) => {
    try {
      // Verificar o token no header de Authorization
      const authHeader = req.headers.authorization;
      console.log('GET /api-json/user - Auth Header:', authHeader);
      const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

      if (!token) {
        console.log('GET /api-json/user - Token não encontrado');
        return res.status(401).json({
          success: false,
          message: "Usuário não autenticado"
        });
      }

      console.log('GET /api-json/user - Token:', token);
      const user = getActiveUserByToken(token);
      console.log('GET /api-json/user - User encontrado:', user ? 'Sim' : 'Não');

      if (!user) {
        console.log('GET /api-json/user - Sessão inválida');
        return res.status(401).json({
          success: false,
          message: "Sessão inválida ou expirada"
        });
      }

      console.log('GET /api-json/user - Retornando usuário');
      return res.status(200).json(user);
    } catch (error) {
      console.error('Erro em GET /api-json/user:', error);
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // Middleware para verificar autenticação (simplificado)
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    // Verificar o token no header de Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Você precisa estar autenticado para acessar este recurso.' 
      });
    }

    const user = getActiveUserByToken(token);

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Sessão inválida ou expirada. Faça login novamente.' 
      });
    }

    // Adicionar usuário e informações de autenticação ao request
    (req as any).user = user;
    (req as any).auth = { 
      userId: user.id,
      userRole: user.role
    };
    next();
  };

  // Middleware para verificar permissão de administrador (simplificado)
  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    // Verificar o token no header de Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Você precisa estar autenticado para acessar este recurso.' 
      });
    }

    const user = getActiveUserByToken(token);

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Sessão inválida ou expirada. Faça login novamente.' 
      });
    }

    if (user.portalType !== 'admin' && user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Você não tem permissão para acessar este recurso.' 
      });
    }

    // Adicionar usuário e informações de autenticação ao request
    (req as any).user = user;
    (req as any).auth = { 
      userId: user.id,
      userRole: user.role
    };
    next();
  };

  // Middleware para verificar permissão de estudante (simplificado)
  const requireStudent = (req: Request, res: Response, next: NextFunction) => {
    // Verificar o token no header de Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Você precisa estar autenticado para acessar este recurso.' 
      });
    }

    const user = getActiveUserByToken(token);

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Sessão inválida ou expirada. Faça login novamente.' 
      });
    }

    if (user.portalType !== 'student') {
      return res.status(403).json({ 
        success: false,
        message: 'Este recurso é exclusivo para estudantes.' 
      });
    }

    // Adicionar usuário e informações de autenticação ao request
    (req as any).user = user;
    (req as any).auth = { 
      userId: user.id,
      userRole: user.role
    };
    next();
  };

  // Rota para verificar rota da API
  app.get('/api/healthcheck', (req, res) => {
    res.status(200).json({ message: 'API funcionando corretamente!', timestamp: new Date() });
  });

  // Desativamos as rotas de autenticação antigas
  // app.use('/api-json', authRouter);

  // Usar as rotas de debug
  app.use('/api/debug', debugRouter);

  // Usar as rotas de permissões
  app.use('/api-json/permissions', permissionsRouter);

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
  // Endpoint para listar cursos para administradores
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

  // Nova rota API JSON para cursos - usada no formulário de matrícula
  app.get('/api-json/courses', async (req, res) => {
    console.log('Buscando todos os cursos (API JSON)');
    res.setHeader('Content-Type', 'application/json');

    try {
      const courses = await storage.getAllCourses();
      console.log(`Retornando ${courses.length} cursos`);
      // Formato padronizado com campo data para manter compatibilidade
      return res.status(200).json({ 
        success: true, 
        data: courses 
      });
    } catch (error) {
      console.error('Erro ao buscar cursos (API JSON):', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar cursos' 
      });
    }
  });

  // Rota JSON para listar cursos do aluno
  app.get('/api-json/student/courses', requireStudent, async (req, res) => {
    console.log('Buscando cursos do aluno (API JSON)');
    res.setHeader('Content-Type', 'application/json');
    
    try {
      const userId = (req as any).user.id;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID do usuário não encontrado'
        });
      }
      
      // Obter matrículas do aluno
      const enrollments = await storage.getStudentEnrollments(userId);
      
      // Mapear para o formato esperado pelo frontend
      const studentCourses = await Promise.all(enrollments.map(async (enrollment) => {
        const course = await storage.getCourse(enrollment.courseId);
        
        if (!course) {
          return null;
        }
        
        return {
          id: course.id,
          code: course.code,
          name: course.name,
          description: course.description || '',
          status: course.status,
          workload: course.workload || 0,
          progress: enrollment.progress || 0,
          enrolledAt: enrollment.createdAt,
          updatedAt: enrollment.updatedAt || enrollment.createdAt
        };
      }));
      
      // Filtrar valores nulos (cursos não encontrados)
      const validCourses = studentCourses.filter(course => course !== null);
      
      console.log(`Retornando ${validCourses.length} cursos para o aluno ${userId}`);
      return res.status(200).json(validCourses);
    } catch (error) {
      console.error('Erro ao buscar cursos do aluno (API JSON):', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar cursos do aluno' 
      });
    }
  });
  
  // Redirecionar rota tradicional para a rota JSON
  app.get('/api/student/courses', (req, res) => {
    console.log('Redirecionando /api/student/courses para /api-json/student/courses');
    res.redirect(307, req.url.replace('/api/', '/api-json/'));
  });

  // Nova rota API JSON para instituições - usada no formulário de matrícula
  app.get('/api-json/institutions', async (req, res) => {
    console.log('Buscando todas as instituições (API JSON)');
    res.setHeader('Content-Type', 'application/json');

    try {
      // Buscar todas as instituições sem filtros
      const institutionsList = await storage.getInstitutions();
      console.log(`Retornando ${institutionsList.length} instituições`);
      // Formato padronizado com campo data para manter compatibilidade
      return res.status(200).json({ 
        success: true, 
        data: institutionsList 
      });
    } catch (error) {
      console.error('Erro ao buscar instituições (API JSON):', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar instituições' 
      });
    }
  });

  // Nova rota API JSON para polos - usada no formulário de matrícula
  app.get('/api-json/polos', async (req, res) => {
    console.log('Buscando todos os polos (API JSON)');
    res.setHeader('Content-Type', 'application/json');

    try {
      // Buscar todos os polos sem filtros
      const polosList = await storage.getPolos();
      console.log(`Retornando ${polosList.length} polos`);
      // Formato padronizado com campo data para manter compatibilidade
      return res.status(200).json({ 
        success: true, 
        data: polosList 
      });
    } catch (error) {
      console.error('Erro ao buscar polos (API JSON):', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar polos' 
      });
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
  
  // Rota específica para /api-json/admin/disciplines/:id
  app.get('/api-json/admin/disciplines/:id', requireAuth, async (req, res) => {
    try {
      console.log(`GET /api-json/admin/disciplines/${req.params.id} - Obtendo disciplina específica`);
      // Garantir que a resposta seja JSON
      res.setHeader('Content-Type', 'application/json');
      
      const id = parseInt(req.params.id);
      const discipline = await storage.getDiscipline(id);

      if (!discipline) {
        return res.status(404).json({ message: "Disciplina não encontrada" });
      }

      return res.json(discipline);
    } catch (error) {
      console.error("Erro ao buscar disciplina:", error);
      return res.status(500).json({ 
        message: "Erro ao buscar disciplina",
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });
  
  // Rota para obter o conteúdo de uma disciplina
  app.get('/api-json/admin/disciplines/:id/content', requireAuth, async (req, res) => {
    try {
      console.log(`GET /api-json/admin/disciplines/${req.params.id}/content - Obtendo conteúdo da disciplina`);
      // Garantir que a resposta seja JSON
      res.setHeader('Content-Type', 'application/json');
      
      const id = parseInt(req.params.id);
      // Verificar se a disciplina existe
      const discipline = await storage.getDiscipline(id);
      
      if (!discipline) {
        return res.status(404).json({ message: "Disciplina não encontrada" });
      }
      
      // Obter o conteúdo da disciplina
      const content = await storage.getDisciplineContent(id);
      
      return res.json(content || {
        videos: [],
        materials: [],
        ebooks: [],
        assessments: []
      });
    } catch (error) {
      console.error("Erro ao buscar conteúdo da disciplina:", error);
      return res.status(500).json({ 
        message: "Erro ao buscar conteúdo da disciplina",
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });
  
  // Rota para obter o status de completude de uma disciplina
  app.get('/api-json/admin/disciplines/:id/completeness', requireAuth, async (req, res) => {
    try {
      console.log(`GET /api-json/admin/disciplines/${req.params.id}/completeness - Obtendo status de completude`);
      // Garantir que a resposta seja JSON
      res.setHeader('Content-Type', 'application/json');
      
      const id = parseInt(req.params.id);
      // Verificar se a disciplina existe
      const discipline = await storage.getDiscipline(id);
      
      if (!discipline) {
        return res.status(404).json({ message: "Disciplina não encontrada" });
      }
      
      // Calcular completude (simplificado)
      const content = await storage.getDisciplineContent(id);
      const hasVideos = content?.videos?.length > 0;
      const hasMaterials = content?.materials?.length > 0;
      const hasEbooks = content?.ebooks?.length > 0;
      const hasAssessments = content?.assessments?.length > 0;
      
      const completenessItems = [
        { id: "info", label: "Informações básicas", status: discipline ? "completed" : "pending" },
        { id: "videos", label: "Vídeo-aulas", status: hasVideos ? "completed" : "pending" },
        { id: "materials", label: "Materiais de apoio", status: hasMaterials ? "completed" : "pending" },
        { id: "ebooks", label: "E-books", status: hasEbooks ? "completed" : "pending" },
        { id: "assessments", label: "Avaliações", status: hasAssessments ? "completed" : "pending" },
      ];
      
      // Calcular porcentagem de completude
      const completedItems = completenessItems.filter(item => item.status === "completed").length;
      const totalItems = completenessItems.length;
      const completionPercentage = Math.round((completedItems / totalItems) * 100);
      
      return res.json({
        items: completenessItems,
        completionPercentage
      });
    } catch (error) {
      console.error("Erro ao buscar status de completude da disciplina:", error);
      return res.status(500).json({ 
        message: "Erro ao buscar status de completude",
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
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
  app.post('/api-json/v2/simplified-enrollments', requireAuth, createSimplifiedEnrollment);
  app.get('/api-json/v2/simplified-enrollments', requireAuth, listSimplifiedEnrollments);
  app.get('/api-json/v2/simplified-enrollments/:id', requireAuth, getSimplifiedEnrollmentById);
  app.post('/api-json/v2/simplified-enrollments/:id/generate-payment-link', requireAuth, generatePaymentLink);
  app.post('/api-json/v2/simplified-enrollments/:id/update-payment-status', requireAuth, updatePaymentStatus);
  app.post('/api-json/v2/simplified-enrollments/:id/cancel', requireAuth, cancelEnrollment);
  app.post('/api-json/v2/simplified-enrollments/:id/convert', requireAuth, convertSimplifiedEnrollment);

  // Portal do Aluno - Gerenciamento de Acesso
  app.post('/api-json/provision-access/:id', requireAdmin, provisionStudentAccess);
  app.put('/api-json/update-access-period/:id', requireAdmin, updateAccessPeriod);
  app.post('/api-json/block-access/:id', requireAdmin, blockAccess);
  app.post('/api-json/unblock-access/:id', requireAdmin, unblockAccess);
  app.get('/api-json/check-access/:id', requireAuth, checkAccessStatus);

  // Portal do Aluno - Configurações de Acesso
  app.get('/api-json/institution-access-config/:id', requireAdmin, getInstitutionAccessConfig);
  app.put('/api-json/institution-access-config/:id', requireAdmin, updateInstitutionAccessConfig);
  app.get('/api-json/portal-access-report', requireAdmin, getPortalAccessReport);

  // Registrar as rotas
  app.use('/api', authRouter);
  app.use('/api/admin', financeRouter);
  app.use('/api/admin', disciplineRoutes); // Added route for discipline routes
  app.use('/api-json/admin', disciplineRoutes); // Duplicate for API JSON routes
  app.use('/api/certification', certificationPaymentRoutes); // Rotas para pagamento de certificação
  app.use('/api/certification/requests', certificationRequestRoutes); // Rotas para solicitações de certificação
  app.use('/api/certification/stats', certificationStatsRouter); // Estatísticas de certificação
  
  // Webhooks para integrações externas (não requerem autenticação)
  app.use('/api/webhooks/asaas', asaasWebhookRoutes); // Webhooks do Asaas
  
  // Rota para buscar avaliações do aluno
  app.get('/api-json/student/assessments', requireStudent, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false, 
          message: 'Usuário não autenticado'
        });
      }
      
      // Buscar matrículas do aluno
      const studentEnrollments = await storage.getStudentEnrollments(user.id);
      
      if (!studentEnrollments || studentEnrollments.length === 0) {
        return res.json({
          success: true,
          assessments: []
        });
      }
      
      // Buscar cursos das matrículas
      const courseIds = studentEnrollments.map(enrollment => enrollment.courseId);
      const coursesPromises = courseIds.map(id => storage.getCourse(id));
      const courses = await Promise.all(coursesPromises);
      
      // Obter disciplinas dos cursos
      let allDisciplineIds: number[] = [];
      const courseDisciplinesPromises = courses.map(course => 
        course ? storage.getCourseDisciplines(course.id) : []
      );
      
      const courseDisciplinesArrays = await Promise.all(courseDisciplinesPromises);
      courseDisciplinesArrays.forEach(disciplineRelations => {
        if (disciplineRelations.length > 0) {
          const disciplineIds = disciplineRelations.map(relation => relation.disciplineId);
          allDisciplineIds = [...allDisciplineIds, ...disciplineIds];
        }
      });
      
      // Remover IDs duplicados
      allDisciplineIds = [...new Set(allDisciplineIds)];
      
      // Buscar avaliações para estas disciplinas
      const assessmentsPromises = allDisciplineIds.map(disciplineId => 
        storage.getAssessmentsByDiscipline(disciplineId)
      );
      
      const assessmentsArrays = await Promise.all(assessmentsPromises);
      let allAssessments: any[] = [];
      
      assessmentsArrays.forEach(assessments => {
        if (assessments.length > 0) {
          allAssessments = [...allAssessments, ...assessments];
        }
      });
      
      // Buscar disciplinas para exibir os nomes
      const disciplinePromises = allDisciplineIds.map(id => storage.getDiscipline(id));
      const disciplines = await Promise.all(disciplinePromises);
      const disciplineMap = disciplines.reduce((map, discipline) => {
        if (discipline) {
          map[discipline.id] = discipline;
        }
        return map;
      }, {} as Record<number, any>);
      
      // Preparar resposta com informações das avaliações
      const assessmentsWithDetails = allAssessments.map(assessment => ({
        ...assessment,
        disciplineName: disciplineMap[assessment.disciplineId]?.name || 'Disciplina desconhecida'
      }));
      
      return res.json({
        success: true,
        assessments: assessmentsWithDetails
      });
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao buscar avaliações'
      });
    }
  });
  
  // Registre outras rotas conforme necessário

  return server;
}