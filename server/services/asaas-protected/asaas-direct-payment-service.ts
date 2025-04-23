/**
 * Serviço otimizado para criação de links de pagamento via Asaas
 * 
 * Este serviço utiliza a API de cobranças do Asaas para gerar links de pagamento
 * completos, contornando problemas de configuração de domínio e aproveitando
 * todas as funcionalidades disponíveis.
 *
 * ⚠️ AVISO IMPORTANTE ⚠️
 * Este arquivo contém código crítico para integração com a API Asaas.
 * NÃO MODIFIQUE este arquivo sem consultar a versão protegida e a documentação em:
 * server/services/asaas-protected/
 * 
 * Alterações indevidas podem causar falhas na comunicação com a API Asaas.
 */

import axios from 'axios';

// Configurações da API do Asaas - usando a chave correta
const ASAAS_API_KEY = process.env.ASAAS_ZAYN_KEY;
// Sempre usar ambiente de produção
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';

// Log para rastrear a configuração
console.log(`[ASAAS DIRECT] Utilizando ambiente de produção: ${ASAAS_API_URL}`);
console.log(`[ASAAS DIRECT] Token da API (ASAAS_ZAYN_KEY): ${ASAAS_API_KEY?.substring(0, 10)}...`);

// Verificar se a chave está definida
if (!ASAAS_API_KEY) {
  console.error('[ASAAS DIRECT] ERRO CRÍTICO: Chave de API Asaas não encontrada!');
  console.error('[ASAAS DIRECT] Verifique a variável de ambiente: ASAAS_ZAYN_KEY');
}

// Configuração do cliente Axios para a API do Asaas
const asaasClient = axios.create({
  baseURL: ASAAS_API_URL,
  headers: {
    'access_token': ASAAS_API_KEY,
    'Content-Type': 'application/json'
  }
});

// Interface para criação de cliente no Asaas
interface AsaasCustomerRequest {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  externalReference?: string;
  personType?: 'FISICA' | 'JURIDICA';
}

// Interface para resposta de criação/busca de cliente
interface AsaasCustomerResponse {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  externalReference?: string;
  dateCreated: string;
}

// Interface para link de pagamento
interface AsaasPaymentLinkRequest {
  name: string;
  description?: string;
  value: number;
  billingType?: string;
  chargeType?: string;
  dueDateLimitDays?: number;
  maxInstallmentCount?: number;
  showDescription?: boolean;
  showNegotiationTerms?: boolean;
  fine?: number;
  interest?: number;
  externalReference?: string;
}

// Interface para resposta de link de pagamento
interface AsaasPaymentLinkResponse {
  id: string;
  url: string;
  name: string;
  description?: string;
  value: number;
  billingType?: string;
  chargeType?: string;
  dueDateLimitDays?: number;
  subscriptionCycle?: string;
  maxInstallmentCount?: number;
  fine?: number;
  interest?: number;
  active: boolean;
  dateCreated: string;
  externalReference?: string;
  totalPayments?: number;
  totalValue?: number;
  lastPayment?: {
    id: string;
    value: number;
    paymentDate: string;
  };
}

// Interface para criação de cobrança
interface AsaasPaymentRequest {
  customer: string;                 // ID do cliente no Asaas
  billingType: string;              // Tipo de cobrança (BOLETO, CREDIT_CARD, PIX, etc.)
  value: number;                    // Valor da cobrança
  dueDate: string;                  // Data de vencimento (YYYY-MM-DD)
  description?: string;             // Descrição da cobrança
  externalReference?: string;       // Referência externa
  postalService?: boolean;          // Serviço de envio postal
  // Opções avançadas
  installmentCount?: number;        // Número de parcelas
  installmentValue?: number;        // Valor de cada parcela
  discount?: {
    value: number;                  // Valor do desconto
    dueDateLimitDays?: number;      // Limite de dias para o desconto
    type: 'FIXED' | 'PERCENTAGE';   // Tipo de desconto
  };
  interest?: {
    value: number;                  // Valor de juros (%)
  };
  fine?: {
    value: number;                  // Valor da multa (%)
  };
}

