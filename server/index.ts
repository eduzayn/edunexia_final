import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from 'dotenv';
import cors from 'cors';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();

// Configurar CORS para permitir requisições do cliente
app.use(cors({
  origin: true, // Permite qualquer origem, mas mantém credenciais
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Importante: permite envio de cookies
}));

app.use(express.json({
  // Adiciona uma configuração mais rigorosa para o JSON parser
  strict: true,
  limit: '10mb'
}));
app.use(express.urlencoded({ extended: false }));

// Middleware para garantir propriedades limpas nos objetos JSON
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    // Remove propriedades undefined que podem causar erros de serialização
    Object.keys(req.body).forEach(key => {
      if (req.body[key] === undefined) {
        delete req.body[key];
      }
    });
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Usa a porta 5000 para o deploy no Replit
  const port = 5000; // Forçando a porta 5000 para compatibilidade com o deploy
  server.listen({
    port: Number(port),
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`[express] serving on port ${port}`);
  });
})();