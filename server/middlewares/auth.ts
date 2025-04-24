import { Request, Response, NextFunction } from 'express';
import { getActiveUserByToken } from '../shared/active-users';

/**
 * Middleware para verificar e extrair token JWT de autenticação
 * Atribui req.user com os dados do usuário autenticado
 */
export const verifyAuthToken = (req: Request, res: Response, next: NextFunction) => {
  // Verificar o token no header de Authorization
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

  if (!token) {
    // Não definir erro ainda, pois algumas rotas podem não exigir autenticação
    next();
    return;
  }

  const user = getActiveUserByToken(token);

  if (user) {
    // Adicionar usuário ao request
    (req as any).user = user;
    (req as any).token = token;
  }

  next();
};

/**
 * Middleware para verificar se o usuário está autenticado
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Você precisa estar autenticado para acessar este recurso.'
    });
  }
  
  next();
};

/**
 * Middleware para verificar se o usuário é um administrador
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Você precisa estar autenticado para acessar este recurso.'
    });
  }

  if ((req.user as any).portalType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Você não tem permissão para acessar este recurso.'
    });
  }
  
  next();
};

/**
 * Middleware para verificar se o usuário é um estudante
 */
export const requireStudent = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Você precisa estar autenticado para acessar este recurso.'
    });
  }

  // Permitir também usuários admin para facilitar testes
  if ((req.user as any).portalType !== 'student' && (req.user as any).portalType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Este recurso é exclusivo para estudantes.'
    });
  }
  
  next();
};