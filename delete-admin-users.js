/**
 * Script para excluir todos os usuários administrativos do banco de dados
 * 
 * Este script remove todos os usuários com portal_type 'admin' do sistema
 */
import pg from 'pg';

const { Pool } = pg;

async function deleteAllAdminUsers() {
  try {
    // Conexão com o banco de dados usando a variável de ambiente
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    console.log('Conectado ao banco de dados. Iniciando exclusão de usuários administrativos...');

    // Primeiro, encontre todos os usuários admin para registrar
    const findResult = await pool.query(
      `SELECT id, username, full_name, portal_type FROM users WHERE portal_type = 'admin'`
    );

    const adminUsers = findResult.rows;
    
    if (adminUsers.length === 0) {
      console.log('Nenhum usuário administrativo encontrado no sistema.');
    } else {
      console.log(`Encontrados ${adminUsers.length} usuários administrativos:`);
      adminUsers.forEach(user => {
        console.log(`ID: ${user.id}, Username: ${user.username}, Nome: ${user.full_name}`);
      });

      // Deletar todos os usuários administrativos
      const deleteResult = await pool.query(
        `DELETE FROM users WHERE portal_type = 'admin' RETURNING id, username`
      );

      console.log(`${deleteResult.rowCount} usuários administrativos foram excluídos com sucesso.`);
      console.log('Usuários removidos:');
      deleteResult.rows.forEach(user => {
        console.log(`- ID: ${user.id}, Username: ${user.username}`);
      });
    }

    // Fechar a conexão
    await pool.end();
    console.log('Operação concluída.');
  } catch (error) {
    console.error('Erro ao excluir usuários administrativos:', error);
  }
}

deleteAllAdminUsers();