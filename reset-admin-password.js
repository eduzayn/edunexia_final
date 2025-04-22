/**
 * Script para redefinir a senha do usuário administrador
 * 
 * Este script redefine a senha do usuário "admin" para "admin" e atualiza o portal_type
 * para "admin", garantindo que o login possa ser feito corretamente.
 */
import pg from 'pg';
import { createHash } from 'crypto';

const { Pool } = pg;

// Função para criar hash da senha
function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

async function resetAdminPassword() {
  try {
    // Conexão com o banco de dados usando a variável de ambiente
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    // Nova senha: admin
    const password = 'admin';
    const hashedPassword = hashPassword(password);

    // Obter informações sobre o usuário admin
    const userQuery = await pool.query(
      `SELECT id, username, portal_type FROM users WHERE username = 'admin'`
    );

    if (userQuery.rows.length === 0) {
      console.log('Usuário admin não encontrado. Criando novo usuário admin...');
      
      // Criar o usuário admin se não existir
      const insertResult = await pool.query(
        `INSERT INTO users (username, password, portal_type, full_name, email)
         VALUES ('admin', $1, 'admin', 'Administrador', 'admin@edunexa.com')
         RETURNING id, username`,
        [hashedPassword]
      );
      
      console.log('Usuário admin criado com sucesso!');
      console.log('Nova senha:', password);
      console.log('Usuário criado:', insertResult.rows[0]);
    } else {
      // Atualizar a senha do usuário admin existente
      console.log('Usuário admin encontrado:', userQuery.rows[0]);
      
      const result = await pool.query(
        `UPDATE users SET password = $1, portal_type = 'admin' WHERE username = 'admin' RETURNING id, username`,
        [hashedPassword]
      );

      if (result.rows.length === 0) {
        console.log('Erro ao atualizar a senha do usuário admin.');
      } else {
        console.log('Senha do usuário admin redefinida com sucesso!');
        console.log('Nova senha:', password);
        console.log('Usuário atualizado:', result.rows[0]);
      }
    }

    // Fechar a conexão
    await pool.end();
  } catch (error) {
    console.error('Erro ao redefinir a senha:', error);
  }
}

resetAdminPassword();