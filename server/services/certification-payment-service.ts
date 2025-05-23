/**
 * Serviço para gerenciamento de pagamentos de certificação em lote via Asaas
 * 
 * Este serviço gerencia a criação de cobranças para lotes de certificação,
 * utilizando a API do Asaas para processar pagamentos únicos para múltiplos certificados.
 */

import axios from 'axios';
import { AsaasDirectPaymentService } from './asaas-direct-payment-service';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { users } from '@shared/schema';

// Chave específica para certificações (definida pelo usuário)
const ASAAS_API_KEY = process.env.ASAAS_CERTIFIC_KEY || '$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmY4ZmQ2MTVhLWUwMmUtNDkxMC05NTQ3LTZmZTYzMTIyNzk4Nzo6JGFhY2hfNTlhMmU5NDYtMGE2ZC00OWExLWEwN2MtZDZiNzZkYjZjYmEz';
// Sempre usar ambiente de produção
const ASAAS_API_URL = 'https://api.asaas.com/v3';

// Log para rastrear a configuração
console.log(`[ASAAS CERTIFICATION] Utilizando ambiente de produção: ${ASAAS_API_URL}`);
console.log(`[ASAAS CERTIFICATION] Token da API (ASAAS_CERTIFIC_KEY): ${ASAAS_API_KEY?.substring(0, 10)}...`);

// Configuração do cliente Axios para a API do Asaas
const asaasClient = axios.create({
  baseURL: ASAAS_API_URL,
  headers: {
    'access_token': ASAAS_API_KEY,
    'Content-Type': 'application/json'
  }
});

// Interface para solicitação de certificação em lote
export interface BatchCertificationRequest {
  partnerId: number;           // ID do parceiro
  students: BatchStudent[];    // Lista de alunos para certificação
  unitPrice: number;           // Preço unitário por certificado
  totalAmount: number;         // Valor total do lote
}

// Interface para alunos no lote
export interface BatchStudent {
  name: string;               // Nome do aluno
  cpf: string;                // CPF do aluno
  email: string;              // Email do aluno
  phone?: string;             // Telefone do aluno (opcional)
  courseId: string;           // ID do curso
  courseName: string;         // Nome do curso
}

// Interface para resposta de pagamento
export interface CertificationPaymentResponse {
  success: boolean;            // Indicador de sucesso
  paymentId?: string;          // ID do pagamento (se sucesso)
  paymentLink?: string;        // Link de pagamento (se sucesso)
  invoiceUrl?: string;         // URL da fatura (se disponível)
  pixUrl?: string;             // URL do QR Code PIX (se disponível)
  pixCode?: string;            // Código PIX copia e cola (se disponível)
  code?: string;               // Código de referência único (se sucesso)
  message?: string;            // Mensagem de erro (se falha)
  error?: any;                 // Detalhes do erro (se falha)
}

