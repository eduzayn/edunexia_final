/**
 * Script para criar um novo usuário administrativo (clean)
 * 
 * Este script cria um novo usuário com perfil administrativo de forma limpa e segura
 * para uso após a limpeza do banco de dados de usuários antigos.
 * 
 * Exemplo de uso:
 * node create-new-admin.js username password "Nome Completo" email@exemplo.com
 */
import { db } from './server/db';
import { users } from './shared/schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function createAdminUser() {
  try {
    // Obter argumentos da linha de comando
    const username = process.argv[2];
    const password = process.argv[3];
    const fullName = process.argv[4];
    const email = process.argv[5];
    
    if (!username || !password || !fullName || !email) {
      console.error('Erro: Todos os parâmetros são obrigatórios');
      console.log('Uso: node create-new-admin.js username password "Nome Completo" email@exemplo.com');
      process.exit(1);
    }
    
    console.log('Verificando se o usuário já existe...');
    
    // Verificar se o username já existe
    const existingUser = await db.select().from(users).where(users.username, '==', username);
    
    if (existingUser.length > 0) {
      console.error(`Erro: Usuário '${username}' já existe no sistema.`);
      process.exit(1);
    }
    
    // Criar hash da senha
    const hashedPassword = await hashPassword(password);
    
    // Inserir o novo usuário
    const [newUser] = await db.insert(users).values({
      username,
      password: hashedPassword,
      fullName,
      email,
      portalType: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    console.log('✅ Usuário administrador criado com sucesso:');
    console.log(`ID: ${newUser.id}`);
    console.log(`Username: ${newUser.username}`);
    console.log(`Nome: ${newUser.fullName}`);
    console.log(`E-mail: ${newUser.email}`);
    console.log(`Tipo: ${newUser.portalType}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
    process.exit(1);
  }
}

createAdminUser();