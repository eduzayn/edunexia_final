/**
 * Rotas de autenticação
 * 
 * IMPORTANTE: Todas as rotas neste arquivo estão prefixadas com '/api-json/'
 * em vez de '/api/' para evitar a interceptação pelo middleware do Vite.
 */

import { Router } from 'express';
import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

const router = Router();

/**
 * Rota de login
 * 
 * Verifica as credenciais do usuário e, se válidas, estabelece uma sessão.
 * Também atualiza o portalType do usuário conforme solicitado no corpo da requisição.
 */
router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  // Definir o tipo de conteúdo como JSON
  res.setHeader('Content-Type', 'application/json');
  
  console.log("Processando login para usuário:", req.body.username);
  
  passport.authenticate('local', async (err: Error | null, user: Express.User | false, info: any) => {
    if (err) {
      console.error("Erro durante autenticação:", err);
      return next(err);
    }
    
    if (!user) {
      console.log("Credenciais inválidas para usuário:", req.body.username);
      return res.status(401).json({ 
        success: false,
        message: "Credenciais inválidas. Verifique seu nome de usuário e senha."
      });
    }
    
    // Logs para debug
    console.log("Autenticação bem-sucedida para usuário:", user.username);
    console.log("Portal type atual:", user.portalType);
    console.log("Portal type solicitado:", req.body.portalType);
    
    // Atualizar o portalType no banco de dados se necessário
    if (req.body.portalType && user.portalType !== req.body.portalType) {
      try {
        await storage.updateUser(user.id, { portalType: req.body.portalType });
        
        // Atualizar o objeto do usuário na memória
        user.portalType = req.body.portalType;
        console.log("Portal type atualizado para:", user.portalType);
      } catch (error) {
        console.error("Erro ao atualizar portalType:", error);
        // Continuar mesmo com erro de atualização do portalType
      }
    }
    
    // Estabelecer a sessão
    req.login(user, (err) => {
      if (err) {
        console.error("Erro ao estabelecer sessão:", err);
        return next(err);
      }
      
      // Não expor a senha do usuário na resposta
      const safeUser = { ...user, password: undefined };
      return res.status(200).json(safeUser);
    });
  })(req, res, next);
});

/**
 * Rota de logout
 * 
 * Encerra a sessão do usuário atual.
 */
router.post('/logout', (req: Request, res: Response, next: NextFunction) => {
  // Definir o tipo de conteúdo como JSON
  res.setHeader('Content-Type', 'application/json');
  
  console.log("Processando logout para usuário:", req.user?.username);
  
  req.logout((err) => {
    if (err) {
      console.error("Erro durante logout:", err);
      return next(err);
    }
    
    res.status(200).json({ 
      success: true, 
      message: "Logout realizado com sucesso" 
    });
  });
});

/**
 * Rota para obter o usuário atual
 * 
 * Retorna os dados do usuário autenticado atualmente.
 */
router.get('/user', (req: Request, res: Response) => {
  // Definir o tipo de conteúdo como JSON
  res.setHeader('Content-Type', 'application/json');
  
  console.log("Verificando usuário atual na sessão");
  
  if (!req.isAuthenticated()) {
    console.log("Nenhum usuário autenticado na sessão");
    return res.status(401).json({ 
      success: false, 
      message: "Usuário não autenticado" 
    });
  }
  
  // O usuário está disponível em req.user devido ao passport
  console.log("Usuário autenticado encontrado:", req.user?.username);
  
  // Não expor a senha do usuário na resposta
  const safeUser = { ...req.user, password: undefined };
  return res.status(200).json(safeUser);
});

export default router;