import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { registerRoutes } from '../routes.js';

// Carrega as variáveis de ambiente
dotenv.config();

// Inicializa o aplicativo Express
const app = express();

// Middleware para garantir resposta JSON em erros
const jsonErrorHandler = (err, req, res, next) => {
  console.error('JSON parsing error:', err);
  res.status(400).json({
    success: false,
    message: 'Invalid JSON format in request body',
    error: err.message
  });
};

// Configuração CORS para Vercel - expandida para ambiente serverless
app.use(cors({
  origin: '*', // Permitir qualquer origem
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  maxAge: 86400 // 24 horas
}));

// Middleware para lidar com OPTIONS requests (preflight)
app.options('*', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.status(200).end();
});

// Middleware para processar dados JSON com tratamento de erros
app.use(express.json({
  strict: false, // Menos restritivo para ambiente serverless
  limit: '10mb',
  reviver: (key, value) => {
    return value;
  }
}));
app.use(jsonErrorHandler);
app.use(express.urlencoded({ extended: true }));

// Middleware para garantir Content-Type em todas as respostas
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  
  // Limpa propriedades undefined nos objetos JSON
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (req.body[key] === undefined) {
        delete req.body[key];
      }
    });
  }
  
  // Sobrescrever a função json para garantir formato correto
  const originalJson = res.json;
  res.json = function(data) {
    // Se já é string JSON, não converter novamente
    if (typeof data === 'string') {
      return originalJson.call(this, JSON.parse(data));
    }
    
    // Ensure data is an object for safety
    const safeData = data || { success: false, message: "Empty response" };
    return originalJson.call(this, safeData);
  };
  
  next();
});

// Registra todas as rotas da API
registerRoutes(app);

// Manipulador de erros aprimorado
app.use((err, _req, res, _next) => {
  console.error('Server error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ 
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
});

// Rota para verificar se a API está funcionando
app.get('/api-healthcheck', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'API funcionando corretamente!', 
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? 'vercel' : 'local'
  });
});

// Exporta o manipulador para o uso da Vercel
export default app; 