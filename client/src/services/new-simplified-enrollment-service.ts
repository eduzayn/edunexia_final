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
    
    // Verificar se a resposta é válida antes de tentar converter para JSON
    if (!response.ok) {
      // Tentar ler o corpo para debug antes de lançar a exceção
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorJson = await response.clone().json();
          console.error('Erro na API (JSON):', errorJson);
          throw new Error(
            errorJson.message || `Erro ao listar matrículas: ${response.status} ${response.statusText}`
          );
        } else {
          // Se não for JSON, tentar ler como texto
          const errorText = await response.clone().text();
          console.error('Erro na API (Texto):', errorText.substring(0, 500));
          
          // Se contém DOCTYPE, é uma página HTML de erro
          if (errorText.includes('<!DOCTYPE')) {
            throw new Error(`Erro na comunicação com o servidor: Recebido HTML em vez de JSON. Status: ${response.status}`);
          } else {
            throw new Error(`Erro ao listar matrículas: ${response.status} ${response.statusText}`);
          }
        }
      } catch (readError) {
        // Se houver erro ao ler o corpo, usar o erro original
        console.error('Erro ao ler corpo da resposta de erro:', readError);
        throw new Error(`Erro ao listar matrículas: ${response.status} ${response.statusText}`);
      }
    }
    
    // Verificar o tipo de conteúdo antes de tentar converter para JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('Resposta não é JSON:', contentType);
      
      // Ler o texto para debug
      const text = await response.clone().text();
      console.error('Conteúdo da resposta não-JSON:', text.substring(0, 500));
      
      // Se contém DOCTYPE, é uma página HTML de erro
      if (text.includes('<!DOCTYPE')) {
        throw new Error('Recebido HTML em vez de JSON. A API retornou uma página web em vez dos dados esperados.');
      } else {
        throw new Error(`Resposta inválida da API: Tipo de conteúdo '${contentType}' não é JSON`);
      }
    }
    
    try {
      // Tentar converter para JSON com tratamento de erro melhorado
      return await response.json();
    } catch (jsonError) {
      console.error('Erro ao converter resposta para JSON:', jsonError);
      
      // Ler o texto para debug
      const text = await response.text();
      console.error('Conteúdo que falhou a conversão JSON:', text.substring(0, 500));
      
      if (text.includes('<!DOCTYPE')) {
        throw new Error('Erro de parsing JSON: Recebido HTML em vez de JSON');
      } else {
        throw new Error('Erro de parsing JSON: A resposta não é um JSON válido');
      }
    }
  } catch (error: any) {
    // Melhorar a mensagem de erro para o usuário
    console.error('Erro ao listar matrículas simplificadas:', error);
    
    // Se for um erro conhecido, repassar, caso contrário, criar um erro genérico
    if (error.message) {
      throw error;
    } else {
      throw new Error('Ocorreu um erro ao listar as matrículas. Tente novamente mais tarde.');
    }
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