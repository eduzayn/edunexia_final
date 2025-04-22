/**
 * Script para corrigir o acesso administrativo em produção
 * 
 * Este script ajuda a redefinir credenciais ou criar um novo usuário admin
 * para garantir acesso ao painel administrativo em produção.
 */
const { Pool } = require('pg');
const { createHash } = require('crypto');
const fs = require('fs');
const readline = require('readline');

// Função para criar hash da senha
function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

// Interface para entrada do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Função para fazer perguntas ao usuário
function question(query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

async function fixAdminAccess() {
  try {
    console.log('='.repeat(80));
    console.log('FERRAMENTA DE CORREÇÃO DE ACESSO ADMINISTRATIVO - EDUNEXA');
    console.log('='.repeat(80));
    console.log('Esta ferramenta ajuda a corrigir problemas de acesso ao painel administrativo.\n');
    
    // Verificar configuração do banco de dados
    if (!process.env.DATABASE_URL) {
      console.log('ATENÇÃO: Variável de ambiente DATABASE_URL não encontrada!');
      console.log('Você pode definir esta variável ou informar a string de conexão manualmente.\n');
      
      const useEnvVar = await question('Deseja definir a string de conexão manualmente? (S/N): ');
      
      if (useEnvVar.toUpperCase() === 'S') {
        const connString = await question('Informe a string de conexão do PostgreSQL: ');
        process.env.DATABASE_URL = connString;
      } else {
        console.log('Por favor, defina a variável de ambiente DATABASE_URL antes de executar este script.');
        process.exit(1);
      }
    }
    
    // Conectar ao banco de dados
    console.log('\nConectando ao banco de dados...');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    // Testar conexão
    try {
      const testConn = await pool.query('SELECT NOW()');
      console.log('Conexão bem-sucedida!\n');
    } catch (dbError) {
      console.error('Erro ao conectar ao banco de dados:', dbError.message);
      process.exit(1);
    }
    
    // Listar todos os usuários administrativos
    console.log('Verificando usuários administrativos existentes...');
    const usersResult = await pool.query(
      `SELECT id, username, email, portal_type, full_name FROM users 
       WHERE portal_type = 'admin' OR username = 'admin' OR username = 'superadmin'`
    );
    
    if (usersResult.rows.length > 0) {
      console.log('\nUsuários administrativos encontrados:');
      console.log('-'.repeat(80));
      console.log('ID  | Nome de usuário | E-mail                  | Tipo de Portal | Nome Completo');
      console.log('-'.repeat(80));
      
      usersResult.rows.forEach(user => {
        console.log(
          `${user.id.toString().padEnd(3)} | ${user.username.padEnd(14)} | ${(user.email || '').padEnd(24)} | ${(user.portal_type || '').padEnd(13)} | ${user.full_name || ''}`
        );
      });
      console.log('-'.repeat(80));
      
      // Perguntar se deseja redefinir a senha de algum usuário existente
      const resetExisting = await question('\nDeseja redefinir a senha de algum usuário existente? (S/N): ');
      
      if (resetExisting.toUpperCase() === 'S') {
        const userId = await question('Informe o ID do usuário que deseja redefinir a senha: ');
        const newPassword = await question('Nova senha: ');
        
        const hashedPassword = hashPassword(newPassword);
        
        // Redefinir a senha e garantir tipo de portal admin
        const updateResult = await pool.query(
          `UPDATE users SET password = $1, portal_type = 'admin' 
           WHERE id = $2 RETURNING id, username, portal_type`,
          [hashedPassword, userId]
        );
        
        if (updateResult.rows.length > 0) {
          console.log('\nSenha redefinida com sucesso!');
          console.log(`Usuário: ${updateResult.rows[0].username}`);
          console.log(`Senha: ${newPassword}`);
          console.log(`Tipo de Portal: ${updateResult.rows[0].portal_type}`);
        } else {
          console.log(`Erro: Usuário com ID ${userId} não encontrado.`);
        }
      }
    } else {
      console.log('Nenhum usuário administrativo encontrado.');
    }
    
    // Perguntar se deseja criar um novo usuário admin
    const createNew = await question('\nDeseja criar um novo usuário administrativo? (S/N): ');
    
    if (createNew.toUpperCase() === 'S') {
      const username = await question('Nome de usuário: ');
      const password = await question('Senha: ');
      const email = await question('E-mail: ');
      const fullName = await question('Nome completo: ');
      
      const hashedPassword = hashPassword(password);
      
      // Verificar se o usuário já existe
      const checkUser = await pool.query(
        `SELECT id FROM users WHERE username = $1`,
        [username]
      );
      
      if (checkUser.rows.length > 0) {
        console.log(`\nATENÇÃO: Usuário '${username}' já existe!`);
        const overwrite = await question('Deseja atualizar este usuário? (S/N): ');
        
        if (overwrite.toUpperCase() === 'S') {
          const updateResult = await pool.query(
            `UPDATE users 
             SET password = $1, portal_type = 'admin', email = $2, full_name = $3 
             WHERE username = $4 
             RETURNING id, username, portal_type`,
            [hashedPassword, email, fullName, username]
          );
          
          console.log('\nUsuário atualizado com sucesso!');
          console.log(`Usuário: ${updateResult.rows[0].username}`);
          console.log(`Senha: ${password}`);
          console.log(`Tipo de Portal: ${updateResult.rows[0].portal_type}`);
        }
      } else {
        // Criar novo usuário
        const insertResult = await pool.query(
          `INSERT INTO users (username, password, portal_type, email, full_name)
           VALUES ($1, $2, 'admin', $3, $4)
           RETURNING id, username, portal_type`,
          [username, hashedPassword, email, fullName]
        );
        
        console.log('\nNovo usuário administrativo criado com sucesso!');
        console.log(`Usuário: ${insertResult.rows[0].username}`);
        console.log(`Senha: ${password}`);
        console.log(`Tipo de Portal: ${insertResult.rows[0].portal_type}`);
      }
    }
    
    // Salvar as credenciais em um arquivo para referência
    const createCredFile = await question('\nDeseja salvar as credenciais em um arquivo? (S/N): ');
    
    if (createCredFile.toUpperCase() === 'S') {
      // Buscar todas as credenciais administrativas
      const credsResult = await pool.query(
        `SELECT id, username, email, portal_type, full_name FROM users 
         WHERE portal_type = 'admin'`
      );
      
      const credentialsText = `
=============================================
CREDENCIAIS ADMINISTRATIVAS - EDUNEXA
=============================================
Data: ${new Date().toLocaleString()}

${credsResult.rows.map(user => `ID: ${user.id}
Nome de Usuário: ${user.username}
E-mail: ${user.email || 'Não definido'}
Tipo de Portal: ${user.portal_type}
Nome Completo: ${user.full_name || 'Não definido'}
---------------------------------------------`).join('\n')}

IMPORTANTE:
- Estas credenciais dão acesso total ao sistema EdunexIA
- Mantenha este arquivo em local seguro
- Redefina as senhas regularmente
=============================================
`;
      
      fs.writeFileSync('admin-credentials.txt', credentialsText);
      console.log('\nCredenciais salvas no arquivo: admin-credentials.txt');
    }
    
    console.log('\nOperação concluída com sucesso!');
    console.log('='.repeat(80));
    
    // Fechar conexões
    await pool.end();
    rl.close();
    
  } catch (error) {
    console.error('\nERRO DURANTE A EXECUÇÃO:', error);
    rl.close();
    process.exit(1);
  }
}

// Executar a função principal
fixAdminAccess();