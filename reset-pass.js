// Script para redefinir a senha do administrador
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createHash } from 'crypto';
import { eq } from 'drizzle-orm';

// Definição manual da tabela users para evitar problemas de importação
const users = {
  username: { name: 'username' },
  password: { name: 'password' },
  portalType: { name: 'portalType' }
};

// Função para criar o hash da senha
function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

async function resetAdminPassword() {
  try {
    // Conexão com o banco de dados
    const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';
    const client = postgres(connectionString);
    const db = drizzle(client);
    
    const adminUsername = 'admin';
    const newPassword = 'admin';
    const hashedPassword = hashPassword(newPassword);
    
    // Atualiza a senha do usuário admin
    const result = await db.update(users)
      .set({ 
        password: hashedPassword,
        portalType: 'admin'
      })
      .where(eq(users.username, adminUsername))
      .returning();
    
    if (result.length === 0) {
      console.log(`Usuário ${adminUsername} não encontrado.`);
    } else {
      console.log(`Senha do usuário ${adminUsername} redefinida com sucesso!`);
      console.log(`Nova senha: ${newPassword}`);
    }
    
    // Fecha a conexão
    await client.end();
    
  } catch (error) {
    console.error('Erro ao redefinir a senha:', error);
  }
}

resetAdminPassword();