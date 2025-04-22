/**
 * Script para criar um novo usuário superadmin
 * 
 * Este script cria um novo usuário administrativo com acesso a todos os portais
 * Execução: node create-superadmin.cjs [username] [password] [email] [nome_completo]
 */
const { Pool } = require('pg');
const { createHash } = require('crypto');

// Função para criar hash da senha
function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

async function createSuperAdmin() {
  try {
    // Obter parâmetros da linha de comando ou usar valores padrão
    const username = process.argv[2] || 'superadmin';
    const password = process.argv[3] || 'superadmin';
    const email = process.argv[4] || 'superadmin@edunexa.com';
    const fullName = process.argv[5] || 'Super Administrador';
    
    console.log('-------------------------------------------');
    console.log('Criando novo superadministrador:');
    console.log(`Usuário: ${username}`);
    console.log(`Senha: ${password}`);
    console.log(`Email: ${email}`);
    console.log(`Nome: ${fullName}`);
    console.log('-------------------------------------------');

    // Conexão com o banco de dados usando a variável de ambiente
    console.log('Conectando ao banco de dados...');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    // Verificar se o usuário já existe
    console.log('Verificando se o usuário já existe...');
    const checkQuery = await pool.query(
      `SELECT id, username, portal_type FROM users WHERE username = $1`,
      [username]
    );

    if (checkQuery.rows.length > 0) {
      console.log(`ATENÇÃO: Usuário '${username}' já existe.`);
      console.log('Detalhes do usuário existente:', checkQuery.rows[0]);
      console.log('Atualizando senha e permissões...');
      
      // Atualizar usuário existente
      const hashedPassword = hashPassword(password);
      
      const updateResult = await pool.query(
        `UPDATE users 
         SET password = $1, portal_type = 'admin', email = $2, full_name = $3 
         WHERE username = $4 
         RETURNING id, username, portal_type`,
        [hashedPassword, email, fullName, username]
      );
      
      console.log('Usuário atualizado com sucesso!');
      console.log('Detalhes do usuário:', updateResult.rows[0]);
    } else {
      console.log('Criando novo usuário administrador...');
      
      // Criar usuário do zero
      const hashedPassword = hashPassword(password);
      
      const insertResult = await pool.query(
        `INSERT INTO users (username, password, portal_type, email, full_name)
         VALUES ($1, $2, 'admin', $3, $4)
         RETURNING id, username, portal_type`,
        [username, hashedPassword, email, fullName]
      );
      
      console.log('Novo usuário administrador criado com sucesso!');
      console.log('Detalhes do usuário:', insertResult.rows[0]);
    }

    console.log('-------------------------------------------');
    console.log('IMPORTANTE:');
    console.log(`Use ${username}/${password} para acessar o painel administrativo.`);
    console.log('-------------------------------------------');
    
    // Fechar a conexão
    await pool.end();
    console.log('Conexão encerrada.');
    
  } catch (error) {
    console.error('ERRO ao criar usuário administrador:');
    console.error(error);
    process.exit(1);
  }
}

// Executar função principal
createSuperAdmin();