import twilio from 'twilio';

// Verificar se as credenciais do Twilio estão configuradas
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  console.warn('AVISO: Credenciais Twilio não encontradas. O envio de SMS não funcionará corretamente.');
}

// Inicialização do cliente Twilio
let twilioClient: twilio.Twilio | null = null;

try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    // Verifica se o ACCOUNT_SID começa com 'AC' (formato correto)
    if (process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
      twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      console.log('Cliente Twilio inicializado com sucesso');
    } else {
      console.error('TWILIO_ACCOUNT_SID inválido. Deve começar com "AC"');
    }
  }
} catch (error) {
  console.error('Erro ao inicializar cliente Twilio:', error);
}

// Número de telefone da instituição (para ser usado como remetente)
const DEFAULT_FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;

/**
 * Interface para os parâmetros de envio de SMS
 */
interface SMSParams {
  to: string;           // Número do destinatário com código do país (ex: +5511999999999)
  from?: string;        // Número remetente (opcional, usa o padrão se não informado)
  body: string;         // Corpo da mensagem
}

/**
 * Envia um SMS usando o serviço Twilio
 * @param params Parâmetros do SMS
 * @returns Promise<boolean> Indica se o envio foi bem-sucedido
 */
export async function sendSMS(params: SMSParams): Promise<boolean> {
  try {
    // Verificar se o cliente Twilio foi inicializado corretamente
    if (!twilioClient) {
      console.error('Erro ao enviar SMS: Cliente Twilio não inicializado. Verifique as credenciais.');
      return false;
    }

    // Verificar se existe um número remetente
    const fromNumber = params.from || DEFAULT_FROM_NUMBER;
    if (!fromNumber) {
      console.error('Erro ao enviar SMS: Número remetente não configurado');
      return false;
    }
    
    // Formatar o número do destinatário se necessário
    let toNumber = params.to;
    if (!toNumber.startsWith('+')) {
      // Se não começar com +, assumimos que é um número brasileiro e adicionamos o código
      toNumber = toNumber.startsWith('55') ? `+${toNumber}` : `+55${toNumber}`;
    }
    
    // Remover caracteres não numéricos do número (exceto o +)
    toNumber = toNumber.replace(/[^\d+]/g, '');
    
    // Enviar SMS
    const message = await twilioClient.messages.create({
      body: params.body,
      from: fromNumber,
      to: toNumber
    });
    
    console.log(`SMS enviado com sucesso. SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('Erro ao enviar SMS:', error);
    return false;
  }
}

/**
 * Envia SMS com credenciais para um novo estudante
 * @param phone Número de telefone do estudante
 * @param cpf CPF do estudante (usado como senha inicial)
 * @param name Nome do estudante
 * @param email Email do estudante (usado como login)
 * @returns Promise<boolean> Indica se o envio foi bem-sucedido
 */
export async function sendStudentCredentialsSMS(
  phone: string,
  cpf: string,
  name: string,
  email: string
): Promise<boolean> {
  try {
    // Se o número de telefone não for fornecido, retorna falso
    if (!phone) {
      console.warn('Não foi possível enviar SMS: número de telefone não fornecido');
      return false;
    }
    
    // Remover formatação do CPF (pontos e traços)
    const cleanCpf = cpf.replace(/[^\d]/g, '');
    
    // Obter apenas o primeiro nome
    const firstName = name.split(' ')[0];
    
    // Texto do SMS com as credenciais
    const smsText = `Olá ${firstName}! Sua conta no Portal do Aluno da EdunexIA foi criada. Login: ${email} / Senha: ${cleanCpf} (seu CPF). Acesse: portal.edunexa.com/login`;
    
    // Enviar o SMS
    return await sendSMS({
      to: phone,
      body: smsText
    });
  } catch (error) {
    console.error('Erro ao enviar SMS de credenciais:', error);
    return false;
  }
}