// Interface para resposta de criação de cobrança
interface AsaasPaymentResponse {
  id: string;
  dateCreated: string;
  customer: string;
  paymentLink?: string;
  dueDate: string;
  value: number;
  netValue: number;
  billingType: string;
  status: string;
  description?: string;
  externalReference?: string;
  originalValue?: number;
  interestValue?: number;
  fine?: number;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  transactionReceiptUrl?: string;
  invoiceNumber?: string;
  creditCard?: {
    creditCardToken?: string;
    creditCardNumber?: string;
    creditCardBrand?: string;
  };
  pixQrCodeUrl?: string;
  pixCopiaECola?: string;
  nossoNumero?: string;
  deleted: boolean;
}

// Formatar data para o padrão da API (YYYY-MM-DD)
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Obter uma data futura em formato YYYY-MM-DD
function getFutureDateString(daysToAdd: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return formatDate(date);
}

export const AsaasDirectPaymentService = {
  /**
   * Cria ou encontra um cliente no Asaas
   */
  async createOrGetCustomer(
    name: string, 
    email: string, 
    cpf: string
  ): Promise<AsaasCustomerResponse> {
    try {
      // Formata o CPF removendo caracteres não numéricos
      const formattedCpf = cpf.replace(/[^\d]+/g, '');
      
      console.log(`[ASAAS DIRECT] Buscando cliente pelo CPF/CNPJ: ${formattedCpf}`);
      
      // Primeira tentativa: busca por listagem
      try {
        const searchResponse = await asaasClient.get('/customers', {
          params: { cpfCnpj: formattedCpf }
        });
        
        console.log(`[ASAAS DIRECT] Resposta da API de listagem:`, JSON.stringify(searchResponse.data));
        
        if (searchResponse.data.data && searchResponse.data.data.length > 0) {
          console.log(`[ASAAS DIRECT] Cliente encontrado pelo CPF/CNPJ`);
          return searchResponse.data.data[0];
        }
      } catch (listError) {
        console.log(`[ASAAS DIRECT] Erro na busca por listagem:`, listError);
      }
      
      // Segunda tentativa: busca direta
      try {
        const specificResponse = await asaasClient.get(`/customers?cpfCnpj=${formattedCpf}`);
        
        if (specificResponse.data.data && specificResponse.data.data.length > 0) {
          console.log(`[ASAAS DIRECT] Cliente encontrado por busca direta`);
          return specificResponse.data.data[0];
        }
      } catch (specificError) {
        console.log(`[ASAAS DIRECT] Erro na busca direta:`, specificError);
      }
      
      // Cliente não encontrado, criar um novo
      console.log(`[ASAAS DIRECT] Cliente não encontrado. Criando novo cliente...`);
      
      const createCustomerPayload: AsaasCustomerRequest = {
        name,
        email,
        cpfCnpj: formattedCpf
      };
      
      try {
        const createResponse = await asaasClient.post('/customers', createCustomerPayload);
        console.log(`[ASAAS DIRECT] Cliente criado com sucesso:`, JSON.stringify(createResponse.data));
        return createResponse.data;
      } catch (createError: any) {
        // Capturar detalhes mais específicos do erro da API Asaas
        let errorMessage = createError?.message || 'Erro desconhecido';
        
        // Verificar se há detalhes do erro na resposta da API
        if (createError.response && createError.response.data && createError.response.data.errors) {
          const apiErrors = createError.response.data.errors;
          errorMessage = apiErrors.map((err: any) => `${err.description} (${err.code})`).join('; ');
          console.error(`[ASAAS DIRECT] Erro detalhado da API: ${JSON.stringify(apiErrors)}`);
        }
        
        console.error(`[ASAAS DIRECT] Erro ao criar cliente: ${errorMessage}`);
        throw new Error(`Erro ao criar cliente no Asaas: ${errorMessage}`);
      }
    } catch (error) {
      console.error('[ASAAS DIRECT] Erro ao criar/buscar cliente no Asaas:', error);
      throw error;
    }
  },
  
  /**
   * Busca um cliente pelo CPF/CNPJ
   */
  async findCustomerByCpfCnpj(cpfCnpj: string): Promise<AsaasCustomerResponse | null> {
    try {
      // Formata o CPF removendo caracteres não numéricos
      const formattedCpf = cpfCnpj.replace(/[^\d]+/g, '');
      
      console.log(`[ASAAS DIRECT] Buscando cliente pelo CPF/CNPJ: ${formattedCpf}`);
      
      // Tentativa de busca por listagem
      const searchResponse = await asaasClient.get('/customers', {
        params: { cpfCnpj: formattedCpf }
      });
      
      if (searchResponse.data.data && searchResponse.data.data.length > 0) {
        console.log(`[ASAAS DIRECT] Cliente encontrado pelo CPF/CNPJ`);
        return searchResponse.data.data[0];
      }
      
      console.log(`[ASAAS DIRECT] Cliente não encontrado pelo CPF/CNPJ: ${formattedCpf}`);
      return null;
    } catch (error) {
      console.error('[ASAAS DIRECT] Erro ao buscar cliente por CPF/CNPJ:', error);
      return null;
    }
  },
  
  /**
   * Cria um novo cliente no Asaas
   */
  async createCustomer(customerData: AsaasCustomerRequest): Promise<AsaasCustomerResponse> {
    try {
      // Garantir que o CPF/CNPJ esteja no formato correto (apenas números)
      if (customerData.cpfCnpj) {
        // Remover formatação (pontos, traços, barras)
        customerData.cpfCnpj = customerData.cpfCnpj.replace(/[^\d]+/g, '');
        console.log(`[ASAAS DIRECT] CPF/CNPJ formatado: ${customerData.cpfCnpj}`);
      }
      
      // Adicionar o tipo de pessoa se não estiver definido
      if (!customerData.personType) {
        customerData.personType = 'FISICA'; // Valor padrão
        console.log(`[ASAAS DIRECT] Tipo de pessoa definido para FISICA`);
      }
      
      console.log(`[ASAAS DIRECT] Criando novo cliente no Asaas:`, JSON.stringify(customerData));
      
      try {
        const createResponse = await asaasClient.post('/customers', customerData);
        console.log(`[ASAAS DIRECT] Cliente criado com sucesso:`, JSON.stringify(createResponse.data));
        return createResponse.data;
      } catch (createError: any) {
        // Capturar detalhes mais específicos do erro da API Asaas
        let errorMessage = createError?.message || 'Erro desconhecido';
        
        // Verificar se há detalhes do erro na resposta da API
        if (createError.response && createError.response.data && createError.response.data.errors) {
          const apiErrors = createError.response.data.errors;
          errorMessage = apiErrors.map((err: any) => `${err.description} (${err.code})`).join('; ');
          console.error(`[ASAAS DIRECT] Erro detalhado da API: ${JSON.stringify(apiErrors)}`);
        }
        
        console.error(`[ASAAS DIRECT] Erro ao criar cliente: ${errorMessage}`);
        throw new Error(`Erro ao criar cliente no Asaas: ${errorMessage}`);
      }
    } catch (error) {
      console.error('[ASAAS DIRECT] Erro ao criar cliente no Asaas:', error);
      throw error;
    }
  },
  
  /**
   * Cria um link de pagamento no Asaas
   */
  async createPaymentLink(linkData: AsaasPaymentLinkRequest): Promise<AsaasPaymentLinkResponse> {
    try {
      console.log('[ASAAS DIRECT] Criando link de pagamento no Asaas:', JSON.stringify(linkData, null, 2));
      
      const response = await asaasClient.post('/paymentLinks', linkData);
      
      console.log('[ASAAS DIRECT] Link de pagamento criado com sucesso:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error('[ASAAS DIRECT] Erro ao criar link de pagamento no Asaas:', error);
      throw error;
    }
  },
  
  /**
   * Busca detalhes de um link de pagamento pelo ID
   */
  async getPaymentLinkById(linkId: string): Promise<AsaasPaymentLinkResponse> {
    try {
      console.log(`[ASAAS DIRECT] Buscando detalhes do link de pagamento: ${linkId}`);
      
      const response = await asaasClient.get(`/paymentLinks/${linkId}`);
      
      console.log('[ASAAS DIRECT] Detalhes do link de pagamento obtidos com sucesso');
      
      return response.data;
    } catch (error) {
      console.error(`[ASAAS DIRECT] Erro ao buscar detalhes do link de pagamento (ID: ${linkId}):`, error);
      throw error;
    }
  },
  
  /**
   * Remove um link de pagamento
   */
  async deletePaymentLink(linkId: string): Promise<{ deleted: boolean }> {
    try {
      console.log(`[ASAAS DIRECT] Removendo link de pagamento: ${linkId}`);
      
      const response = await asaasClient.delete(`/paymentLinks/${linkId}`);
      
      console.log('[ASAAS DIRECT] Link de pagamento removido com sucesso');
      
      return { deleted: true };
    } catch (error) {
      console.error(`[ASAAS DIRECT] Erro ao remover link de pagamento (ID: ${linkId}):`, error);
      throw error;
    }
  },
  
  /**
   * Cria uma cobrança completa no Asaas com link de pagamento
   */
  async createPaymentWithLink(
    customerId: string,
    value: number,
    description: string,
    externalReference: string
  ): Promise<AsaasPaymentResponse> {
    try {
      // Payload avançado com todas as opções disponíveis
      const paymentPayload: AsaasPaymentRequest = {
        customer: customerId,
        billingType: 'UNDEFINED', // Permite que o cliente escolha o método de pagamento
        value,
        dueDate: getFutureDateString(7), // Vencimento em 7 dias
        description,
        externalReference,
        // Configuração de multa por atraso (2%)
        fine: {
          value: 2
        },
        // Configuração de juros por atraso (1% ao mês)
        interest: {
          value: 1
        },
        // Desconto para pagamento antecipado (5%)
        discount: {
          value: 5,
          dueDateLimitDays: 3, // Até 3 dias antes do vencimento
          type: 'PERCENTAGE' // Valor percentual
        }
      };
      
      console.log('[ASAAS DIRECT] Criando cobrança no Asaas:', JSON.stringify(paymentPayload, null, 2));
      
      const paymentResponse = await asaasClient.post('/payments', paymentPayload);
      
      console.log('[ASAAS DIRECT] Cobrança criada com sucesso:', JSON.stringify(paymentResponse.data, null, 2));
      
      return paymentResponse.data;
    } catch (error) {
      console.error('[ASAAS DIRECT] Erro ao criar cobrança no Asaas:', error);
      throw error;
    }
  },
  
  /**
   * Busca detalhes de uma cobrança
   */
  async getPaymentById(paymentId: string): Promise<AsaasPaymentResponse> {
    try {
      const response = await asaasClient.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error(`[ASAAS DIRECT] Erro ao buscar cobrança (ID: ${paymentId}):`, error);
      throw error;
    }
  },
  
  /**
   * Cancela uma cobrança
   */
  async cancelPayment(paymentId: string): Promise<{ deleted: boolean }> {
    try {
      const response = await asaasClient.delete(`/payments/${paymentId}`);
      return { deleted: response.data.deleted || false };
    } catch (error) {
      console.error(`[ASAAS DIRECT] Erro ao cancelar cobrança (ID: ${paymentId}):`, error);
      throw error;
    }
  }
};