
import { db, pool } from '../db';
import { storage } from '../storage';
import { simplifiedEnrollments } from '../db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    // Obter parâmetros da linha de comando
    const args = process.argv.slice(2);
    let email = '';
    let cpf = '';
    let name = '';
    let password = '';
    let enrollmentId = 0;

    for (let i = 0; i < args.length; i++) {
      if (args[i].startsWith('--email=')) {
        email = args[i].split('=')[1];
      } else if (args[i].startsWith('--cpf=')) {
        cpf = args[i].split('=')[1];
      } else if (args[i].startsWith('--name=')) {
        name = args[i].split('=')[1];
      } else if (args[i].startsWith('--password=')) {
        password = args[i].split('=')[1];
      } else if (args[i].startsWith('--enrollmentId=')) {
        enrollmentId = parseInt(args[i].split('=')[1]);
      }
    }

    if (!email || !cpf || !name || !password || !enrollmentId) {
      console.error('Uso: tsx server/scripts/create-student-account.ts --email=example@email.com --cpf=12345678901 --name="Nome Completo" --password="senha" --enrollmentId=123');
      process.exit(1);
    }

    console.log(`Verificando se usuário já existe: ${email}`);
    const existingUser = await storage.getUserByUsername(email);

    if (existingUser) {
      console.log(`Usuário já existe: ${existingUser.id} (${existingUser.username})`);
      
      // Atualizar matrícula simplificada com o ID do usuário
      await db.update(simplifiedEnrollments)
        .set({ 
          studentId: existingUser.id, 
          updatedAt: new Date() 
        })
        .where(eq(simplifiedEnrollments.id, enrollmentId));
      
      console.log(`Matrícula simplificada #${enrollmentId} atualizada com studentId: ${existingUser.id}`);
      process.exit(0);
    }

    console.log(`Criando novo usuário: ${email}, ${cpf}`);
    
    // Criar usuário
    const newUser = await storage.createUser({
      username: email,
      password: password,
      fullName: name,
      email: email,
      cpf: cpf.replace(/[^\d]/g, ''),
      portalType: 'student',
      status: 'active'
    });

    if (newUser) {
      console.log(`Usuário criado com sucesso: ${newUser.id}`);
      
      // Atualizar matrícula simplificada com o ID do usuário
      await db.update(simplifiedEnrollments)
        .set({ 
          studentId: newUser.id, 
          updatedAt: new Date() 
        })
        .where(eq(simplifiedEnrollments.id, enrollmentId));
      
      console.log(`Matrícula simplificada #${enrollmentId} atualizada com studentId: ${newUser.id}`);
    } else {
      console.error('Falha ao criar usuário');
    }
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  } finally {
    // Fechar conexão com o banco de dados
    await pool.end();
    process.exit(0);
  }
}

main();
