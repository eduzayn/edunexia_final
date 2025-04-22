/**
 * Rotas de autenticação
 * 
 * IMPORTANTE: Todas as rotas neste arquivo estão prefixadas com '/api-json/'
 * em vez de '/api/' para evitar a interceptação pelo middleware do Vite.
 */

import { Router } from 'express';
import passport from 'passport';
import { storage } from '../storage';

const router = Router();

// Rota de login
router.post('/login', (req, res, next) => {
  // Certifica-se de que o conteúdo seja tratado como JSON
  res.setHeader('Content-Type', 'application/json');
  
  passport.authenticate("local", async (err: any, user: Express.User | false, info: any) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Logs para debug
    console.log("Autenticação bem-sucedida para usuário:", user.username);
    console.log("Portal type atual:", user.portalType);
    console.log("Portal type solicitado:", req.body.portalType);
    
    // Sempre atualizar o portalType no banco de dados
    try {
      await storage.updateUser(user.id, { portalType: req.body.portalType });
      
      // Atualizar o objeto do usuário para a sessão
      user.portalType = req.body.portalType;
      
      console.log("Portal type atualizado para:", user.portalType);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error("Erro ao atualizar portalType:", errorMessage);
    }

    // Consultar o usuário atualizado do banco para garantir
    try {
      const updatedUser = await storage.getUser(user.id);
      console.log("Usuário atualizado do banco:", updatedUser);
      
      // Verificar se o usuário existe antes de fazer login
      if (updatedUser) {
        // Usar o usuário atualizado na sessão
        req.login(updatedUser, (err) => {
          if (err) return next(err);
          // Evitar enviar todos os dados do usuário, especialmente a senha
          const safeUser = { ...updatedUser, password: undefined };
          // Forçar formato JSON e especificar o cabeçalho explicitamente
          res.setHeader('Content-Type', 'application/json');
          return res.status(200).send(JSON.stringify(safeUser));
        });
      } else {
        // Se o usuário não for encontrado (improvável), use o original
        req.login(user, (err) => {
          if (err) return next(err);
          // Evitar enviar todos os dados do usuário, especialmente a senha
          const safeUser = { ...user, password: undefined };
          // Forçar formato JSON e especificar o cabeçalho explicitamente
          res.setHeader('Content-Type', 'application/json');
          return res.status(200).send(JSON.stringify(safeUser));
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error("Erro ao buscar usuário atualizado:", errorMessage);
      
      // Fallback para o usuário original caso haja erro
      req.login(user, (err) => {
        if (err) return next(err);
        // Evitar enviar todos os dados do usuário, especialmente a senha
        const safeUser = { ...user, password: undefined };
        // Forçar formato JSON e especificar o cabeçalho explicitamente
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(JSON.stringify(safeUser));
      });
    }
  })(req, res, next);
});

// Rota de logout
router.post('/logout', (req, res, next) => {
  // Garantir que a resposta seja JSON
  res.setHeader('Content-Type', 'application/json');
  
  req.logout((err) => {
    if (err) return next(err);
    res.status(200).send(JSON.stringify({ success: true, message: "Logout successful" }));
  });
});

// Rota para obter o usuário atual
router.get('/user', (req, res) => {
  // Sempre definir o cabeçalho content-type para application/json
  res.setHeader('Content-Type', 'application/json');
  
  if (!req.isAuthenticated()) {
    return res.status(401).send(JSON.stringify({ message: "Unauthorized" }));
  }
  
  // Remover a senha antes de enviar
  const safeUser = { ...req.user, password: undefined };
  return res.status(200).send(JSON.stringify(safeUser));
});

export default router;