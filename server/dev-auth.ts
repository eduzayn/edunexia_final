/**
 * AUTENTICAÇÃO DE EMERGÊNCIA - MODO DESENVOLVEDOR
 * 
 * Este arquivo implementa uma autenticação de emergência para desenvolvimento
 * que permite login com credenciais fixas, ignorando a verificação normal de senha.
 */

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { storage } from "./storage";
import { User } from "@shared/schema";

const MemorySession = MemoryStore(session);

// Usuário de desenvolvimento para login de emergência
const DEV_USER: User = {
  id: 1,
  username: "admin",
  password: "admin123", // A senha real não é usada na autenticação
  fullName: "Administrador do Sistema",
  email: "admin@edunexa.com",
  cpf: null,
  phone: null,
  address: null,
  city: null,
  state: null,
  zipCode: null,
  birthDate: null,
  portalType: "admin",
  poloId: null,
  // Campos adicionais requeridos pelo Passport, podemos precisar ajustar
  createdAt: new Date(),
  updatedAt: new Date(),
  createdById: null,
  updatedById: null
};

export function setupEmergencyAuth(app: Express) {
  // Configuração da sessão
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "dev-emergency-secret",
    resave: false,
    saveUninitialized: false,
    store: new MemorySession({
      checkPeriod: 86400000,
    }),
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Estratégia de autenticação local que sempre autentica para ADMIN/ADMIN123
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      console.log('🔥 MODO DE EMERGÊNCIA: Tentando autenticar usuário:', username);
      
      // Verificação de emergência - apenas para username "admin" e senha "admin123"
      if (username === "admin" && password === "admin123") {
        console.log('🔥 MODO DE EMERGÊNCIA: Autenticação bem-sucedida');
        
        // Tentar buscar o usuário real do banco de dados
        const realUser = await storage.getUserByUsername(username);
        
        if (realUser) {
          console.log('🔥 MODO DE EMERGÊNCIA: Usando usuário real do banco de dados');
          return done(null, realUser);
        }
        
        // Se não encontrar, usar o usuário de desenvolvimento
        console.log('🔥 MODO DE EMERGÊNCIA: Usando usuário de desenvolvimento');
        return done(null, DEV_USER);
      }
      
      // Para outros usuários, tentar autenticação normal (mas isso provavelmente falhará)
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log('Usuário não encontrado:', username);
          return done(null, false);
        }
        
        // No modo de emergência, não tentamos verificar a senha
        console.log('❌ Falha na autenticação - apenas admin/admin123 é permitido no modo de emergência');
        return done(null, false);
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        return done(error, false);
      }
    })
  );

  // Serializar/Deserializar usuário para sessão
  passport.serializeUser((user, done) => {
    console.log('🔥 MODO DE EMERGÊNCIA: Serializando usuário:', user.username);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    console.log('🔥 MODO DE EMERGÊNCIA: Deserializando usuário ID:', id);
    
    try {
      // Tentar buscar o usuário real do banco
      const user = await storage.getUser(id);
      
      if (user) {
        console.log('🔥 MODO DE EMERGÊNCIA: Usuário encontrado no banco');
        return done(null, user);
      }
      
      // Se não encontrar e for o ID 1, retornar o usuário de desenvolvimento
      if (id === 1) {
        console.log('🔥 MODO DE EMERGÊNCIA: Usando usuário de desenvolvimento');
        return done(null, DEV_USER);
      }
      
      // Sessão inválida
      console.log('❌ Sessão inválida, usuário não encontrado');
      return done(null, null);
    } catch (error) {
      console.error('Erro ao deserializar usuário:', error);
      return done(error, null);
    }
  });

  // Rotas de autenticação
  app.post("/api-json/login", (req, res, next) => {
    console.log('🔥 MODO DE EMERGÊNCIA: Requisição de login para:', req.body.username);
    
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error('Erro na autenticação:', err);
        return next(err);
      }
      
      if (!user) {
        console.log('❌ Falha na autenticação:', info);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error('Erro ao estabelecer sessão:', err);
          return next(err);
        }
        
        console.log('✅ Login bem-sucedido para usuário:', user.username);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api-json/logout", (req, res) => {
    console.log('🔥 MODO DE EMERGÊNCIA: Logout');
    req.logout((err) => {
      if (err) {
        console.error('Erro ao fazer logout:', err);
        return res.status(500).json({ message: "Error during logout" });
      }
      
      res.sendStatus(200);
    });
  });

  app.get("/api-json/user", (req, res) => {
    console.log('🔥 MODO DE EMERGÊNCIA: Verificando usuário autenticado');
    
    if (!req.isAuthenticated()) {
      console.log('❌ Usuário não autenticado');
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    console.log('✅ Usuário autenticado:', req.user.username);
    res.json(req.user);
  });
}