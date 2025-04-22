/**
 * SCRIPT DE EMERGÊNCIA PARA REDEFINIR SENHA DO ADMIN
 * 
 * Este script redefine a senha do usuário admin para "admin123" diretamente no banco de dados
 */

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq } from 'drizzle-orm';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import dotenv from 'dotenv';

// Função para gerar hash de senha
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  // Carregar variáveis de ambiente
  dotenv.config();
  
  if (!process.env.DATABASE_URL) {
    console.error("⛔ DATABASE_URL não definida!");
    process.exit(1);
  }

  console.log("🔄 Conectando ao banco de dados...");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Hash da nova senha (admin123)
    const newPassword = "admin123";
    const hashedPassword = await hashPassword(newPassword);

    console.log(`🔄 Redefinindo senha para usuário 'admin'...`);
    
    // Usar SQL direto para garantir que funcione
    const result = await pool.query(
      "UPDATE users SET password = $1 WHERE username = $2 RETURNING id, username, full_name, email",
      [hashedPassword, "admin"]
    );

    if (result.rowCount === 0) {
      console.error("⛔ Usuário 'admin' não encontrado no banco de dados!");
      process.exit(1);
    }

    const user = result.rows[0];
    console.log("✅ Senha redefinida com sucesso!");
    console.log(`📝 Detalhes do usuário:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Nome: ${user.full_name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`\n🔐 Nova senha: ${newPassword}`);
    console.log("\n⚠️ IMPORTANTE: Esta senha é temporária. Redefina-a após o login por motivos de segurança.");
    
  } catch (error) {
    console.error("⛔ Erro ao redefinir senha:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);