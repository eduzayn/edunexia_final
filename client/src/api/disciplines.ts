import { apiRequest } from "@/lib/queryClient";
import { Discipline } from "@shared/schema";

// Interface para verificação de completude da disciplina
export interface DisciplineCompleteness {
  isComplete: boolean;
  hasVideos: boolean;
  hasEbook: boolean;
  hasAssessments: boolean;
}

// Interface de opções de vídeo
export interface VideoOptions {
  url: string;
  source: 'youtube' | 'vimeo' | 'onedrive' | 'google_drive' | 'upload';
  startTime?: string;
}

/**
 * Busca todas as disciplinas
 * @returns Lista de disciplinas
 */
export const getDisciplines = async (): Promise<Discipline[]> => {
  const response = await apiRequest("/api/admin/disciplines");
  return response.data;
};

/**
 * Busca uma disciplina pelo ID
 * @param id ID da disciplina
 * @returns Detalhes da disciplina
 */
export const getDiscipline = async (id: string): Promise<Discipline> => {
  const response = await apiRequest(`/api/admin/disciplines/${id}`);
  return response;
};

/**
 * Busca o conteúdo completo de uma disciplina (incluindo vídeos, ebooks, etc)
 * @param id ID da disciplina
 * @returns Disciplina com conteúdo completo
 */
export const getDisciplineContent = async (id: string): Promise<Discipline> => {
  const response = await apiRequest(`/api/admin/disciplines/${id}/content`);
  return response;
};

/**
 * Verifica a completude da disciplina (se possui vídeos, ebooks, avaliações)
 * @param id ID da disciplina
 * @returns Status de completude da disciplina
 */
export const checkDisciplineCompleteness = async (id: string): Promise<DisciplineCompleteness> => {
  const response = await apiRequest(`/api/admin/disciplines/${id}/check-completeness`);
  return response;
};

/**
 * Cria uma nova disciplina
 * @param discipline Dados da disciplina a ser criada
 * @returns Disciplina criada
 */
export const createDiscipline = async (discipline: Omit<Discipline, 'id' | 'createdAt' | 'updatedAt' | 'contentStatus'>): Promise<Discipline> => {
  const response = await apiRequest("/api/admin/disciplines", {
    method: "POST",
    data: discipline
  });
  return response;
};

/**
 * Atualiza uma disciplina existente
 * @param id ID da disciplina
 * @param discipline Dados atualizados da disciplina
 * @returns Disciplina atualizada
 */
export const updateDiscipline = async (id: string, discipline: Partial<Omit<Discipline, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Discipline> => {
  const response = await apiRequest(`/api/admin/disciplines/${id}`, {
    method: "PATCH",
    data: discipline
  });
  return response;
};

/**
 * Exclui uma disciplina
 * @param id ID da disciplina a ser excluída
 * @returns void
 */
export const deleteDiscipline = async (id: string): Promise<void> => {
  await apiRequest(`/api/admin/disciplines/${id}`, {
    method: "DELETE"
  });
};

/**
 * Atualiza o vídeo de uma disciplina
 * @param id ID da disciplina
 * @param videoNumber Número do vídeo (1-10)
 * @param options Opções do vídeo
 * @returns Disciplina atualizada
 */
export const updateDisciplineVideo = async (id: string, videoNumber: number, options: VideoOptions): Promise<Discipline> => {
  const response = await apiRequest(`/api/admin/disciplines/${id}/videos/${videoNumber}`, {
    method: "PUT",
    data: options
  });
  return response;
};

/**
 * Remove um vídeo da disciplina
 * @param id ID da disciplina
 * @param videoNumber Número do vídeo (1-10)
 * @returns Disciplina atualizada
 */
export const removeDisciplineVideo = async (id: string, videoNumber: number): Promise<Discipline> => {
  const response = await apiRequest(`/api/admin/disciplines/${id}/videos/${videoNumber}`, {
    method: "DELETE"
  });
  return response;
};

/**
 * Atualiza o e-book interativo da disciplina
 * @param id ID da disciplina
 * @param url URL do e-book interativo
 * @returns Disciplina atualizada
 */
export const updateInteractiveEbook = async (id: string, url: string): Promise<Discipline> => {
  const response = await apiRequest(`/api/admin/disciplines/${id}/ebook-interativo`, {
    method: "PUT",
    data: { url }
  });
  return response;
};

/**
 * Remove o e-book interativo da disciplina
 * @param id ID da disciplina
 * @returns Disciplina atualizada
 */
export const removeInteractiveEbook = async (id: string): Promise<Discipline> => {
  const response = await apiRequest(`/api/admin/disciplines/${id}/ebook-interativo`, {
    method: "DELETE"
  });
  return response;
};

/**
 * Atualiza a apostila (PDF) da disciplina
 * @param id ID da disciplina
 * @param url URL da apostila
 * @returns Disciplina atualizada
 */
export const updateApostila = async (id: string, url: string): Promise<Discipline> => {
  const response = await apiRequest(`/api/admin/disciplines/${id}/apostila`, {
    method: "PUT",
    data: { url }
  });
  return response;
};

/**
 * Remove a apostila (PDF) da disciplina
 * @param id ID da disciplina
 * @returns Disciplina atualizada
 */
export const removeApostila = async (id: string): Promise<Discipline> => {
  const response = await apiRequest(`/api/admin/disciplines/${id}/apostila`, {
    method: "DELETE"
  });
  return response;
};