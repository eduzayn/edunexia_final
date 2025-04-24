/**
 * AVISO DE PROTEÇÃO: Este arquivo contém lógica crítica para o sistema de matrículas simplificadas.
 * Não faça alterações neste código a menos que seja absolutamente necessário.
 * Qualquer modificação requer aprovação e deve ser feita com extremo cuidado.
 * Data de estabilização: 23/04/2025
 * 
 * Este serviço é responsável pela comunicação entre o frontend e o backend para o
 * módulo de matrículas simplificadas, essencial para o processo de integração com Asaas.
 */

import { apiRequest } from '../lib/queryClient';

/**
 * Interface para o objeto de matrícula simplificada
 */
export interface NewSimplifiedEnrollment {
  id: number;
  studentName: string;
  studentEmail: string;
  studentCpf: string;
  studentPhone?: string;
  courseId: number;
  courseName: string;
  institutionId: number;
  institutionName: string;
  poloId?: number | null;
  poloName?: string | null;
  amount: number;
  status: 'pending' | 'waiting_payment' | 'payment_confirmed' | 'completed' | 'cancelled' | 'failed';
  paymentId?: string | null;
  paymentLinkId?: string | null;
  paymentLinkUrl?: string | null;
  asaasCustomerId?: string | null;
  externalReference?: string | null;
  sourceChannel?: string | null;
  errorDetails?: string | null;
  createdAt: string;
  createdById?: number | null;
  updatedAt: string;
  updatedById?: number | null;
}

/**
 * Interface para formulário de criação de matrícula simplificada
 */
export interface CreateSimplifiedEnrollmentData {
  studentName: string;
  studentEmail: string;
  studentCpf: string;
  studentPhone?: string;
  courseId: number;
  institutionId: number;
  poloId?: number | null;
  amount: number;
  sourceChannel?: string;
  // Campos obrigatórios para criação de pagamento
  uuid?: string; // Será gerado pelo backend se não for fornecido
  fullPrice?: number; // Será o mesmo que amount se não for fornecido
  expiresAt?: Date | string; // Será definido pelo backend (30 dias) se não for fornecido
  paymentGateway?: string; // Default "asaas"
  // Dados de endereço do aluno
  studentAddress?: string;
  studentAddressNumber?: string;
  studentAddressComplement?: string;
  studentNeighborhood?: string;
  studentCity?: string;
  studentState?: string;
  studentPostalCode?: string;
  // Configurações de pagamento Asaas
  billingType?: 'UNDEFINED' | 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  maxInstallmentCount?: number;
  dueDateLimitDays?: number;
  allowInstallments?: boolean;
  interestRate?: number;
  fine?: number;
}

/**
 * Interface para resposta paginada da API
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  page: number;
  limit: number;
  pages: number;
  total: number;
}

/**
 * Lista matrículas simplificadas com filtros e paginação
 */
export interface ListSimplifiedEnrollmentsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

/**
 * Verifica se uma resposta contém HTML em vez de JSON
 * @param text Texto a ser verificado
 * @returns true se o texto parece ser HTML
 */
const isHtml = (text: string): boolean => {
  return text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('<body');
};

/**
 * Processa uma resposta HTTP para verificar se é JSON válido
 * @param response Resposta da fetch API
 * @param operation Nome da operação para mensagens de erro
 * @returns Objeto JSON analisado
 * @throws Erro com mensagens específicas para diferentes tipos de falha
 */
const processApiResponse = async <T>(response: Response, operation: string): Promise<T> => {
  // Verificar se a resposta tem status ok
  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    
    try {
      // Se for JSON, tentar extrair a mensagem de erro
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.clone().json();
        throw new Error(
          errorData.message || `Erro ao ${operation}: ${response.status} ${response.statusText}`
        );
      } else {
        // Se não for JSON, tentar ler como texto
        const errorText = await response.clone().text();
        
        if (isHtml(errorText)) {
          throw new Error(`Erro na comunicação com o servidor: Recebido HTML em vez de JSON. Status: ${response.status}`);
        } else {
          throw new Error(`Erro ao ${operation}: ${response.status} ${response.statusText}`);
        }
      }
    } catch (readError) {
      if (readError instanceof Error) {
        throw readError; // Repassar o erro se já tiver uma mensagem adequada
      }
      // Erro genérico se não conseguiu ler o corpo
      throw new Error(`Erro ao ${operation}: ${response.status} ${response.statusText}`);
    }
  }
  
  // Verificar o tipo de conteúdo
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    try {
      // Ler o corpo para diagnóstico
      const text = await response.clone().text();
      
      if (isHtml(text)) {
        throw new Error('Recebido HTML em vez de JSON. A API retornou uma página web em vez de dados.');
      } else {
        throw new Error(`Resposta inválida da API: Tipo de conteúdo '${contentType}' não é JSON`);
      }
    } catch (readError) {
      if (readError instanceof Error) {
        throw readError; // Repassar o erro se já tiver uma mensagem adequada
      }
      // Erro genérico
      throw new Error(`Resposta inválida da API: Tipo de conteúdo '${contentType}' não é JSON`);
    }
  }
  
  // Tentar converter para JSON
  try {
    return await response.json();
  } catch (jsonError) {
    // Ler o corpo para diagnóstico em caso de falha
    try {
      const text = await response.text();
      
      if (isHtml(text)) {
        throw new Error('Erro de parsing JSON: Recebido HTML em vez de JSON');
      } else {
        throw new Error('Erro de parsing JSON: A resposta não é um JSON válido');
      }
    } catch (readError) {
      if (readError instanceof Error) {
        throw readError; // Repassar o erro se já tiver uma mensagem adequada
      }
      // Erro genérico para problemas de parsing JSON
      throw new Error('Erro de parsing JSON: A resposta não pôde ser convertida para JSON');
    }
  }
};

