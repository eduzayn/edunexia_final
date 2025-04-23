import { Request, Response, NextFunction } from 'express';

// Middleware para verificar se o usuário está autenticado
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  // Verificar o token no header de Authorization
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"
  
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Você precisa estar autenticado para acessar este recurso.' 
    });
  }
  
  next();
}

// Middleware para verificar se o usuário tem permissão de admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Você precisa estar autenticado para acessar este recurso.' 
    });
  }
  
  const user = req.user as any;
  if (user.portalType !== 'admin' && user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Você não tem permissão para acessar este recurso.' 
    });
  }
  
  next();
}