export const CertificationPaymentService = {
  /**
   * Cria ou recupera um cliente Asaas para o parceiro
   */
  async getPartnerAsaasId(partnerId: number): Promise<string> {
    try {
      // Buscar o usuário parceiro no banco de dados
      const partnerData = await db
        .select()
        .from(users)
        .where(eq(users.id, partnerId))
        .limit(1);
      
      if (!partnerData || partnerData.length === 0) {
        throw new Error(`Parceiro com ID ${partnerId} não encontrado`);
      }
      
      const partner = partnerData[0];
      
      // Verificar se é realmente um parceiro
      if (partner.portalType !== 'partner') {
        throw new Error(`Usuário com ID ${partnerId} não é um parceiro`);
      }
      
      // Agora que temos o campo asaasId na tabela users, vamos verificar se o parceiro já tem um ID Asaas
      console.log(`[CERTIFICATION] Verificando ou criando cliente Asaas para o parceiro ${partnerId}`);
      
      // Verificar se o usuário já tem um ID Asaas armazenado
      if (partner.asaasId) {
        console.log(`[CERTIFICATION] Parceiro já possui ID Asaas armazenado: ${partner.asaasId}`);
        return partner.asaasId;
      }
      
      // Verificar se tem CPF
      if (!partner.cpf) {
        throw new Error(`Parceiro com ID ${partnerId} não possui CPF cadastrado`);
      }
      
      // Verificar se já existe um cliente com este CPF no Asaas
      const existingCustomer = await AsaasDirectPaymentService.findCustomerByCpfCnpj(partner.cpf);
      
      if (existingCustomer) {
        console.log(`[CERTIFICATION] Cliente já existe no Asaas com ID: ${existingCustomer.id}`);
        
        // Atualizar o registro do usuário com o ID Asaas encontrado
        await db.update(users)
          .set({ asaasId: existingCustomer.id })
          .where(eq(users.id, partnerId));
        
        console.log(`[CERTIFICATION] ID Asaas ${existingCustomer.id} salvo no registro do parceiro ${partnerId}`);
        return existingCustomer.id;
      }
      
      // Criar cliente no Asaas
      const asaasCustomer = await AsaasDirectPaymentService.createOrGetCustomer(
        partner.fullName || `Parceiro ${partnerId}`,
        partner.email || 'sem-email@edunexa.com',
        partner.cpf
      );
      
      // Atualizar o parceiro com o ID Asaas no banco de dados
      await db.update(users)
        .set({ asaasId: asaasCustomer.id })
        .where(eq(users.id, partnerId));
      
      console.log(`[CERTIFICATION] Parceiro ${partnerId} associado ao ID Asaas: ${asaasCustomer.id} e salvo no banco de dados`);
      
      return asaasCustomer.id;
    } catch (error) {
      console.error(`[CERTIFICATION] Erro ao obter/criar ID Asaas para parceiro ${partnerId}:`, error);
      throw error;
    }
  },
  
  /**
   * Cria um pagamento para um lote de certificações
   */
  async createBatchPayment(request: BatchCertificationRequest): Promise<CertificationPaymentResponse> {
    try {
      // Verifica se o lote tem alunos
      if (!request.students || request.students.length === 0) {
        return {
          success: false,
          message: 'O lote deve conter pelo menos um aluno'
        };
      }
      
      // Verificar campos obrigatórios
      if (!request.partnerId) {
        return {
          success: false,
          message: 'ID do parceiro é obrigatório'
        };
      }
      
      if (!request.totalAmount) {
        return {
          success: false,
          message: 'Valor total é obrigatório'
        };
      }
      
      // Obter o ID Asaas do parceiro
      const customerAsaasId = await this.getPartnerAsaasId(request.partnerId);
      
      // Criar um código único para essa cobrança
      const code = `CERT-${request.partnerId}-${Date.now()}`;
      
      // Criar a descrição do pagamento
      const totalStudents = request.students.length;
      const description = `Certificação em lote - ${totalStudents} aluno${totalStudents > 1 ? 's' : ''}`;
      
      // Data de vencimento (10 dias a partir de hoje)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 10);
      const dueDateString = dueDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      
      // Criar a cobrança no Asaas
      const paymentRequest = {
        customer: customerAsaasId,
        billingType: 'UNDEFINED', // Permite todos os tipos de pagamento
        dueDate: dueDateString,
        value: request.totalAmount,
        description,
        externalReference: code,
        postalService: false,
        // Habilitar PIX
        canBePaidWithPix: true
      };
      
      console.log(`[CERTIFICATION] Criando cobrança no Asaas:`, JSON.stringify(paymentRequest));
      
      const paymentResponse = await asaasClient.post('/payments', paymentRequest);
      
      console.log(`[CERTIFICATION] Cobrança criada com sucesso:`, JSON.stringify(paymentResponse.data));
      
      // Retornar os dados necessários para o frontend
      return {
        success: true,
        paymentId: paymentResponse.data.id,
        paymentLink: paymentResponse.data.paymentLink,
        invoiceUrl: paymentResponse.data.invoiceUrl,
        pixUrl: paymentResponse.data.pixQrCodeUrl,
        pixCode: paymentResponse.data.pixCopiaECola,
        code
      };
    } catch (error: any) {
      console.error('[CERTIFICATION] Erro ao criar pagamento para certificação em lote:', error);
      
      // Verificar se é um erro de resposta da API Asaas
      if (error.response && error.response.data) {
        console.error('[CERTIFICATION] Erro específico Asaas:', JSON.stringify(error.response.data));
        
        return {
          success: false,
          message: 'Erro na API do Asaas: ' + (
            error.response.data.errors?.description || 
            error.response.data.message || 
            'Erro desconhecido'
          ),
          error: error.response.data
        };
      }
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao criar pagamento',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
};