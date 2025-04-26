// API de disciplinas para o front-end
import { apiRequest } from "@/lib/queryClient";
import { 
  Discipline, 
  VideoContent, 
  EbookContent, 
  Assessment,
  Question,
  VideoSource
} from "@/types/discipline";

const API_BASE = "/api/admin/disciplines";

// Função para listar todas as disciplinas
export async function listDisciplines(): Promise<Discipline[]> {
  const response = await apiRequest(API_BASE);
  return response.data || [];
}

// Função para obter uma disciplina específica
export async function getDiscipline(id: number | string): Promise<Discipline> {
  const response = await apiRequest(`${API_BASE}/${id}`);
  return response;
}

// Função para obter o conteúdo completo de uma disciplina
export async function getDisciplineContent(id: number | string): Promise<Discipline> {
  const response = await apiRequest(`${API_BASE}/${id}/content`);
  return response;
}

// Função para criar uma disciplina
export async function createDiscipline(data: Omit<Discipline, "id" | "createdAt" | "updatedAt" | "contentStatus">): Promise<Discipline> {
  const response = await apiRequest(API_BASE, {
    method: "POST",
    data
  });
  return response;
}

// Função para atualizar uma disciplina
export async function updateDiscipline(id: number | string, data: Partial<Discipline>): Promise<Discipline> {
  const response = await apiRequest(`${API_BASE}/${id}`, {
    method: "PUT",
    data
  });
  return response;
}

// Função para excluir uma disciplina
export async function deleteDiscipline(id: number | string): Promise<void> {
  await apiRequest(`${API_BASE}/${id}`, {
    method: "DELETE"
  });
}

// ===== APIs para vídeos =====

// Função para adicionar um vídeo
export async function addVideo(
  disciplineId: number | string, 
  videoNumber: number,
  videoData: { url: string; source: VideoSource; startTime?: string }
): Promise<Discipline> {
  const response = await apiRequest(`${API_BASE}/${disciplineId}/videos/${videoNumber}`, {
    method: "POST",
    data: videoData
  });
  return response;
}

// Função para remover um vídeo
export async function removeVideo(
  disciplineId: number | string,
  videoNumber: number
): Promise<Discipline> {
  const response = await apiRequest(`${API_BASE}/${disciplineId}/videos/${videoNumber}`, {
    method: "DELETE"
  });
  return response;
}

// ===== APIs para e-book interativo =====

// Função para adicionar um e-book interativo
export async function addInteractiveEbook(
  disciplineId: number | string,
  ebookData: { url: string }
): Promise<Discipline> {
  const response = await apiRequest(`${API_BASE}/${disciplineId}/ebook-interativo`, {
    method: "POST",
    data: ebookData
  });
  return response;
}

// Função para remover um e-book interativo
export async function removeInteractiveEbook(
  disciplineId: number | string
): Promise<Discipline> {
  const response = await apiRequest(`${API_BASE}/${disciplineId}/ebook-interativo`, {
    method: "DELETE"
  });
  return response;
}

// ===== APIs para apostila PDF =====

// Função para adicionar uma apostila PDF
export async function addPdfApostila(
  disciplineId: number | string,
  apostilaData: { url: string }
): Promise<Discipline> {
  const response = await apiRequest(`${API_BASE}/${disciplineId}/apostila`, {
    method: "POST",
    data: apostilaData
  });
  return response;
}

// Função para remover uma apostila PDF
export async function removePdfApostila(
  disciplineId: number | string
): Promise<Discipline> {
  const response = await apiRequest(`${API_BASE}/${disciplineId}/apostila`, {
    method: "DELETE"
  });
  return response;
}

// ===== APIs para avaliações (simulados e avaliações finais) =====

// Função para listar avaliações de uma disciplina
export async function listAssessments(
  disciplineId: number | string,
  type?: "simulado" | "avaliacao_final"
): Promise<Assessment[]> {
  const url = type 
    ? `${API_BASE}/${disciplineId}/assessments?type=${type}` 
    : `${API_BASE}/${disciplineId}/assessments`;
  
  const response = await apiRequest(url);
  return response.data || [];
}

// Função para obter uma avaliação específica
export async function getAssessment(
  disciplineId: number | string,
  assessmentId: number | string
): Promise<Assessment> {
  const response = await apiRequest(`${API_BASE}/${disciplineId}/assessments/${assessmentId}`);
  return response;
}

// Função para criar uma avaliação
export async function createAssessment(
  disciplineId: number | string,
  data: Omit<Assessment, "id" | "disciplineId" | "createdAt" | "updatedAt">
): Promise<Assessment> {
  const response = await apiRequest(`${API_BASE}/${disciplineId}/assessments`, {
    method: "POST",
    data
  });
  return response;
}

// Função para atualizar uma avaliação
export async function updateAssessment(
  disciplineId: number | string,
  assessmentId: number | string,
  data: Partial<Assessment>
): Promise<Assessment> {
  const response = await apiRequest(`${API_BASE}/${disciplineId}/assessments/${assessmentId}`, {
    method: "PUT",
    data
  });
  return response;
}

// Função para excluir uma avaliação
export async function deleteAssessment(
  disciplineId: number | string,
  assessmentId: number | string
): Promise<void> {
  await apiRequest(`${API_BASE}/${disciplineId}/assessments/${assessmentId}`, {
    method: "DELETE"
  });
}

// ===== APIs para questões =====

// Função para adicionar uma questão a uma avaliação
export async function addQuestionToAssessment(
  disciplineId: number | string,
  assessmentId: number | string,
  data: Omit<Question, "id" | "disciplineId" | "createdAt" | "updatedAt">
): Promise<Assessment> {
  const response = await apiRequest(`${API_BASE}/${disciplineId}/assessments/${assessmentId}/questions`, {
    method: "POST",
    data
  });
  return response;
}

// Função para remover uma questão de uma avaliação
export async function removeQuestionFromAssessment(
  disciplineId: number | string,
  assessmentId: number | string,
  questionId: number | string
): Promise<Assessment> {
  const response = await apiRequest(`${API_BASE}/${disciplineId}/assessments/${assessmentId}/questions/${questionId}`, {
    method: "DELETE"
  });
  return response;
}

// Função para verificar se uma disciplina está completa
export async function checkDisciplineCompleteness(
  disciplineId: number | string
): Promise<{ isComplete: boolean; hasVideos: boolean; hasEbook: boolean; hasAssessments: boolean }> {
  const response = await apiRequest(`${API_BASE}/${disciplineId}/check-completeness`);
  return response;
}