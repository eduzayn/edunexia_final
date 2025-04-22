const { db } = require('./server/db');
const { users } = require('./shared/schema');
const { eq } = require('drizzle-orm');
const { scrypt, randomBytes } = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function resetAdminPassword() {
  try {
    // Senha padrão: 123456
    const hashedPassword = await hashPassword('123456');
    
    // Buscar todos os administradores
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'))
      .orWhere(eq(users.role, 'superadmin'));
    
    console.log(`Encontrados ${adminUsers.length} usuários admin/superadmin`);
    
    for (const user of adminUsers) {
      console.log(`Resetando senha do usuário: ${user.name} (${user.email})`);
      
      await db.update(users)
        .set({ 
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));
    }
    
    console.log('Senhas resetadas com sucesso para "123456"');
  } catch (error) {
    console.error('Erro ao resetar senhas:', error);
  } finally {
    process.exit(0);
  }
}

resetAdminPassword();