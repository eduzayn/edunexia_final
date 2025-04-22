import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { comparePasswords, hashPassword } from "./auth-utils";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

/**
 * Middleware para verificar se o usuário está autenticado
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Você precisa estar autenticado para acessar este recurso.' });
  }
  next();
};

/**
 * Middleware para verificar se o usuário tem permissão de administrador
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Você precisa estar autenticado para acessar este recurso.' });
  }
  
  const user = req.user as SelectUser;
  if (user.portalType !== 'admin') {
    return res.status(403).json({ message: 'Você não tem permissão para acessar este recurso.' });
  }
  
  next();
};

/**
 * Configura a autenticação para o aplicativo Express
 */
export function setupAuth(app: Express) {
  // Configurações da sessão
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "edunexia-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: false // Definir como true em produção
    }
  };

  // Configurar a sessão e o passport
  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configurar a estratégia local do passport
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Buscar o usuário pelo nome de usuário
        const user = await storage.getUserByUsername(username);
        
        // Verificar se o usuário existe e se a senha está correta
        if (!user || !(await comparePasswords(password, user.password))) {
          console.log(`Login falhou para ${username}: usuário não encontrado ou senha incorreta`);
          return done(null, false);
        }
        
        console.log(`Login bem-sucedido para ${username}`);
        return done(null, user);
      } catch (error) {
        console.error(`Erro durante autenticação para ${username}:`, error);
        return done(error);
      }
    }),
  );

  // Serializar e deserializar o usuário para a sessão
  passport.serializeUser((user, done) => {
    console.log(`Serializando usuário: ${user.id}`);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        console.log(`Usuário com id ${id} não encontrado. Invalidando sessão.`);
        return done(null, null);
      }
      
      console.log(`Desserializando usuário: ${user.id} (${user.username})`);
      return done(null, user);
    } catch (error) {
      console.error("Erro ao desserializar usuário:", error);
      return done(null, null);
    }
  });

  // Rota para registro de usuário
  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Não retornar a senha
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(400).json({ message: errorMessage });
    }
  });
}
