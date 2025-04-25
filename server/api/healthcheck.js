import { healthCheck } from '../db/serverless.js';

// Manipulador para requisições de healthcheck da API
export default async function handler(req, res) {
  try {
    // Verifica a saúde do banco de dados
    const dbHealth = await healthCheck();

    // Informações sobre o ambiente
    const environment = {
      nodeEnv: process.env.NODE_ENV || 'development',
      region: process.env.VERCEL_REGION || 'unknown',
      deploymentUrl: process.env.VERCEL_URL || 'localhost',
    };

    // Status geral da aplicação
    const status = dbHealth ? 'healthy' : 'degraded';

    // Informações de versão
    const version = {
      app: process.env.npm_package_version || '1.0.0',
      node: process.version,
    };

    // Resposta do healthcheck
    const response = {
      status,
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth ? 'connected' : 'disconnected',
      },
      environment,
      version,
      uptime: process.uptime(),
    };

    // Retorna 200 se tudo estiver bem, 503 se algum componente estiver com problema
    res.status(dbHealth ? 200 : 503).json(response);
  } catch (error) {
    // Em caso de erro, retorna 500
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
} 