import { MailService } from '@sendgrid/mail';

// Configuração do serviço de e-mail SendGrid
const mailService = new MailService();
if (!process.env.SENDGRID_API_KEY) {
  console.warn('AVISO: SENDGRID_API_KEY não encontrada. O envio de e-mails não funcionará corretamente.');
} else {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

// Interface para os parâmetros do e-mail
interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html: string;
}

/**
 * Envia um e-mail usando o serviço SendGrid
 * @param params Parâmetros do e-mail
 * @returns Promise<boolean> Indica se o envio foi bem-sucedido
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    // Verificar se a configuração do SendGrid está presente
    if (!process.env.SENDGRID_API_KEY) {
      console.error('Erro ao enviar e-mail: SENDGRID_API_KEY não configurada');
      return false;
    }

    // Definir e-mail de origem padrão se não foi informado
    const fromEmail = params.from || 'contato@edunexa.com';

    // Enviar e-mail
    await mailService.send({
      to: params.to,
      from: fromEmail,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    console.log(`E-mail enviado com sucesso para: ${params.to}`);
    return true;
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    return false;
  }
}

/**
 * Envia e-mail de boas-vindas com credenciais para um novo estudante
 * @param email E-mail do estudante
 * @param cpf CPF do estudante (usado como senha inicial)
 * @param name Nome completo do estudante
 * @param courseName Nome do curso
 * @returns Promise<boolean> Indica se o envio foi bem-sucedido
 */
export async function sendStudentCredentialsEmail(
  email: string,
  cpf: string,
  name: string,
  courseName: string
): Promise<boolean> {
  try {
    // Remover formatação do CPF (pontos e traços)
    const cleanCpf = cpf.replace(/[^\d]/g, '');

    // Template do e-mail de boas-vindas com credenciais
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <img src="https://edunexa.com/logo.png" alt="EdunexIA Logo" style="max-width: 150px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-bottom: 20px;">Bem-vindo(a) à EdunexIA!</h2>
        
        <p style="font-size: 16px; line-height: 1.5; color: #555;">Olá, <strong>${name}</strong>!</p>
        
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          Parabéns pela sua matrícula no curso <strong>${courseName}</strong>! Estamos muito felizes em tê-lo(a) como aluno(a).
        </p>
        
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          Seu acesso ao Portal do Aluno foi criado e você já pode acessar a plataforma utilizando as seguintes credenciais:
        </p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Login:</strong> ${email}</p>
          <p style="margin: 5px 0;"><strong>Senha:</strong> ${cleanCpf} (seu CPF sem pontos ou traços)</p>
          <p style="margin: 15px 0 5px;"><strong>Link de acesso:</strong> <a href="https://portal.edunexa.com/login" style="color: #0066cc;">https://portal.edunexa.com/login</a></p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          Após o primeiro acesso, recomendamos que você altere sua senha para uma de sua preferência.
        </p>
        
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          Além disso, informamos que o contrato de prestação de serviços educacionais já está disponível em seu Portal do Aluno. 
          Por favor, acesse a área de Contratos para visualizar e assinar digitalmente o documento.
        </p>
        
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          Se tiver qualquer dúvida ou precisar de assistência, não hesite em contatar nossa equipe de suporte.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea;">
          <p style="font-size: 14px; color: #777; margin: 5px 0;">Atenciosamente,</p>
          <p style="font-size: 14px; color: #777; margin: 5px 0;">Equipe EdunexIA</p>
          <p style="font-size: 14px; color: #777; margin: 5px 0;">suporte@edunexa.com | (11) 9999-9999</p>
        </div>
      </div>
    `;

    // Enviar o e-mail
    return await sendEmail({
      to: email,
      from: 'noreply@edunexa.com',
      subject: 'Bem-vindo(a) à EdunexIA - Seus dados de acesso ao Portal do Aluno',
      html: emailHtml
    });
  } catch (error) {
    console.error('Erro ao enviar e-mail de credenciais:', error);
    return false;
  }
}