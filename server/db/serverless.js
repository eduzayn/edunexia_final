import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import dotenv from 'dotenv';

// Carregar as variáveis de ambiente
dotenv.config();

// Verificar se a URL do banco de dados está definida
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

// Criar uma conexão SQL otimizada para ambiente serverless
const sql = neon(process.env.DATABASE_URL);

// Criar uma instância do Drizzle com a conexão SQL
export const db = drizzle(sql);

// Função helper para executar consultas SQL diretas com parâmetros
export async function executeQuery(query, params) {
  try {
    return await sql(query, params);
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Função para verificar a saúde da conexão com o banco de dados
export async function healthCheck() {
  try {
    const result = await sql`SELECT 1 as health_check`;
    return result[0]?.health_check === 1;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Exportação por padrão para compatibilidade com imports dinâmicos
export default db; 