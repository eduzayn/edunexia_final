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

export async function registerRoutes(app: Express): Promise<Server> {
  const server = http.createServer(app);

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

  return server;
}
