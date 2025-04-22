/**
 * Script para transformar um usuário existente em superadmin
 * 
 * Este script atualiza o portal_type de um usuário existente para 'admin'
 * garantindo que ele tenha acesso a todos os portais administrativos
 */
const { Pool } = require('pg');

async function makeSuperAdmin() {
  try {
    // Obter o nome de usuário da linha de comando
    const username = process.argv[2];
    
    if (!username) {
      console.error('Erro: Nome de usuário não fornecido!');
      console.log('Uso: node make-superadmin.cjs <nome_do_usuario>');
      process.exit(1);
    }

    // Conexão com o banco de dados usando a variável de ambiente
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    // Verificar se o usuário existe
    const userQuery = await pool.query(
      `SELECT id, username, portal_type FROM users WHERE username = $1`,
      [username]
    );

    if (userQuery.rows.length === 0) {
      console.error(`Erro: Usuário '${username}' não encontrado no sistema.`);
      process.exit(1);
    }

    const user = userQuery.rows[0];
    console.log('Usuário encontrado:', user);

    // Atualizar o usuário para ter papel de superadmin
    const result = await pool.query(
      `UPDATE users SET portal_type = 'admin' WHERE username = $1 RETURNING id, username, portal_type`,
      [username]
    );

    if (result.rows.length === 0) {
      console.log(`Erro ao atualizar o usuário ${username}.`);
    } else {
      console.log(`Usuário '${username}' transformado em superadmin com sucesso!`);
      console.log('Detalhes do usuário:', result.rows[0]);
    }

    // Fechar a conexão
    await pool.end();
  } catch (error) {
    console.error('Erro ao atualizar o usuário:', error);
  }
}

makeSuperAdmin();