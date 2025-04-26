import { apiRequest } from "@/lib/queryClient";

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

export const disciplinasService = {
  // Buscar disciplina por ID
  async buscarDisciplina(id: string) {
    const response = await apiRequest(`/api/admin/disciplines/${id}`);
    return response.data;
  },

  // Buscar lista de vídeos de uma disciplina
  async listarVideos(disciplinaId: string): Promise<VideoData[]> {
    try {
      const response = await apiRequest(`/api/disciplines/${disciplinaId}/videos`);
      return response.data || [];
    } catch (error) {
      console.error("Erro ao listar vídeos:", error);
      return [];
    }
  },

  // Adicionar vídeo a uma disciplina
  async adicionarVideo(disciplinaId: string, videoData: Omit<VideoData, "id">) {
    const response = await apiRequest(`/api/disciplines/${disciplinaId}/videos`, {
      method: "POST",
      data: videoData
    });
    return response.data;
  },

  // Remover vídeo de uma disciplina
  async removerVideo(disciplinaId: string, videoId: string) {
    await apiRequest(`/api/disciplines/${disciplinaId}/videos/${videoId}`, {
      method: "DELETE"
    });
  },

  // Buscar e-book estático da disciplina
  async buscarEbookEstatico(disciplinaId: string): Promise<EbookData | null> {
    try {
      const response = await apiRequest(`/api/disciplines/${disciplinaId}/ebook`);
      return response.data || null;
    } catch (error) {
      console.error("Erro ao buscar e-book estático:", error);
      return null;
    }
  },

  // Salvar e-book estático
  async salvarEbookEstatico(disciplinaId: string, ebookData: EbookData) {
    const response = await apiRequest(`/api/disciplines/${disciplinaId}/ebook`, {
      method: "PUT",
      data: ebookData
    });
    return response.data;
  },

  // Remover e-book estático
  async removerEbookEstatico(disciplinaId: string) {
    await apiRequest(`/api/disciplines/${disciplinaId}/ebook`, {
      method: "DELETE"
    });
  },

  // Buscar conteúdo interativo de uma disciplina
  async buscarConteudoInterativo(disciplinaId: string) {
    try {
      const response = await apiRequest(`/api/disciplines/${disciplinaId}/interactive-ebook`);
      return response.data || null;
    } catch (error) {
      console.error("Erro ao buscar conteúdo interativo:", error);
      return null;
    }
  }
};