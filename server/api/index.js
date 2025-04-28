import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { registerRoutes } from '../routes.js';

// Carrega as variáveis de ambiente
dotenv.config();

// Inicializa o aplicativo Express
const app = express();

// Configuração CORS para Vercel
app.use(cors({
  origin: process.env.VERCEL_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware para processar dados JSON
app.use(express.json({
  strict: true,
  limit: '10mb'
}));
app.use(express.urlencoded({ extended: false }));

// Limpa propriedades undefined nos objetos JSON
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (req.body[key] === undefined) {
        delete req.body[key];
      }
    });
  }
  next();
});

// Registra todas as rotas da API
registerRoutes(app);

// Manipulador de erros
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Exporta o manipulador para o uso da Vercel
export default app; 