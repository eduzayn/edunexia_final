/**
 * Script para recuperar matrículas sem perfil de estudante
 * Este script identifica matrículas simplificadas sem student_id
 * e tenta criar o perfil do estudante ou associar a um perfil existente
 */

import { pool } from '../server/db.js';
import { storage } from '../server/storage.js';
import bcrypt from 'bcrypt';

// Função auxiliar para criar hash de senha
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function recoverStudentProfiles() {
  console.log('Iniciando processo de recuperação de perfis de estudantes...');
  
  try {
    // Conectar ao banco de dados
    const client = await pool.connect();
    
    try {
      // 1. Buscar matrículas sem student_id
      const enrollmentsResult = await client.query(`
        SELECT id, student_name, student_email, student_cpf, student_phone, 
               asaas_customer_id, course_id, institution_id
        FROM simplified_enrollments
        WHERE student_id IS NULL
        ORDER BY id ASC
      `);
      
      const enrollments = enrollmentsResult.rows;
      console.log(`Encontradas ${enrollments.length} matrículas sem perfil associado.`);
      
      // 2. Processar cada matrícula
      for (const enrollment of enrollments) {
        console.log(`\nProcessando matrícula #${enrollment.id} - ${enrollment.student_email}`);
        
        // 2.1 Verificar se já existe um usuário com esse email
        let user;
        try {
          user = await storage.getUserByUsername(enrollment.student_email);
          if (user) {
            console.log(`Encontrado usuário existente pelo username: ${user.id}`);
          } else {
            // Tentar pelo email
            user = await storage.getUserByEmail(enrollment.student_email);
            if (user) {
              console.log(`Encontrado usuário existente pelo email: ${user.id}`);
            }
          }
        } catch (error) {
          console.error(`Erro ao buscar usuário: ${error.message}`);
        }
        
        // 2.2 Se não existir usuário, criar um novo
        if (!user) {
          console.log(`Criando novo perfil para: ${enrollment.student_name}`);
          
          try {
            // Usar CPF como senha inicial
            const initialPassword = enrollment.student_cpf ? 
              enrollment.student_cpf.replace(/[^\d]/g, '') : 
              Math.random().toString(36).slice(-8);
            
            // Gerar hash da senha
            const hashedPassword = await hashPassword(initialPassword);
            
            // Criar o usuário
            user = await storage.createUser({
              username: enrollment.student_email,
              password: hashedPassword,
              fullName: enrollment.student_name,
              email: enrollment.student_email,
              cpf: enrollment.student_cpf ? enrollment.student_cpf.replace(/[^\d]/g, '') : null,
              phone: enrollment.student_phone || null,
              portalType: 'student',
              asaasId: enrollment.asaas_customer_id || null
            });
            
            console.log(`Usuário criado com sucesso! ID: ${user.id}`);
            
            // Exibir senha para fins de teste (remover em produção)
            console.log(`Senha inicial: ${initialPassword}`);
          } catch (createError) {
            console.error(`Erro ao criar usuário: ${createError.message}`);
            continue; // Pular para a próxima matrícula
          }
        }
        
        // 2.3 Atualizar a matrícula com o ID do usuário
        try {
          await client.query(`
            UPDATE simplified_enrollments
            SET student_id = $1, updated_at = NOW()
            WHERE id = $2
          `, [user.id, enrollment.id]);
          
          console.log(`Matrícula #${enrollment.id} atualizada com student_id = ${user.id}`);
        } catch (updateError) {
          console.error(`Erro ao atualizar matrícula: ${updateError.message}`);
        }
      }
      
      console.log('\nProcesso de recuperação concluído!');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro durante o processo de recuperação:', error);
  }
}

// Executar o script
recoverStudentProfiles();