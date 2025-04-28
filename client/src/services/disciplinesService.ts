import { apiRequestJson } from "@/lib/queryClient";

// Interface de resposta da API para facilitar manipulação dos dados
interface ApiResponse<T> {
  data: T;
  success?: boolean;
  message?: string;
}

interface VideoData {
  id: string;
  url: string;
  title?: string;
  description?: string;
}

interface EbookData {
  url: string;
  title?: string;
  description?: string;
}

interface SimulatedQuestion {
  id?: string;
  statement: string;
  alternatives: string[];
  correctAnswer: number;
}

// Interface for completeness check response
interface CompletenessResponse {
  isComplete: boolean;
  components: {
    videos: CompletenessComponent;
    ebooks: CompletenessComponent;
    simulation: CompletenessComponent;
    finalEvaluation: CompletenessComponent;
  };
}

// Interface for each component of the completeness check
interface CompletenessComponent {
  status: boolean;
  count: number;
  required: number;
  message: string;
}

export const disciplinesService = {
  // Get discipline by ID
  async getDiscipline(id: string) {
    const response = await apiRequestJson<ApiResponse<any>>(`/api/admin/disciplines/${id}`);
    return response.data;
  },

  // Get all disciplines
  async getAllDisciplines() {
    try {
      const response = await apiRequestJson<ApiResponse<any[]>>('/api/admin/disciplines');
      console.log("getAllDisciplines response:", response);
      return response.data || [];
    } catch (error) {
      console.error("Error fetching all disciplines:", error);
      return [];
    }
  },
  
  // Check discipline completeness
  async checkCompleteness(id: string): Promise<CompletenessResponse | null> {
    try {
      const response = await apiRequestJson<ApiResponse<CompletenessResponse>>(`/api/disciplines/${id}/completeness`);
      return response.data || null;
    } catch (error) {
      console.error("Error checking discipline completeness:", error);
      return null;
    }
  },

  // Get list of videos for a discipline
  async listVideos(disciplineId: string): Promise<VideoData[]> {
    try {
      const response = await apiRequestJson<ApiResponse<VideoData[]>>(`/api/disciplines/${disciplineId}/videos`);
      return response.data || [];
    } catch (error) {
      console.error("Error listing videos:", error);
      return [];
    }
  },

  // Add video to a discipline
  async addVideo(disciplineId: string, videoData: Omit<VideoData, "id">) {
    const response = await apiRequestJson<ApiResponse<VideoData>>(`/api/disciplines/${disciplineId}/videos`, {
      method: "POST",
      data: videoData
    });
    return response.data;
  },

  // Remove video from a discipline
  async removeVideo(disciplineId: string, videoId: string) {
    await apiRequestJson(`/api/disciplines/${disciplineId}/videos/${videoId}`, {
      method: "DELETE"
    });
  },

  // Get static ebook for a discipline
  async getStaticEbook(disciplineId: string): Promise<EbookData | null> {
    try {
      const response = await apiRequestJson<ApiResponse<EbookData>>(`/api/disciplines/${disciplineId}/ebook`);
      return response.data || null;
    } catch (error) {
      console.error("Error getting static ebook:", error);
      return null;
    }
  },

  // Save static ebook
  async saveStaticEbook(disciplineId: string, ebookData: EbookData) {
    const response = await apiRequestJson<ApiResponse<EbookData>>(`/api/disciplines/${disciplineId}/ebook`, {
      method: "PUT",
      data: ebookData
    });
    return response.data;
  },

  // Remove static ebook
  async removeStaticEbook(disciplineId: string) {
    await apiRequestJson(`/api/disciplines/${disciplineId}/ebook`, {
      method: "DELETE"
    });
  },

  // Get interactive content for a discipline
  async getInteractiveContent(disciplineId: string) {
    try {
      const response = await apiRequestJson<ApiResponse<EbookData>>(`/api/disciplines/${disciplineId}/interactive-ebook`);
      return response.data || null;
    } catch (error) {
      console.error("Error getting interactive content:", error);
      return null;
    }
  },
  
  // Save interactive content
  async saveInteractiveContent(disciplineId: string, ebookData: { url: string; title: string; description: string }) {
    const response = await apiRequestJson<ApiResponse<any>>(`/api/disciplines/${disciplineId}/interactive-ebook`, {
      method: "PUT",
      data: ebookData
    });
    return response.data;
  },
  
  // Remove interactive content
  async removeInteractiveContent(disciplineId: string) {
    await apiRequestJson(`/api/disciplines/${disciplineId}/interactive-ebook`, {
      method: "DELETE"
    });
  },

  // ==================== Functions for simulation management ====================

  // List simulation questions
  async listSimulation(disciplineId: string): Promise<SimulatedQuestion[]> {
    try {
      const response = await apiRequestJson<ApiResponse<SimulatedQuestion[]>>(`/api/disciplines/${disciplineId}/simulado`);
      return response.data || [];
    } catch (error) {
      console.error("Error listing simulation questions:", error);
      return [];
    }
  },

  // Add question to simulation
  async addSimulationQuestion(disciplineId: string, question: Omit<SimulatedQuestion, "id">) {
    const response = await apiRequestJson<ApiResponse<SimulatedQuestion>>(`/api/disciplines/${disciplineId}/simulado`, {
      method: "POST",
      data: question
    });
    return response.data;
  },

  // Remove question from simulation
  async removeSimulationQuestion(disciplineId: string, questionId: string) {
    await apiRequestJson(`/api/disciplines/${disciplineId}/simulado/${questionId}`, {
      method: "DELETE"
    });
  },

  // Update simulation question
  async updateSimulationQuestion(disciplineId: string, questionId: string, question: Omit<SimulatedQuestion, "id">) {
    const response = await apiRequestJson<ApiResponse<SimulatedQuestion>>(`/api/disciplines/${disciplineId}/simulado/${questionId}`, {
      method: "PUT",
      data: question
    });
    return response.data;
  },

  // ==================== Functions for final evaluation management ====================

  // List final evaluation questions
  async listFinalEvaluation(disciplineId: string): Promise<SimulatedQuestion[]> {
    try {
      const response = await apiRequestJson<ApiResponse<SimulatedQuestion[]>>(`/api/disciplines/${disciplineId}/avaliacao-final`);
      return response.data || [];
    } catch (error) {
      console.error("Error listing final evaluation questions:", error);
      return [];
    }
  },

  // Add question to final evaluation
  async addFinalEvaluationQuestion(disciplineId: string, question: Omit<SimulatedQuestion, "id">) {
    const response = await apiRequestJson<ApiResponse<SimulatedQuestion>>(`/api/disciplines/${disciplineId}/avaliacao-final`, {
      method: "POST",
      data: question
    });
    return response.data;
  },

  // Remove question from final evaluation
  async removeFinalEvaluationQuestion(disciplineId: string, questionId: string) {
    await apiRequestJson(`/api/disciplines/${disciplineId}/avaliacao-final/${questionId}`, {
      method: "DELETE"
    });
  },

  // Update final evaluation question
  async updateFinalEvaluationQuestion(disciplineId: string, questionId: string, question: Omit<SimulatedQuestion, "id">) {
    const response = await apiRequestJson<ApiResponse<SimulatedQuestion>>(`/api/disciplines/${disciplineId}/avaliacao-final/${questionId}`, {
      method: "PUT",
      data: question
    });
    return response.data;
  },
  
  // Delete discipline
  async deleteDiscipline(id: number) {
    try {
      await apiRequestJson(`/api/admin/disciplines/${id}`, {
        method: "DELETE"
      });
      return true;
    } catch (error) {
      console.error("Error deleting discipline:", error);
      throw error;
    }
  }
}; 