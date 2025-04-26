import { apiRequest } from "@/lib/queryClient";
import { DisciplineFormData } from "@/types/discipline";
import { Discipline } from "@shared/schema";

// Buscar todas as disciplinas
export async function getAllDisciplines(): Promise<Discipline[]> {
  const response = await apiRequest("/api/admin/disciplines");
  return response.data;
}

// Buscar disciplina por ID
export async function getDiscipline(id: string): Promise<Discipline> {
  const response = await apiRequest(`/api/admin/disciplines/${id}`);
  return response.data;
}

// Criar nova disciplina
export async function createDiscipline(data: DisciplineFormData): Promise<Discipline> {
  const response = await apiRequest("/api/admin/disciplines", {
    method: "POST",
    data
  });
  return response.data;
}

// Atualizar disciplina existente
export async function updateDiscipline(id: string, data: DisciplineFormData): Promise<Discipline> {
  const response = await apiRequest(`/api/admin/disciplines/${id}`, {
    method: "PUT",
    data
  });
  return response.data;
}

// Excluir disciplina
export async function deleteDiscipline(id: string): Promise<void> {
  await apiRequest(`/api/admin/disciplines/${id}`, {
    method: "DELETE"
  });
}

// Atualizar vídeo da disciplina
export async function updateDisciplineVideo(
  disciplineId: string, 
  videoNumber: number, 
  data: { 
    url: string; 
    source: string; 
    startTime?: string 
  }
): Promise<Discipline> {
  const response = await apiRequest(`/api/admin/disciplines/${disciplineId}/videos/${videoNumber}`, {
    method: "PUT",
    data
  });
  return response.data;
}

// Remover vídeo da disciplina
export async function removeDisciplineVideo(
  disciplineId: string, 
  videoNumber: number
): Promise<Discipline> {
  const response = await apiRequest(`/api/admin/disciplines/${disciplineId}/videos/${videoNumber}`, {
    method: "DELETE"
  });
  return response.data;
}

// Atualizar e-book interativo da disciplina
export async function updateInteractiveEbook(
  disciplineId: string, 
  url: string
): Promise<Discipline> {
  const response = await apiRequest(`/api/admin/disciplines/${disciplineId}/ebook`, {
    method: "PUT",
    data: { url }
  });
  return response.data;
}

// Remover e-book interativo da disciplina
export async function removeInteractiveEbook(
  disciplineId: string
): Promise<Discipline> {
  const response = await apiRequest(`/api/admin/disciplines/${disciplineId}/ebook`, {
    method: "DELETE"
  });
  return response.data;
}

// Atualizar apostila da disciplina
export async function updateApostila(
  disciplineId: string, 
  url: string
): Promise<Discipline> {
  const response = await apiRequest(`/api/admin/disciplines/${disciplineId}/apostila`, {
    method: "PUT",
    data: { url }
  });
  return response.data;
}

// Remover apostila da disciplina
export async function removeApostila(
  disciplineId: string
): Promise<Discipline> {
  const response = await apiRequest(`/api/admin/disciplines/${disciplineId}/apostila`, {
    method: "DELETE"
  });
  return response.data;
}