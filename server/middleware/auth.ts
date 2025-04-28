import { Request, Response, NextFunction } from 'express';
import { getActiveUserByToken } from '../shared/active-users';

/**
 * Middleware para verificar e extrair token JWT de autenticação
 * Atribui req.user com os dados do usuário autenticado sem bloquear a requisição
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

// Middleware para verificar autenticação
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
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
    userRole: user.role || user.portalType
  };
  next();
};

// Middleware para verificar permissão de administrador
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
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
    userRole: user.role || user.portalType
  };
  next();
};

// Middleware para verificar permissão de parceiro
export const requirePartner = (req: Request, res: Response, next: NextFunction) => {
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

  if (user.portalType !== 'partner' && user.portalType !== 'admin' && user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Este recurso é exclusivo para parceiros.' 
    });
  }

  // Adicionar usuário e informações de autenticação ao request
  (req as any).user = user;
  (req as any).auth = { 
    userId: user.id,
    userRole: user.role || user.portalType
  };
  next();
};

// Alias para requireAuth (para compatibilidade com código existente)
export const isAuthenticated = requireAuth;

// Middleware para verificar permissão de estudante
export const requireStudent = (req: Request, res: Response, next: NextFunction) => {
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

  if (user.portalType !== 'student' && user.portalType !== 'admin' && user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Este recurso é exclusivo para alunos.' 
    });
  }

  // Adicionar usuário e informações de autenticação ao request
  (req as any).user = user;
  (req as any).auth = { 
    userId: user.id,
    userRole: user.role || user.portalType
  };
  next();
};