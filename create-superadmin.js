/**
 * Script para criar um novo usuário superadmin
 * 
 * Este script cria um novo usuário administrativo com acesso a todos os portais
 */

import pg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pg;

// Configurar a conexão com o banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Função para gerar o hash da senha
async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function createSuperAdmin() {
  // Configuração do novo usuário
  const userData = {
    username: 'marcoadmin',
    password: 'admin123',
    fullName: 'Marco Magonder',
    email: 'marcomagonder@gmail.com',
    portalType: 'admin'
  };
  
  const client = await pool.connect();
  
  try {
    // Iniciar transação
    await client.query('BEGIN');
    
    // Hash da senha
    const hashedPassword = await hashPassword(userData.password);
    
    // Verificar se o usuário já existe
    const checkResult = await client.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [userData.username, userData.email]
    );
    
    if (checkResult.rows.length > 0) {
      // Se existir, atualizar o usuário
      console.log('Usuário já existe. Atualizando...');
      
      await client.query(
        `UPDATE users 
         SET password = $1, 
             full_name = $2,
             email = $3,
             portal_type = $4
         WHERE username = $5`,
        [hashedPassword, userData.fullName, userData.email, userData.portalType, userData.username]
      );
      
      console.log('Usuário atualizado com sucesso!');
    } else {
      // Se não existir, criar o usuário
      console.log('Criando novo usuário administrativo...');
      
      await client.query(
        `INSERT INTO users 
         (username, password, full_name, email, portal_type) 
         VALUES ($1, $2, $3, $4, $5)`,
        [userData.username, hashedPassword, userData.fullName, userData.email, userData.portalType]
      );
      
      console.log('Usuário criado com sucesso!');
    }
    
    // Commit da transação
    await client.query('COMMIT');
    
    console.log('✅ Operação concluída com sucesso!');
    console.log('-----------------------------------');
    console.log(`Username: ${userData.username}`);
    console.log(`Password: ${userData.password}`);
    console.log(`Full Name: ${userData.fullName}`);
    console.log(`Email: ${userData.email}`);
    console.log(`Portal Type: ${userData.portalType}`);
    console.log('-----------------------------------');
    
  } catch (error) {
    // Rollback em caso de erro
    await client.query('ROLLBACK');
    console.error('❌ Erro ao criar usuário administrativo:', error);
  } finally {
    // Liberar o cliente
    client.release();
  }
}

// Executar a função principal
createSuperAdmin()
  .then(() => {
    console.log('Script concluído.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });