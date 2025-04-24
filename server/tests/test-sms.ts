import dotenv from 'dotenv';
dotenv.config();

import { sendSMS, sendStudentCredentialsSMS } from '../services/sms-service';

// Função para testar o envio de SMS
async function testSMSService() {
  console.log('=== Iniciando teste do serviço de SMS ===');
  
  // Verificando as variáveis de ambiente Twilio
  console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'Configurado' : 'Não configurado');
  console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'Configurado' : 'Não configurado');
  console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER || 'Não configurado');
  
  // Número de telefone para teste
  // Utilize o formato internacional (com código do país)
  const testPhoneNumber = '+5581983838700'; // Número real para testar
  
  console.log(`\nTestando envio de SMS básico para ${testPhoneNumber}...`);
  try {
    const result = await sendSMS({
      to: testPhoneNumber,
      body: 'Este é um SMS de teste da plataforma EdunexIA! 📚'
    });
    
    console.log('Resultado do envio:', result ? 'Sucesso ✅' : 'Falha ❌');
  } catch (error) {
    console.error('Erro ao enviar SMS básico:', error);
  }
  
  console.log('\nTestando envio de SMS de credenciais...');
  try {
    const result = await sendStudentCredentialsSMS(
      testPhoneNumber,
      '123.456.789-00',
      'João da Silva',
      'joao.silva@exemplo.com'
    );
    
    console.log('Resultado do envio de credenciais:', result ? 'Sucesso ✅' : 'Falha ❌');
  } catch (error) {
    console.error('Erro ao enviar SMS de credenciais:', error);
  }
  
  console.log('\n=== Teste do serviço de SMS concluído ===');
}

// Executar o teste
testSMSService()
  .then(() => {
    console.log('Teste finalizado.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erro durante o teste:', error);
    process.exit(1);
  });