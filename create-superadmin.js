/**
 * Script para criar um novo usuário superadmin
 * 
 * Este script cria um novo usuário administrativo com acesso a todos os portais
 */
import pg from 'pg';
import { createHash } from 'crypto';

const { Pool } = pg;

// Função para criar hash da senha
function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

async function createSuperAdmin() {
  try {
    // Conexão com o banco de dados usando a variável de ambiente
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    // Obter parâmetros da linha de comando
    const username = process.argv[2] || 'admin';
    const password = process.argv[3] || 'admin';
    const email = process.argv[4] || 'admin@edunexa.com';
    const fullName = process.argv[5] || 'Administrador';

    // Verificar se o usuário já existe
    const userQuery = await pool.query(
      `SELECT id, username, portal_type FROM users WHERE username = $1`,
      [username]
    );

    if (userQuery.rows.length > 0) {
      const user = userQuery.rows[0];
      console.log(`Usuário ${username} já existe:`, user);
      
      // Perguntar se deseja atualizar
      console.log(`Deseja atualizar a senha e tipo do usuário ${username}? (S/N)`);
      process.stdin.once('data', async (data) => {
        const answer = data.toString().trim().toUpperCase();
        
        if (answer === 'S') {
          // Atualizar usuário existente
          const hashedPassword = hashPassword(password);
          
          const result = await pool.query(
            `UPDATE users SET password = $1, portal_type = 'admin', email = $2, full_name = $3 
             WHERE username = $4 RETURNING id, username, portal_type`,
            [hashedPassword, email, fullName, username]
          );
          
          console.log(`Usuário ${username} atualizado com sucesso!`);
          console.log('Nova senha:', password);
          console.log('Detalhes do usuário:', result.rows[0]);
        } else {
          console.log('Operação cancelada pelo usuário.');
        }
        
        await pool.end();
        process.exit(0);
      });
    } else {
      // Criar novo usuário
      const hashedPassword = hashPassword(password);
      
      const result = await pool.query(
        `INSERT INTO users (username, password, portal_type, email, full_name)
         VALUES ($1, $2, 'admin', $3, $4)
         RETURNING id, username, portal_type`,
        [username, hashedPassword, email, fullName]
      );
      
      console.log(`Usuário ${username} criado com sucesso!`);
      console.log('Senha:', password);
      console.log('Detalhes do usuário:', result.rows[0]);
      
      await pool.end();
    }
  } catch (error) {
    console.error('Erro ao criar/atualizar usuário admin:', error);
    process.exit(1);
  }
}

createSuperAdmin();