/**
 * Lista matrículas simplificadas com filtros e paginação
 */
export const listSimplifiedEnrollments = async (
  params: ListSimplifiedEnrollmentsParams = {}
): Promise<PaginatedResponse<NewSimplifiedEnrollment>> => {
  try {
    const { page = 1, limit = 10, search, status } = params;
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    
    if (search) {
      queryParams.append('search', search);
    }
    
    if (status) {
      queryParams.append('status', status);
    }
    
    console.log(`Realizando requisição GET /api-json/v2/simplified-enrollments?${queryParams.toString()}`);
    
    const response = await apiRequest(
      `/api-json/v2/simplified-enrollments?${queryParams.toString()}`,
      { method: 'GET' }
    );
    
    return await processApiResponse<PaginatedResponse<NewSimplifiedEnrollment>>(
      response, 
      'listar matrículas'
    );
  } catch (error) {
    console.error('Erro ao listar matrículas simplificadas:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Ocorreu um erro ao listar as matrículas. Tente novamente mais tarde.');
  }
};

/**
 * Busca detalhes de uma matrícula simplificada pelo ID
 */
export const getSimplifiedEnrollmentById = async (
  id: number
): Promise<{ success: boolean; data: NewSimplifiedEnrollment }> => {
  try {
    const response = await apiRequest(
      `/api-json/v2/simplified-enrollments/${id}`,
      { method: 'GET' }
    );
    
    return await processApiResponse<{ success: boolean; data: NewSimplifiedEnrollment }>(
      response, 
      `buscar matrícula ${id}`
    );
  } catch (error) {
    console.error(`Erro ao buscar matrícula com ID ${id}:`, error);
    throw error instanceof Error 
      ? error 
      : new Error(`Ocorreu um erro ao buscar a matrícula ${id}. Tente novamente mais tarde.`);
  }
};

/**
 * Cria uma nova matrícula simplificada
 */
export const createSimplifiedEnrollment = async (
  enrollmentData: CreateSimplifiedEnrollmentData
): Promise<{ success: boolean; data: NewSimplifiedEnrollment }> => {
  try {
    const response = await apiRequest(
      '/api-json/v2/simplified-enrollments',
      {
        method: 'POST',
        data: enrollmentData
      }
    );
    
    return await processApiResponse<{ success: boolean; data: NewSimplifiedEnrollment }>(
      response, 
      'criar matrícula'
    );
  } catch (error) {
    console.error('Erro ao criar matrícula simplificada:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Ocorreu um erro ao criar a matrícula. Tente novamente mais tarde.');
  }
};

/**
 * Gera um link de pagamento para uma matrícula
 */
export const generatePaymentLink = async (
  enrollmentId: number
): Promise<{ success: boolean; data: { paymentLinkId: string; paymentLinkUrl: string } }> => {
  try {
    const response = await apiRequest(
      `/api-json/v2/simplified-enrollments/${enrollmentId}/generate-payment-link`,
      { method: 'POST' }
    );
    
    return await processApiResponse<{ success: boolean; data: { paymentLinkId: string; paymentLinkUrl: string } }>(
      response, 
      `gerar link de pagamento para matrícula ${enrollmentId}`
    );
  } catch (error) {
    console.error(`Erro ao gerar link de pagamento para matrícula ${enrollmentId}:`, error);
    throw error instanceof Error 
      ? error 
      : new Error(`Ocorreu um erro ao gerar o link de pagamento. Tente novamente mais tarde.`);
  }
};

/**
 * Atualiza o status de pagamento de uma matrícula
 */
export const updatePaymentStatus = async (
  enrollmentId: number
): Promise<{ success: boolean; data: { status: string } }> => {
  try {
    const response = await apiRequest(
      `/api-json/v2/simplified-enrollments/${enrollmentId}/update-payment-status`,
      { method: 'POST' }
    );
    
    return await processApiResponse<{ success: boolean; data: { status: string } }>(
      response, 
      `atualizar status de pagamento da matrícula ${enrollmentId}`
    );
  } catch (error) {
    console.error(`Erro ao atualizar status de pagamento da matrícula ${enrollmentId}:`, error);
    throw error instanceof Error 
      ? error 
      : new Error(`Ocorreu um erro ao atualizar o status de pagamento. Tente novamente mais tarde.`);
  }
};

/**
 * Cancela uma matrícula
 */
export const cancelEnrollment = async (
  enrollmentId: number
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiRequest(
      `/api-json/v2/simplified-enrollments/${enrollmentId}/cancel`,
      { method: 'POST' }
    );
    
    return await processApiResponse<{ success: boolean; message: string }>(
      response, 
      `cancelar matrícula ${enrollmentId}`
    );
  } catch (error) {
    console.error(`Erro ao cancelar matrícula ${enrollmentId}:`, error);
    throw error instanceof Error 
      ? error 
      : new Error(`Ocorreu um erro ao cancelar a matrícula. Tente novamente mais tarde.`);
  }
};