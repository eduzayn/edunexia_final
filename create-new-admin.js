/**
 * Script para criar um novo usuário administrativo (clean)
 * 
 * Este script cria um novo usuário com perfil administrativo de forma limpa e segura
 * para uso após a limpeza do banco de dados de usuários antigos.
 * 
 * Exemplo de uso:
 * node create-new-admin.js username password "Nome Completo" email@exemplo.com
 */
import pg from 'pg';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const { Pool } = pg;

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
    
    // Criar conexão com o banco de dados
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    try {
      console.log('Verificando se o usuário já existe...');
      
      // Verificar se o username já existe
      const checkUser = await pool.query(
        `SELECT id, username FROM users WHERE username = $1`,
        [username]
      );
      
      if (checkUser.rows.length > 0) {
        console.error(`Erro: Usuário '${username}' já existe no sistema.`);
        await pool.end();
        process.exit(1);
      }
      
      // Criar hash da senha
      const hashedPassword = await hashPassword(password);
      
      // Inserir o novo usuário
      const result = await pool.query(
        `INSERT INTO users 
          (username, password, full_name, email, portal_type) 
         VALUES 
          ($1, $2, $3, $4, 'admin') 
         RETURNING id, username, full_name, email, portal_type`,
        [username, hashedPassword, fullName, email]
      );
      
      const newUser = result.rows[0];
    
      console.log('✅ Usuário administrador criado com sucesso:');
      console.log(`ID: ${newUser.id}`);
      console.log(`Username: ${newUser.username}`);
      console.log(`Nome: ${newUser.full_name}`);
      console.log(`E-mail: ${newUser.email}`);
      console.log(`Tipo: ${newUser.portal_type}`);
      
      await pool.end();
      process.exit(0);
    } catch (error) {
      console.error('Erro ao criar usuário administrador:', error);
      await pool.end();
      process.exit(1);
    }
  } catch (error) {
    console.error('Erro geral:', error);
    process.exit(1);
  }
}

createAdminUser();