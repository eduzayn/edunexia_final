/**
 * Script para criar o usuário administrativo Edunexa
 * 
 * Este script cria um usuário específico com credenciais predefinidas
 * para acesso ao painel administrativo em produção.
 */
const { Pool } = require('pg');
const { createHash } = require('crypto');

// Definir credenciais fixas
const ADMIN_USERNAME = 'edunexa';
const ADMIN_PASSWORD = 'Edunexa@2025';
const ADMIN_EMAIL = 'contato@edunexa.com';
const ADMIN_FULLNAME = 'Administrador EdunexIA';

// Função para criar hash da senha
function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

async function createEduneaAdmin() {
  try {
    console.log('='.repeat(80));
    console.log('CRIAÇÃO DE USUÁRIO ADMINISTRATIVO EDUNEXA');
    console.log('='.repeat(80));
    
    // Conectar ao banco de dados
    console.log('Conectando ao banco de dados...');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    // Testar conexão
    try {
      await pool.query('SELECT NOW()');
      console.log('Conexão bem-sucedida!\n');
    } catch (dbError) {
      console.error('Erro ao conectar ao banco de dados:', dbError.message);
      process.exit(1);
    }
    
    // Verificar se o usuário já existe
    console.log(`Verificando se o usuário '${ADMIN_USERNAME}' já existe...`);
    const checkQuery = await pool.query(
      `SELECT id, username, portal_type FROM users WHERE username = $1`,
      [ADMIN_USERNAME]
    );
    
    const hashedPassword = hashPassword(ADMIN_PASSWORD);
    
    if (checkQuery.rows.length > 0) {
      console.log(`Usuário '${ADMIN_USERNAME}' já existe. Atualizando senha e permissões...`);
      
      // Atualizar usuário existente
      const updateResult = await pool.query(
        `UPDATE users 
         SET password = $1, portal_type = 'admin', email = $2, full_name = $3 
         WHERE username = $4 
         RETURNING id, username, portal_type`,
        [hashedPassword, ADMIN_EMAIL, ADMIN_FULLNAME, ADMIN_USERNAME]
      );
      
      console.log('\nUsuário atualizado com sucesso!');
      console.log('Detalhes do usuário:', updateResult.rows[0]);
    } else {
      console.log(`Usuário '${ADMIN_USERNAME}' não encontrado. Criando novo usuário...`);
      
      // Criar novo usuário
      const insertResult = await pool.query(
        `INSERT INTO users (username, password, portal_type, email, full_name)
         VALUES ($1, $2, 'admin', $3, $4)
         RETURNING id, username, portal_type`,
        [ADMIN_USERNAME, hashedPassword, ADMIN_EMAIL, ADMIN_FULLNAME]
      );
      
      console.log('\nNovo usuário administrativo criado com sucesso!');
      console.log('Detalhes do usuário:', insertResult.rows[0]);
    }
    
    console.log('\n='.repeat(80));
    console.log('CREDENCIAIS DE ACESSO:');
    console.log('='.repeat(80));
    console.log(`Usuário: ${ADMIN_USERNAME}`);
    console.log(`Senha: ${ADMIN_PASSWORD}`);
    console.log(`E-mail: ${ADMIN_EMAIL}`);
    console.log(`Nome: ${ADMIN_FULLNAME}`);
    console.log('='.repeat(80));
    
    // Fechar conexão
    await pool.end();
    
  } catch (error) {
    console.error('\nERRO DURANTE A EXECUÇÃO:', error);
    process.exit(1);
  }
}

// Executar a função principal
createEduneaAdmin();