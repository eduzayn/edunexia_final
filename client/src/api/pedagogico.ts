/**
 * API para o módulo pedagógico
 * Centraliza todas as chamadas de API relacionadas aos recursos pedagógicos
 */

import { 
  Video, 
  Ebook, 
  InteractiveEbook, 
  Simulado, 
  AvaliacaoFinal,
  Question 
} from "@/types/pedagogico";

// Helpers de requisição
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.text().catch(() => 'Erro desconhecido');
    throw new Error(`Erro na requisição: ${response.status} - ${error}`);
  }

  // Verifica se o conteúdo retornado é realmente JSON antes de fazer o parse
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const textResponse = await response.text();
    console.error("Resposta não-JSON recebida:", textResponse);
    throw new Error("Resposta não é JSON. Verifique se a rota da API está correta.");
  }

  return response.json();
}

// ===== VÍDEOS =====

/**
 * Busca todos os vídeos de uma disciplina
 */
export async function getVideos(disciplineId: string | number): Promise<Video[]> {
  return fetchWithAuth(`/api/disciplines/${disciplineId}/videos`);
}

/**
 * Adiciona um novo vídeo à disciplina
 */
export async function addVideo(disciplineId: string | number, video: Omit<Video, 'id'>): Promise<Video> {
  return fetchWithAuth(`/api/disciplines/${disciplineId}/videos`, {
    method: 'POST',
    body: JSON.stringify(video),
  });
}

/**
 * Atualiza um vídeo existente
 */
export async function updateVideo(disciplineId: string | number, videoId: string | number, video: Partial<Video>): Promise<Video> {
  return fetchWithAuth(`/api/disciplines/${disciplineId}/videos/${videoId}`, {
    method: 'PUT',
    body: JSON.stringify(video),
  });
}

/**
 * Remove um vídeo da disciplina com tratamento especial para evitar erros de parsing HTML
 */
export async function deleteVideo(disciplineId: string | number, videoId: string | number): Promise<void> {
  try {
    return await fetchWithAuth(`/api/disciplines/${disciplineId}/videos/${videoId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    // Se o erro for relacionado a resposta não-JSON, tente uma abordagem alternativa
    if (error instanceof Error && error.message.includes("Resposta não é JSON")) {
      console.warn("Tentando método alternativo para exclusão de vídeo");
      
      // Fazemos uma requisição manual e verificamos apenas o status de resposta
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/disciplines/${disciplineId}/videos/${videoId}`, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao excluir vídeo: ${response.status}`);
      }
      
      // Se chegou até aqui, consideramos sucesso mesmo sem resposta JSON
      return;
    }
    
    // Se não for erro de JSON, propaga o erro original
    throw error;
  }
}

// ===== E-BOOKS =====

/**
 * Busca o e-book de uma disciplina
 */
export async function getEbook(disciplineId: string | number): Promise<Ebook> {
  return fetchWithAuth(`/api/disciplines/${disciplineId}/ebook`);
}

/**
 * Adiciona ou atualiza o e-book da disciplina
 */
export async function saveEbook(disciplineId: string | number, ebook: Partial<Ebook>): Promise<Ebook> {
  const method = ebook.id ? 'PUT' : 'POST';
  return fetchWithAuth(`/api/disciplines/${disciplineId}/ebook`, {
    method,
    body: JSON.stringify(ebook),
  });
}

/**
 * Remove o e-book da disciplina
 */
export async function deleteEbook(disciplineId: string | number): Promise<void> {
  return fetchWithAuth(`/api/disciplines/${disciplineId}/ebook`, {
    method: 'DELETE',
  });
}

// ===== E-BOOKS INTERATIVOS =====

/**
 * Busca o e-book interativo de uma disciplina
 */
export async function getInteractiveEbook(disciplineId: string | number): Promise<InteractiveEbook> {
  return fetchWithAuth(`/api/disciplines/${disciplineId}/interactive-ebook`);
}

/**
 * Adiciona ou atualiza o e-book interativo da disciplina
 */
export async function saveInteractiveEbook(disciplineId: string | number, ebook: Partial<InteractiveEbook>): Promise<InteractiveEbook> {
  const method = ebook.id ? 'PUT' : 'POST';
  return fetchWithAuth(`/api/disciplines/${disciplineId}/interactive-ebook`, {
    method,
    body: JSON.stringify(ebook),
  });
}

/**
 * Remove o e-book interativo da disciplina
 */
export async function deleteInteractiveEbook(disciplineId: string | number): Promise<void> {
  return fetchWithAuth(`/api/disciplines/${disciplineId}/interactive-ebook`, {
    method: 'DELETE',
  });
}

// ===== SIMULADOS =====

/**
 * Busca o simulado de uma disciplina
 */
export async function getSimulado(disciplineId: string | number): Promise<Simulado> {
  return fetchWithAuth(`/api/disciplines/${disciplineId}/simulado`);
}

/**
 * Adiciona ou atualiza o simulado da disciplina
 */
export async function saveSimulado(disciplineId: string | number, simulado: Partial<Simulado>): Promise<Simulado> {
  const method = simulado.id ? 'PUT' : 'POST';
  return fetchWithAuth(`/api/disciplines/${disciplineId}/simulado`, {
    method,
    body: JSON.stringify(simulado),
  });
}

/**
 * Remove o simulado da disciplina
 */
export async function deleteSimulado(disciplineId: string | number): Promise<void> {
  return fetchWithAuth(`/api/disciplines/${disciplineId}/simulado`, {
    method: 'DELETE',
  });
}

// ===== AVALIAÇÕES FINAIS =====

/**
 * Busca a avaliação final de uma disciplina
 */
export async function getAvaliacaoFinal(disciplineId: string | number): Promise<AvaliacaoFinal> {
  return fetchWithAuth(`/api/disciplines/${disciplineId}/avaliacao-final`);
}

/**
 * Adiciona ou atualiza a avaliação final da disciplina
 */
export async function saveAvaliacaoFinal(disciplineId: string | number, avaliacao: Partial<AvaliacaoFinal>): Promise<AvaliacaoFinal> {
  const method = avaliacao.id ? 'PUT' : 'POST';
  return fetchWithAuth(`/api/disciplines/${disciplineId}/avaliacao-final`, {
    method,
    body: JSON.stringify(avaliacao),
  });
}

/**
 * Remove a avaliação final da disciplina
 */
export async function deleteAvaliacaoFinal(disciplineId: string | number): Promise<void> {
  return fetchWithAuth(`/api/disciplines/${disciplineId}/avaliacao-final`, {
    method: 'DELETE',
  });
}

// ===== QUESTÕES =====

/**
 * Adiciona uma questão a um simulado
 */
export async function addQuestionToSimulado(disciplineId: string | number, simuladoId: string | number, question: Omit<Question, 'id'>): Promise<Question> {
  return fetchWithAuth(`/api/disciplines/${disciplineId}/simulado/${simuladoId}/questions`, {
    method: 'POST',
    body: JSON.stringify(question),
  });
}

/**
 * Adiciona uma questão a uma avaliação final
 */
export async function addQuestionToAvaliacaoFinal(disciplineId: string | number, avaliacaoId: string | number, question: Omit<Question, 'id'>): Promise<Question> {
  return fetchWithAuth(`/api/disciplines/${disciplineId}/avaliacao-final/${avaliacaoId}/questions`, {
    method: 'POST',
    body: JSON.stringify(question),
  });
}