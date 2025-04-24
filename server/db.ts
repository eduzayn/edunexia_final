import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configuração específica para ambientes serverless como o Vercel
const isVercelServerless = process.env.VERCEL === '1';

if (isVercelServerless) {
  neonConfig.webSocketConstructor = ws;
  console.log("Configurando para ambiente Vercel serverless");
} else {
  neonConfig.webSocketConstructor = ws;
  console.log("Configurando para ambiente desenvolvimento/local");
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use configuração otimizada para Vercel
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: isVercelServerless ? 1 : 10, // Menos conexões em ambiente serverless
  idleTimeoutMillis: isVercelServerless ? 10000 : 30000,
  connectionTimeoutMillis: isVercelServerless ? 5000 : 10000,
});

export const db = drizzle({ client: pool, schema });

// Garantir que funções de login funcionem corretamente em ambientes serverless
export const executeWithRetry = async (fn) => {
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
};