/**
 * API para o módulo pedagógico
 * Centraliza todas as chamadas de API relacionadas aos recursos pedagógicos
 */

import { 
  Video, 
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

// Os endpoints de vídeos foram removidos como parte da limpeza de recursos de vídeo


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
import { Video, Ebook, InteractiveEbook, Simulado, AvaliacaoFinal, DisciplineContent } from "@/types/pedagogico";
import { apiUrl } from "@/lib/api-url-builder";

// Função auxiliar para fazer requisições à API
const fetchApi = async (url: string, options?: RequestInit) => {
  const response = await fetch(apiUrl(url), {
    ...options,
    headers: {
      ...options?.headers,
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) {
    throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
  }

  return response.json();
};

// API para gerenciamento de vídeos
export const videoApi = {
  getAll: async (disciplineId: string): Promise<Video[]> => {
    return fetchApi(`/api/disciplines/${disciplineId}/videos`);
  },
  
  create: async (disciplineId: string, video: Omit<Video, 'id'>): Promise<Video> => {
    return fetchApi(`/api/disciplines/${disciplineId}/videos`, {
      method: 'POST',
      body: JSON.stringify(video)
    });
  },
  
  update: async (disciplineId: string, videoId: string, video: Partial<Video>): Promise<Video> => {
    return fetchApi(`/api/disciplines/${disciplineId}/videos/${videoId}`, {
      method: 'PUT',
      body: JSON.stringify(video)
    });
  },
  
  delete: async (disciplineId: string, videoId: string): Promise<void> => {
    return fetchApi(`/api/disciplines/${disciplineId}/videos/${videoId}`, {
      method: 'DELETE'
    });
  }
};

// API para gerenciamento de e-book estático
export const ebookApi = {
  get: async (disciplineId: string): Promise<Ebook | null> => {
    return fetchApi(`/api/disciplines/${disciplineId}/ebook`);
  },
  
  create: async (disciplineId: string, ebook: FormData): Promise<Ebook> => {
    const response = await fetch(apiUrl(`/api/disciplines/${disciplineId}/ebook`), {
      method: 'POST',
      body: ebook,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
    }
    
    return response.json();
  },
  
  update: async (disciplineId: string, ebook: FormData): Promise<Ebook> => {
    const response = await fetch(apiUrl(`/api/disciplines/${disciplineId}/ebook`), {
      method: 'PUT',
      body: ebook,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
    }
    
    return response.json();
  },
  
  delete: async (disciplineId: string): Promise<void> => {
    return fetchApi(`/api/disciplines/${disciplineId}/ebook`, {
      method: 'DELETE'
    });
  }
};

// API para gerenciamento de e-book interativo
export const interactiveEbookApi = {
  get: async (disciplineId: string): Promise<InteractiveEbook | null> => {
    return fetchApi(`/api/disciplines/${disciplineId}/interactive-ebook`);
  },
  
  create: async (disciplineId: string, interactiveEbook: Omit<InteractiveEbook, 'id'>): Promise<InteractiveEbook> => {
    return fetchApi(`/api/disciplines/${disciplineId}/interactive-ebook`, {
      method: 'POST',
      body: JSON.stringify(interactiveEbook)
    });
  },
  
  update: async (disciplineId: string, interactiveEbook: Partial<InteractiveEbook>): Promise<InteractiveEbook> => {
    return fetchApi(`/api/disciplines/${disciplineId}/interactive-ebook`, {
      method: 'PUT',
      body: JSON.stringify(interactiveEbook)
    });
  },
  
  delete: async (disciplineId: string): Promise<void> => {
    return fetchApi(`/api/disciplines/${disciplineId}/interactive-ebook`, {
      method: 'DELETE'
    });
  }
};

// API para gerenciamento de simulados
export const simuladoApi = {
  getAll: async (disciplineId: string): Promise<Simulado[]> => {
    return fetchApi(`/api/disciplines/${disciplineId}/simulados`);
  },
  
  get: async (disciplineId: string, simuladoId: string): Promise<Simulado> => {
    return fetchApi(`/api/disciplines/${disciplineId}/simulados/${simuladoId}`);
  },
  
  create: async (disciplineId: string, simulado: Omit<Simulado, 'id' | 'createdAt'>): Promise<Simulado> => {
    return fetchApi(`/api/disciplines/${disciplineId}/simulados`, {
      method: 'POST',
      body: JSON.stringify(simulado)
    });
  },
  
  update: async (disciplineId: string, simuladoId: string, simulado: Partial<Simulado>): Promise<Simulado> => {
    return fetchApi(`/api/disciplines/${disciplineId}/simulados/${simuladoId}`, {
      method: 'PUT',
      body: JSON.stringify(simulado)
    });
  },
  
  delete: async (disciplineId: string, simuladoId: string): Promise<void> => {
    return fetchApi(`/api/disciplines/${disciplineId}/simulados/${simuladoId}`, {
      method: 'DELETE'
    });
  }
};

// API para gerenciamento de avaliação final
export const avaliacaoFinalApi = {
  get: async (disciplineId: string): Promise<AvaliacaoFinal | null> => {
    return fetchApi(`/api/disciplines/${disciplineId}/avaliacao-final`);
  },
  
  create: async (disciplineId: string, avaliacaoFinal: Omit<AvaliacaoFinal, 'id' | 'isActive' | 'createdAt'>): Promise<AvaliacaoFinal> => {
    return fetchApi(`/api/disciplines/${disciplineId}/avaliacao-final`, {
      method: 'POST',
      body: JSON.stringify(avaliacaoFinal)
    });
  },
  
  update: async (disciplineId: string, avaliacaoFinal: Partial<AvaliacaoFinal>): Promise<AvaliacaoFinal> => {
    return fetchApi(`/api/disciplines/${disciplineId}/avaliacao-final`, {
      method: 'PUT',
      body: JSON.stringify(avaliacaoFinal)
    });
  },
  
  toggleStatus: async (disciplineId: string): Promise<AvaliacaoFinal> => {
    return fetchApi(`/api/disciplines/${disciplineId}/avaliacao-final/toggle-status`, {
      method: 'PUT'
    });
  },
  
  delete: async (disciplineId: string): Promise<void> => {
    return fetchApi(`/api/disciplines/${disciplineId}/avaliacao-final`, {
      method: 'DELETE'
    });
  }
};

// API para verificar a completude da disciplina
export const disciplineContentApi = {
  getCompleteness: async (disciplineId: string): Promise<{
    items: { id: string; name: string; isCompleted: boolean }[];
    progress: number;
  }> => {
    return fetchApi(`/api/disciplines/${disciplineId}/completeness`);
  },
  
  getAllContent: async (disciplineId: string): Promise<DisciplineContent> => {
    return fetchApi(`/api/disciplines/${disciplineId}/content`);
  }
};
