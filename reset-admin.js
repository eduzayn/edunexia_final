import pg from 'pg';
import { createHash } from 'crypto';

const { Pool } = pg;

// Função para criar hash da senha
function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

async function resetAdminPassword() {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    // Nova senha: admin
    const password = 'admin';
    const hashedPassword = hashPassword(password);

    // Executar query diretamente
    const result = await pool.query(
      `UPDATE users SET password = $1, portal_type = 'admin' WHERE username = 'admin' RETURNING id, username`,
      [hashedPassword]
    );

    if (result.rows.length === 0) {
      console.log('Usuário admin não encontrado.');
    } else {
      console.log('Senha do usuário admin redefinida com sucesso!');
      console.log('Nova senha:', password);
      console.log('Usuário atualizado:', result.rows[0]);
    }

    // Fechar a conexão
    await pool.end();
  } catch (error) {
    console.error('Erro ao redefinir a senha:', error);
  }
}

resetAdminPassword();