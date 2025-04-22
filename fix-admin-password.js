/**
 * Script para redefinir a senha do usuário administrador
 * 
 * Este script redefine a senha do usuário "admin" para "admin" e atualiza o portalType
 * para "admin", garantindo que o login possa ser feito corretamente.
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

async function resetAdminPassword() {
  const client = await pool.connect();
  
  try {
    // Iniciar transação
    await client.query('BEGIN');
    
    // Hash da senha 'admin'
    const hashedPassword = await hashPassword('admin');
    
    // Verificar se o usuário admin existe
    const checkResult = await client.query(
      'SELECT id FROM users WHERE username = $1',
      ['admin']
    );
    
    if (checkResult.rows.length === 0) {
      // Se não existir, criar o usuário admin
      console.log('Usuário admin não encontrado. Criando novo usuário admin...');
      
      await client.query(
        `INSERT INTO users 
         (username, password, full_name, email, portal_type) 
         VALUES ($1, $2, $3, $4, $5)`,
        ['admin', hashedPassword, 'Administrador', 'admin@edunexia.com', 'admin']
      );
      
      console.log('Usuário admin criado com sucesso!');
    } else {
      // Se existir, atualizar a senha
      console.log('Atualizando senha do usuário admin...');
      
      await client.query(
        `UPDATE users 
         SET password = $1, 
             portal_type = $2 
         WHERE username = $3`,
        [hashedPassword, 'admin', 'admin']
      );
      
      console.log('Senha do usuário admin atualizada com sucesso!');
    }
    
    // Commit da transação
    await client.query('COMMIT');
    
    console.log('✅ Operação concluída com sucesso!');
    console.log('Username: admin');
    console.log('Password: admin');
    console.log('PortalType: admin');
    
  } catch (error) {
    // Rollback em caso de erro
    await client.query('ROLLBACK');
    console.error('❌ Erro ao resetar senha do admin:', error);
  } finally {
    // Liberar o cliente
    client.release();
  }
}

// Executar a função principal
resetAdminPassword()
  .then(() => {
    console.log('Script concluído.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });