/**
 * Script de teste para verificar a criação automática de perfil de estudante
 * a partir de uma matrícula simplificada.
 */

import fetch from 'node-fetch';

async function testStudentProfileCreation() {
  console.log('Iniciando teste de criação de perfil de estudante...');
  
  // Dados do teste - ajuste conforme necessário
  const testData = {
    studentName: 'Aluno Teste Automático',
    studentEmail: 'alunoteste@edunexa.com.br',
    studentCpf: '12345678900',
    studentPhone: '11999998888',
    courseId: 67, // Use um ID de curso válido no sistema
    institutionId: 5, // Use um ID de instituição válido no sistema
    poloId: 2, // Use um ID de polo válido
    amount: 2500.00,
    sourceChannel: 'api_test',
    // Configurações de pagamento
    billingType: 'BOLETO',
    maxInstallmentCount: 12,
    dueDateLimitDays: 30,
    allowInstallments: true
  };
  
  try {
    // 1. Autenticar como admin
    console.log('Autenticando como administrador...');
    const loginResponse = await fetch('http://localhost:5000/api-json/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin', // Use credenciais válidas
        password: 'admin123' // Use credenciais válidas
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok || !loginData.success) {
      console.error('Falha na autenticação:', loginData);
      return;
    }
    
    const token = loginData.token;
    console.log('Autenticação bem-sucedida. Token obtido.');
    
    // 2. Criar uma matrícula simplificada
    console.log('Criando matrícula simplificada...');
    const enrollmentResponse = await fetch('http://localhost:5000/api-json/v2/simplified-enrollments', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testData)
    });
    
    const enrollmentData = await enrollmentResponse.json();
    
    if (!enrollmentResponse.ok || !enrollmentData.success) {
      console.error('Falha ao criar matrícula:', enrollmentData);
      return;
    }
    
    console.log('Matrícula criada com sucesso!');
    console.log('ID da matrícula:', enrollmentData.data.id);
    
    // 3. Verificar se o perfil do estudante foi criado
    console.log('Verificando criação do perfil...');
    setTimeout(async () => {
      // Esperar alguns segundos para processar o perfil
      const userResponse = await fetch(`http://localhost:5000/api-json/admin/users?email=${encodeURIComponent(testData.studentEmail)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const userData = await userResponse.json();
      
      if (!userResponse.ok || !userData.success) {
        console.error('Falha ao verificar perfil:', userData);
        return;
      }
      
      if (userData.data && userData.data.length > 0) {
        console.log('Perfil de estudante criado com sucesso!');
        console.log('Dados do usuário:', userData.data[0]);
      } else {
        console.error('FALHA: Perfil de estudante não foi criado!');
      }
      
      // 4. Verificar matrícula simplificada atualizada com o studentId
      console.log('Verificando atualização da matrícula...');
      const enrollmentDetailResponse = await fetch(`http://localhost:5000/api-json/v2/simplified-enrollments/${enrollmentData.data.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const enrollmentDetail = await enrollmentDetailResponse.json();
      
      if (!enrollmentDetailResponse.ok || !enrollmentDetail.success) {
        console.error('Falha ao verificar detalhes da matrícula:', enrollmentDetail);
        return;
      }
      
      if (enrollmentDetail.data.studentId) {
        console.log('Matrícula atualizada com o ID do estudante:', enrollmentDetail.data.studentId);
        console.log('TESTE CONCLUÍDO COM SUCESSO!');
      } else {
        console.error('FALHA: Matrícula não foi atualizada com o ID do estudante!');
      }
    }, 5000); // Espera 5 segundos para dar tempo de processar
    
  } catch (error) {
    console.error('Erro durante teste:', error);
  }
}

// Executar o teste
testStudentProfileCreation();