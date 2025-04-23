/**
 * Serviço para comunicação com a API v2 de matrículas simplificadas
 */

import { apiRequest } from '../lib/queryClient';

// @ts-ignore - Ignorando erros de tipagem por enquanto para simplificar a implementação
type ApiResponse<T> = T;

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
    
    // A ordem correta é: método, URL, data, headers
    const response = await apiRequest(
      'GET',
      `/api-json/v2/simplified-enrollments?${queryParams.toString()}`
    );
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao listar matrículas simplificadas:', error);
    throw error;
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
      'GET',
      `/api-json/v2/simplified-enrollments/${id}`
    );
    return await response.json();
  } catch (error) {
    console.error(`Erro ao buscar matrícula com ID ${id}:`, error);
    throw error;
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
      'POST',
      '/api-json/v2/simplified-enrollments',
      enrollmentData
    );
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao criar matrícula simplificada:', error);
    throw error;
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
      'POST',
      `/api-json/v2/simplified-enrollments/${enrollmentId}/generate-payment-link`
    );
    
    return await response.json();
  } catch (error) {
    console.error(`Erro ao gerar link de pagamento para matrícula ${enrollmentId}:`, error);
    throw error;
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
      'POST',
      `/api-json/v2/simplified-enrollments/${enrollmentId}/update-payment-status`
    );
    
    return await response.json();
  } catch (error) {
    console.error(`Erro ao atualizar status de pagamento da matrícula ${enrollmentId}:`, error);
    throw error;
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
      'POST',
      `/api-json/v2/simplified-enrollments/${enrollmentId}/cancel`
    );
    
    return await response.json();
  } catch (error) {
    console.error(`Erro ao cancelar matrícula ${enrollmentId}:`, error);
    throw error;
  }
};