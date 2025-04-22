/**
 * Rotas de autenticação
 * 
 * IMPORTANTE: Todas as rotas neste arquivo estão prefixadas com '/api-json/'
 * em vez de '/api/' para evitar a interceptação pelo middleware do Vite.
 */

import { Router } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from '../storage';
import { comparePasswords } from '../auth-utils';

// Configurar a estratégia local no mesmo arquivo para garantir que esteja disponível
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    } catch (error) {
      return done(error);
    }
  }),
);

const router = Router();

// Rota de login
// Rota para acesso administrativo direto removida

router.post('/login', (req, res, next) => {
  // Certifica-se de que o conteúdo seja tratado como JSON
  res.setHeader('Content-Type', 'application/json');
  
  // Verificar se estamos no modo de desenvolvimento
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment) {
    console.log("[DEV MODE] Login automático para desenvolvimento");
    
    // Simular login com dados de usuário para desenvolvimento
    // O portalType define o tipo de usuário que será retornado
    const portalType = req.body.portalType || 'admin';
    const mockUser: any = {
      id: 0,
      username: '',
      password: undefined,
      portalType: portalType,
      name: '',
      email: '',
      role: ''
    };
    
    if (portalType === 'admin') {
      mockUser.id = 1;
      mockUser.username = 'admin';
      mockUser.name = 'Admin Teste';
      mockUser.email = 'admin@edunexia.com';
      mockUser.role = 'admin';
    } else if (portalType === 'student') {
      mockUser.id = 2;
      mockUser.username = 'student';
      mockUser.name = 'Estudante Teste';
      mockUser.email = 'aluno@edunexia.com';
      mockUser.role = 'student';
    } else if (portalType === 'institution') {
      mockUser.id = 3;
      mockUser.username = 'institution';
      mockUser.name = 'Instituição Teste';
      mockUser.email = 'instituicao@edunexia.com';
      mockUser.role = 'institution';
    } else if (portalType === 'instructor') {
      mockUser.id = 4;
      mockUser.username = 'instructor';
      mockUser.name = 'Professor Teste';
      mockUser.email = 'professor@edunexia.com';
      mockUser.role = 'instructor';
    }
    
    console.log("[DEV MODE] Usuário simulado:", mockUser);
    
    // Serializa o usuário na sessão
    req.login(mockUser, (err) => {
      if (err) return next(err);
      return res.status(200).json(mockUser);
    });
    return;
  }
  
  // Comportamento normal de produção
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

// Middleware para verificar se o usuário está autenticado
const isAuthenticated = (req, res, next) => {
  // Verificamos se o usuário está autenticado usando a sessão
  if (req.session && req.session.passport && req.session.passport.user) {
    return next();
  }
  
  // Definir o cabeçalho como JSON
  res.setHeader('Content-Type', 'application/json');
  return res.status(401).send(JSON.stringify({ message: "Unauthorized" }));
};

// Rota para obter o usuário atual
router.get('/user', (req, res) => {
  // Sempre definir o cabeçalho content-type para application/json
  res.setHeader('Content-Type', 'application/json');
  
  // Verificar se estamos no modo de desenvolvimento
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment) {
    console.log("[DEV MODE] Retornando usuário simulado para /api-json/user");
    
    // Se houver um usuário na sessão, usamos ele
    if (req.session && req.session.passport && req.session.passport.user) {
      const userId = req.session.passport.user;
      
      storage.getUser(userId)
        .then(user => {
          if (user) {
            // Remover a senha antes de enviar
            const safeUser = { ...user, password: undefined };
            return res.status(200).send(JSON.stringify(safeUser));
          } else {
            // Se não encontrar o usuário, criar um mock
            const mockUser = {
              id: 1,
              username: 'admin',
              name: 'Admin Teste',
              email: 'admin@edunexia.com',
              role: 'admin',
              portalType: 'admin',
              password: undefined
            };
            return res.status(200).send(JSON.stringify(mockUser));
          }
        })
        .catch(error => {
          console.error("[DEV MODE] Erro ao buscar usuário da sessão:", error);
          
          // Em caso de erro, usar um mock padrão
          const mockUser = {
            id: 1,
            username: 'admin',
            name: 'Admin Teste',
            email: 'admin@edunexia.com',
            role: 'admin',
            portalType: 'admin',
            password: undefined
          };
          return res.status(200).send(JSON.stringify(mockUser));
        });
    } else {
      // Se não houver sessão, criar um mock padrão
      const mockUser = {
        id: 1,
        username: 'admin',
        name: 'Admin Teste',
        email: 'admin@edunexia.com',
        role: 'admin',
        portalType: 'admin',
        password: undefined
      };
      return res.status(200).send(JSON.stringify(mockUser));
    }
    return;
  }
  
  // Comportamento normal em produção
  if (req.session && req.session.passport && req.session.passport.user) {
    // Obtem o ID do usuário a partir da sessão
    const userId = req.session.passport.user;
    
    // Buscar o usuário pelo ID
    storage.getUser(userId)
      .then(user => {
        if (!user) {
          return res.status(401).send(JSON.stringify({ message: "User not found" }));
        }
        
        // Remover a senha antes de enviar
        const safeUser = { ...user, password: undefined };
        return res.status(200).send(JSON.stringify(safeUser));
      })
      .catch(error => {
        console.error("Erro ao buscar usuário:", error);
        return res.status(500).send(JSON.stringify({ message: "Internal server error" }));
      });
  } else {
    return res.status(401).send(JSON.stringify({ message: "Unauthorized" }));
  }
});

export default router;