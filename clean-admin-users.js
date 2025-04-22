/**
 * Script para limpar usuários administrativos do banco de dados
 * 
 * Este script:
 * 1. Identifica todas as referências de chave estrangeira aos usuários administrativos
 * 2. Remove essas referências (definindo valores NULL) antes de excluir os usuários
 * 3. Exclui todos os usuários com portal_type 'admin'
 */
import pg from 'pg';

const { Pool } = pg;

async function cleanAdminUsers() {
  // Conexão com o banco de dados usando a variável de ambiente
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Conectado ao banco de dados. Iniciando limpeza de usuários administrativos...');

    // Iniciar uma transação para garantir que todas as operações sejam feitas juntas
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Identificar os IDs de todos os usuários admin
      const usersResult = await client.query(
        `SELECT id, username, full_name FROM users WHERE portal_type = 'admin'`
      );

      if (usersResult.rows.length === 0) {
        console.log('Nenhum usuário administrativo encontrado no sistema.');
        await client.query('COMMIT');
        return;
      }

      const adminUsers = usersResult.rows;
      const adminIds = adminUsers.map(user => user.id);
      
      console.log(`Encontrados ${adminUsers.length} usuários administrativos:`);
      adminUsers.forEach(user => {
        console.log(`ID: ${user.id}, Username: ${user.username}, Nome: ${user.full_name}`);
      });

      // Primeiro, remover registros da tabela user_permissions que fazem referência aos usuários admin
      console.log(`Removendo permissões associadas aos usuários administrativos...`);
      const deleteUserPermissionsQuery = `
        DELETE FROM user_permissions 
        WHERE user_id IN (${adminIds.join(',')})
        RETURNING id
      `;
      
      const deleteUserPermissionsResult = await client.query(deleteUserPermissionsQuery);
      console.log(`- ${deleteUserPermissionsResult.rowCount} registros removidos da tabela 'user_permissions'`);
      
      // Em seguida, remover registros da tabela user_roles que fazem referência aos usuários admin
      console.log(`Removendo papéis (roles) associados aos usuários administrativos...`);
      const deleteUserRolesQuery = `
        DELETE FROM user_roles 
        WHERE user_id IN (${adminIds.join(',')})
        RETURNING id
      `;
      
      const deleteUserRolesResult = await client.query(deleteUserRolesQuery);
      console.log(`- ${deleteUserRolesResult.rowCount} registros removidos da tabela 'user_roles'`);

      // Depois, verificar outras tabelas com chaves estrangeiras
      // Lista de tabelas e suas colunas que fazem referência a usuários
      const constraintsQuery = `
        SELECT 
          tc.table_name, 
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE 
          tc.constraint_type = 'FOREIGN KEY' 
          AND ccu.table_name = 'users'
          AND tc.table_name != 'user_roles' -- Ignoramos user_roles pois já tratamos acima
          AND tc.table_name != 'user_permissions' -- Ignoramos user_permissions pois já tratamos acima
      `;

      const constraintsResult = await client.query(constraintsQuery);
      
      if (constraintsResult.rows.length === 0) {
        console.log('Não foram encontradas outras restrições de chave estrangeira para a tabela users.');
      } else {
        console.log(`Encontradas ${constraintsResult.rows.length} referências à tabela users em outras tabelas:`);
        
        // Para cada tabela e coluna que referencia usuários
        for (const constraint of constraintsResult.rows) {
          const { table_name, column_name } = constraint;
          
          console.log(`Atualizando referências na tabela '${table_name}', coluna '${column_name}'...`);
          
          // Conta quantas linhas serão atualizadas
          const countQuery = `
            SELECT COUNT(*) FROM ${table_name} 
            WHERE ${column_name} IN (${adminIds.join(',')})
          `;
          
          const countResult = await client.query(countQuery);
          const count = parseInt(countResult.rows[0].count);
          
          if (count > 0) {
            // Atualiza as referências para NULL
            const updateQuery = `
              UPDATE ${table_name} 
              SET ${column_name} = NULL 
              WHERE ${column_name} IN (${adminIds.join(',')})
            `;
            
            await client.query(updateQuery);
            console.log(`- ${count} linhas atualizadas na tabela '${table_name}'`);
          } else {
            console.log(`- Nenhuma referência encontrada na tabela '${table_name}'`);
          }
        }
      }

      // Agora que removemos as referências, podemos excluir os usuários
      const deleteQuery = `DELETE FROM users WHERE portal_type = 'admin' RETURNING id, username`;
      const deleteResult = await client.query(deleteQuery);
      
      console.log(`\n${deleteResult.rowCount} usuários administrativos excluídos com sucesso:`);
      deleteResult.rows.forEach(user => {
        console.log(`- ID: ${user.id}, Username: ${user.username}`);
      });

      // Confirmar a transação
      await client.query('COMMIT');
      console.log('\nOperação concluída com sucesso.');
      
    } catch (error) {
      // Em caso de erro, reverter todas as alterações
      await client.query('ROLLBACK');
      console.error('Erro durante a transação. Todas as alterações foram revertidas.');
      throw error;
    } finally {
      // Liberar o cliente de volta para o pool
      client.release();
    }
  } catch (error) {
    console.error('Erro ao limpar usuários administrativos:', error);
  } finally {
    // Fechar o pool de conexões
    await pool.end();
  }
}

// Executar a função principal
cleanAdminUsers();