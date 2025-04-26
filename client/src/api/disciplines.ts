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