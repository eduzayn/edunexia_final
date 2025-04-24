/**
 * Script simples para testar a criação de perfil de estudante para uma matrícula existente
 * usando as funções do sistema.
 */

import { storage } from '../server/storage.js';

async function testStudentCreation() {
  try {
    console.log('Iniciando teste de criação de perfil de estudante...');
    
    const studentEmail = 'teste.auto@edunexa.com.br';
    
    // Verificar se já existe um usuário com esse email
    let existingUser;
    try {
      existingUser = await storage.getUserByUsername(studentEmail);
      if (existingUser) {
        console.log(`Usuário já existe pelo username: ${existingUser.id}`);
      } else {
        // Tentar pelo email
        existingUser = await storage.getUserByEmail(studentEmail);
        if (existingUser) {
          console.log(`Usuário já existe pelo email: ${existingUser.id}`);
        }
      }
    } catch (error) {
      console.log(`Erro ao verificar usuário: ${error.message}`);
    }
    
    if (!existingUser) {
      console.log('Criando novo usuário...');
      
      // Dados do usuário
      const userData = {
        username: studentEmail,
        password: '12345678900',
        fullName: 'Teste Automático',
        email: studentEmail,
        cpf: '12345678900',
        phone: '11987654321',
        portalType: 'student'
      };
      
      // Criar usuário
      const newUser = await storage.createUser(userData);
      console.log(`Usuário criado com sucesso! ID: ${newUser.id}`);
      
      // Atualizar a matrícula com o ID do usuário (usando SQL direto para simplificar)
      const { db } = await import('../server/db.js');
      const { eq } = await import('drizzle-orm');
      const { simplifiedEnrollments } = await import('../server/db/schema.js');
      
      await db.update(simplifiedEnrollments)
        .set({ 
          studentId: newUser.id,
          updatedAt: new Date()
        })
        .where(eq(simplifiedEnrollments.id, 19)); // ID da matrícula criada anteriormente
      
      console.log(`Matrícula atualizada com studentId: ${newUser.id}`);
    }
    
    console.log('Teste concluído!');
  } catch (error) {
    console.error('Erro durante teste:', error);
  }
}

// Executar o teste
testStudentCreation();