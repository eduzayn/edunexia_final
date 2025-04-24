import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configuração para detectar diferentes ambientes (Vercel, Replit, local)
const isVercelServerless = process.env.VERCEL === '1';
const isReplitProduction = process.env.REPL_ID !== undefined && process.env.NODE_ENV === 'production';
const isProduction = isVercelServerless || isReplitProduction || process.env.NODE_ENV === 'production';

// WebSocket constructor é necessário para ambos Vercel e Replit
neonConfig.webSocketConstructor = ws;

if (isVercelServerless) {
  console.log("Configurando para ambiente Vercel serverless");
} else if (isReplitProduction) {
  console.log("Configurando para ambiente Replit production");
} else if (isProduction) {
  console.log("Configurando para ambiente production genérico");
} else {
  console.log("Configurando para ambiente desenvolvimento/local");
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use configuração otimizada para ambientes serverless/production
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: isProduction ? 3 : 10, // Número moderado de conexões em ambiente de produção
  idleTimeoutMillis: isProduction ? 10000 : 30000,
  connectionTimeoutMillis: isProduction ? 5000 : 10000,
  
  // Configurações adicionais para melhorar a estabilidade em produção
  allowExitOnIdle: false,
  keepAlive: true,
});

export const db = drizzle({ client: pool, schema });

// Garantir que funções de login funcionem corretamente em ambientes serverless
export const executeWithRetry = async <T>(fn: () => Promise<T>): Promise<T> => {
  let retries = 3;
  while (retries > 0) {
    try {
      return await fn();
    } catch (error) {
      console.error(`Database error (retries left: ${retries}):`, error);
      retries--;
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  throw new Error("Failed after multiple retries"); // Isso nunca deve ser alcançado
};