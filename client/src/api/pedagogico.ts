import { Video, Ebook, InteractiveEbook, Simulado, AvaliacaoFinal, DisciplineContent, Question } from "@/types/pedagogico";
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
    return fetchApi(`/api/admin/disciplines/${disciplineId}/videos`);
  },

  create: async (disciplineId: string, video: Omit<Video, 'id'>): Promise<Video> => {
    return fetchApi(`/api/admin/disciplines/${disciplineId}/videos`, {
      method: 'POST',
      body: JSON.stringify(video)
    });
  },

  delete: async (disciplineId: string, videoId: string): Promise<void> => {
    return fetchApi(`/api/admin/disciplines/${disciplineId}/videos/${videoId}`, {
      method: 'DELETE'
    });
  }
};

// API para gerenciamento de e-book estático
export const ebookEstaticoApi = {
  get: async (disciplineId: string): Promise<Ebook | null> => {
    return fetchApi(`/api/admin/disciplines/${disciplineId}/ebook-estatico`);
  },

  create: async (disciplineId: string, ebook: FormData): Promise<Ebook> => {
    const response = await fetch(apiUrl(`/api/admin/disciplines/${disciplineId}/ebook-estatico`), {
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
  }
};

// API para gerenciamento de e-book interativo
export const ebookInterativoApi = {
  get: async (disciplineId: string): Promise<InteractiveEbook | null> => {
    return fetchApi(`/api/admin/disciplines/${disciplineId}/ebook-interativo`);
  },

  create: async (disciplineId: string, ebook: { title: string, url: string }): Promise<InteractiveEbook> => {
    return fetchApi(`/api/admin/disciplines/${disciplineId}/ebook-interativo`, {
      method: 'POST',
      body: JSON.stringify(ebook)
    });
  }
};

// API para gerenciamento de simulados
export const simuladoApi = {
  get: async (disciplineId: string): Promise<Simulado> => {
    return fetchApi(`/api/admin/disciplines/${disciplineId}/simulado`);
  },

  addQuestion: async (disciplineId: string, question: { 
    enunciado: string, 
    alternativas: string[], 
    respostaCorreta: number,
    simuladoTitle?: string,
    simuladoDescription?: string,
    simuladoTimeLimit?: number
  }): Promise<Question> => {
    return fetchApi(`/api/admin/disciplines/${disciplineId}/simulado`, {
      method: 'POST',
      body: JSON.stringify(question)
    });
  },

  updateQuestion: async (disciplineId: string, questionId: string, question: { 
    enunciado: string, 
    alternativas: string[], 
    respostaCorreta: number 
  }): Promise<Question> => {
    return fetchApi(`/api/admin/disciplines/${disciplineId}/simulado/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(question)
    });
  },

  deleteQuestion: async (disciplineId: string, questionId: string): Promise<void> => {
    return fetchApi(`/api/admin/disciplines/${disciplineId}/simulado/${questionId}`, {
      method: 'DELETE'
    });
  }
};

// API para gerenciamento de avaliação final
export const avaliacaoFinalApi = {
  get: async (disciplineId: string): Promise<AvaliacaoFinal> => {
    return fetchApi(`/api/admin/disciplines/${disciplineId}/avaliacao-final`);
  },

  addQuestion: async (disciplineId: string, question: { 
    enunciado: string, 
    alternativas: string[], 
    respostaCorreta: number,
    explanation?: string,
    avaliacaoTitle?: string,
    avaliacaoDescription?: string,
    avaliacaoTimeLimit?: number,
    avaliacaoPassingScore?: number,
    avaliacaoMaxAttempts?: number,
    avaliacaoShowExplanations?: boolean
  }): Promise<Question> => {
    return fetchApi(`/api/admin/disciplines/${disciplineId}/avaliacao-final`, {
      method: 'POST',
      body: JSON.stringify(question)
    });
  },

  updateQuestion: async (disciplineId: string, questionId: string, question: { 
    enunciado: string, 
    alternativas: string[], 
    respostaCorreta: number,
    explanation?: string
  }): Promise<Question> => {
    return fetchApi(`/api/admin/disciplines/${disciplineId}/avaliacao-final/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(question)
    });
  },

  deleteQuestion: async (disciplineId: string, questionId: string): Promise<void> => {
    return fetchApi(`/api/admin/disciplines/${disciplineId}/avaliacao-final/${questionId}`, {
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
    return fetchApi(`/api/admin/disciplines/${disciplineId}/completeness`);
  }
};