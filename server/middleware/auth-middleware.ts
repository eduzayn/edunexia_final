import { Request, Response, NextFunction } from 'express';

// Importar a variável activeUsers do arquivo routes.ts
import { getActiveUserByToken } from '../shared/active-users';

// Middleware para verificar se o usuário está autenticado
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  // Verificar o token no header de Authorization
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Você precisa estar autenticado para acessar este recurso.' 
    });
  }
  
  // Obter usuário pelo token
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
}

// Middleware para verificar se o usuário tem permissão de admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  // Verificar o token no header de Authorization
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Você precisa estar autenticado para acessar este recurso.' 
    });
  }
  
  // Obter usuário pelo token
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
}