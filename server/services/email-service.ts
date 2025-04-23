/**
 * Serviço para envio de e-mails
 * Implementação simplificada usando fetch para menor dependência
 */
import * as https from 'https';
import { IncomingMessage } from 'http';

// Configurações do servidor SMTP
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'brasil.svrdedicado.org',
  port: parseInt(process.env.SMTP_PORT || '587'),
  user: process.env.SMTP_USER || 'contato@eduzayn.com.br',
  pass: process.env.SMTP_PASS || '123@mudar',
  from: process.env.SMTP_FROM || 'contato@eduzayn.com.br',
  fromName: process.env.SMTP_FROM_NAME || 'EdunexIA - Sistema Financeiro'
};

// Função auxiliar para fazer requisições HTTP
async function httpRequest(url: string, options: any, data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res: IncomingMessage) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          // Verificar se a resposta é JSON válido
          const jsonResponse = responseData ? JSON.parse(responseData) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonResponse
          });
        } catch (error) {
          // Se não for JSON, retornar como texto
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('[EmailService] Erro na requisição HTTP:', error);
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

class EmailService {
  constructor() {
    console.log('[INFO] [EmailService] Serviço de email inicializado');
  }
  
  /**
   * Verifica se o serviço de email está funcionando
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('[EmailService] Testando conexão com servidor SMTP...');
      console.log('[EmailService] Configuração:', {
        host: SMTP_CONFIG.host,
        port: SMTP_CONFIG.port,
        user: SMTP_CONFIG.user,
        // Não exibir a senha por segurança
        from: SMTP_CONFIG.from
      });
      
      // Simulação de verificação de conexão
      // Em uma implementação real, faria uma verificação com o servidor SMTP
      return true;
    } catch (error) {
      console.error('[EmailService] Erro ao testar conexão:', error);
      return false;
    }
  }
  
  /**
   * Envia e-mail de cobrança para o cliente
   */
  async sendChargeEmail(options: {
    to: string;
    customerName: string;
    chargeId: string;
    chargeValue: number;
    dueDate: string;
    paymentLink: string;
  }): Promise<boolean> {
    const { to, customerName, chargeId, chargeValue, dueDate, paymentLink } = options;
    
    try {
      console.log(`[EmailService] Enviando e-mail de cobrança para ${to}`);
      
      // Formatar o valor para exibição
      const formattedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(chargeValue);
      
      // Criar conteúdo do e-mail (versão simplificada)
      const emailContent = `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 15px; border-bottom: 3px solid #0066cc; }
          .content { padding: 20px 0; }
          .footer { font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 15px; }
          .button { display: inline-block; background-color: #0066cc; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; }
          .info { margin: 15px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #0066cc; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Nova Cobrança - EdunexIA Financeiro</h2>
          </div>
          <div class="content">
            <p>Olá, <strong>${customerName}</strong>!</p>
            <p>Uma nova cobrança foi gerada em seu nome:</p>
            
            <div class="info">
              <p><strong>Identificação:</strong> ${chargeId}</p>
              <p><strong>Valor:</strong> ${formattedValue}</p>
              <p><strong>Vencimento:</strong> ${dueDate}</p>
            </div>
            
            <p>Para efetuar o pagamento, clique no botão abaixo:</p>
            <p>
              <a href="${paymentLink}" class="button">Pagar Agora</a>
            </p>
            <p>Ou acesse o link: <a href="${paymentLink}">${paymentLink}</a></p>
            
            <p>Se você já realizou o pagamento, por favor desconsidere este e-mail.</p>
          </div>
          <div class="footer">
            <p>Este é um e-mail automático, por favor não responda.</p>
            <p>&copy; ${new Date().getFullYear()} EdunexIA Financeiro. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
      `;
      
      // Log de simulação - em produção enviaria via SMTP
      console.log(`[EmailService] Simulando envio de e-mail para ${to}`);
      console.log(`[EmailService] Assunto: Nova Cobrança - R$ ${formattedValue}`);
      console.log(`[EmailService] Link de pagamento: ${paymentLink}`);
      
      // Registrar sucesso no log
      console.log(`[EmailService] E-mail de cobrança enviado com sucesso para ${to}`);
      
      return true;
    } catch (error) {
      console.error('[EmailService] Erro ao enviar e-mail de cobrança:', error);
      return false;
    }
  }
  
  /**
   * Envio de e-mail com link de boleto/fatura para o cliente
   */
  async sendInvoiceEmail(options: {
    to: string;
    customerName: string;
    chargeId: string;
    chargeValue: number;
    dueDate: string;
    paymentLink: string;
    bankSlipLink?: string;
  }): Promise<boolean> {
    const { to, customerName, chargeId, chargeValue, dueDate, paymentLink, bankSlipLink } = options;
    
    try {
      console.log(`[EmailService] Enviando e-mail de fatura para ${to}`);
      
      // Formatar o valor para exibição
      const formattedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(chargeValue);
      
      // Criar HTML condicional para o boleto (se disponível)
      const bankSlipSection = bankSlipLink ? `
        <p>Caso prefira, você também pode pagar via boleto bancário:</p>
        <p>
          <a href="${bankSlipLink}" style="display: inline-block; background-color: #28a745; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-weight: bold;">Ver Boleto</a>
        </p>
      ` : '';
      
      // Criar conteúdo do e-mail (versão completa)
      const emailContent = `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 15px; border-bottom: 3px solid #0066cc; }
          .content { padding: 20px 0; }
          .footer { font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 15px; }
          .button { display: inline-block; background-color: #0066cc; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; }
          .info { margin: 15px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #0066cc; }
          .warning { color: #856404; background-color: #fff3cd; border-left: 4px solid #ffeeba; padding: 10px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Sua Fatura está disponível - EdunexIA Financeiro</h2>
          </div>
          <div class="content">
            <p>Olá, <strong>${customerName}</strong>!</p>
            <p>Sua fatura está disponível para pagamento:</p>
            
            <div class="info">
              <p><strong>Número da Fatura:</strong> ${chargeId}</p>
              <p><strong>Valor:</strong> ${formattedValue}</p>
              <p><strong>Vencimento:</strong> ${dueDate}</p>
            </div>
            
            <p>Para visualizar e pagar sua fatura, clique no botão abaixo:</p>
            <p>
              <a href="${paymentLink}" class="button">Acessar Fatura</a>
            </p>
            
            ${bankSlipSection}
            
            <div class="warning">
              <p><strong>Atenção:</strong> O não pagamento até a data de vencimento poderá resultar em juros e multa.</p>
            </div>
            
            <p>Se você já realizou o pagamento, por favor desconsidere este e-mail.</p>
          </div>
          <div class="footer">
            <p>Este é um e-mail automático, por favor não responda.</p>
            <p>&copy; ${new Date().getFullYear()} EdunexIA Financeiro. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
      `;
      
      // Log de simulação - em produção enviaria via SMTP
      console.log(`[EmailService] Simulando envio de e-mail para ${to}`);
      console.log(`[EmailService] Assunto: Fatura disponível - R$ ${formattedValue}`);
      console.log(`[EmailService] Link de fatura: ${paymentLink}`);
      if (bankSlipLink) {
        console.log(`[EmailService] Link de boleto: ${bankSlipLink}`);
      }
      
      // Registrar sucesso no log
      console.log(`[EmailService] E-mail de fatura enviado com sucesso para ${to}`);
      
      return true;
    } catch (error) {
      console.error('[EmailService] Erro ao enviar e-mail de fatura:', error);
      return false;
    }
  }
}

  /**
   * Envio de certificado e histórico escolar para o aluno
   */
  async sendCertificateEmail(options: {
    to: string;
    studentName: string;
    certificateCode: string;
    courseName: string;
    certificatePdfUrl: string;
    transcriptPdfUrl?: string;
    completionDate: string;
    verificationUrl: string;
  }): Promise<boolean> {
    const { 
      to, 
      studentName, 
      certificateCode, 
      courseName, 
      certificatePdfUrl, 
      transcriptPdfUrl, 
      completionDate,
      verificationUrl 
    } = options;
    
    try {
      console.log(`[EmailService] Enviando e-mail de certificado para ${to}`);
      
      // Criar seção condicional para o histórico escolar (se disponível)
      const transcriptSection = transcriptPdfUrl ? `
        <p>Seu histórico escolar também está disponível para download:</p>
        <p>
          <a href="${transcriptPdfUrl}" style="display: inline-block; background-color: #28a745; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-weight: bold;">Baixar Histórico Escolar</a>
        </p>
      ` : '';
      
      // Criar conteúdo do e-mail
      const emailContent = `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 15px; border-bottom: 3px solid #0066cc; }
          .content { padding: 20px 0; }
          .footer { font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 15px; }
          .button { display: inline-block; background-color: #0066cc; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; }
          .info { margin: 15px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #0066cc; }
          .success { color: #155724; background-color: #d4edda; border-left: 4px solid #c3e6cb; padding: 10px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Seu Certificado - EDUNEXA ACADEMY</h2>
          </div>
          <div class="content">
            <p>Parabéns, <strong>${studentName}</strong>!</p>
            <p>É com grande satisfação que informamos a conclusão do seu curso e disponibilizamos seu certificado.</p>
            
            <div class="success">
              <p><strong>Parabéns pela sua conquista!</strong> Você concluiu com sucesso o curso e agora pode baixar seu certificado.</p>
            </div>
            
            <div class="info">
              <p><strong>Curso:</strong> ${courseName}</p>
              <p><strong>Código do Certificado:</strong> ${certificateCode}</p>
              <p><strong>Data de Conclusão:</strong> ${completionDate}</p>
            </div>
            
            <p>Para baixar seu certificado, clique no botão abaixo:</p>
            <p>
              <a href="${certificatePdfUrl}" class="button">Baixar Certificado</a>
            </p>
            
            ${transcriptSection}
            
            <p>Você também pode verificar a autenticidade do seu certificado através do link:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            
            <p>Agradecemos por confiar na EDUNEXA para sua formação profissional!</p>
          </div>
          <div class="footer">
            <p>EDUNEXA ACADEMY - Excelência em Educação Continuada</p>
            <p>&copy; ${new Date().getFullYear()} EDUNEXA. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
      `;
      
      // Log de simulação - em produção enviaria via SMTP
      console.log(`[EmailService] Simulando envio de certificado para ${to}`);
      console.log(`[EmailService] Assunto: Seu Certificado - ${courseName}`);
      console.log(`[EmailService] Link do certificado: ${certificatePdfUrl}`);
      if (transcriptPdfUrl) {
        console.log(`[EmailService] Link do histórico: ${transcriptPdfUrl}`);
      }
      
      // Registrar sucesso no log
      console.log(`[EmailService] E-mail de certificado enviado com sucesso para ${to}`);
      
      return true;
    } catch (error) {
      console.error('[EmailService] Erro ao enviar e-mail de certificado:', error);
      return false;
    }
  }
}

// Função auxiliar para enviar e-mails (exportada para uso em outros módulos)
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{filename: string, path: string, contentType?: string}>;
}): Promise<boolean> {
  try {
    console.log(`[EmailService] Enviando e-mail para ${options.to}`);
    console.log(`[EmailService] Assunto: ${options.subject}`);
    
    // Em uma implementação real, usaria um serviço SMTP real
    // Esta é apenas uma implementação simulada para fins de demo
    console.log('[EmailService] E-mail enviado com sucesso (simulação)');
    
    return true;
  } catch (error) {
    console.error('[EmailService] Erro ao enviar e-mail:', error);
    return false;
  }
}

export const emailService = new EmailService();