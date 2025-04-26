import { type Discipline } from "@shared/schema";

export type VideoSource = 'youtube' | 'vimeo' | 'onedrive' | 'google_drive' | 'upload';

/**
 * Interface para URLs de vídeos
 */
export interface VideoURL {
  url: string;
  source: VideoSource;
  startTime?: string;
}

/**
 * Interface para exibição de informações de completude
 */
export interface DisciplineCompleteness {
  isComplete: boolean;
  hasVideos: boolean;
  hasEbook: boolean;
  hasAssessments: boolean;
}

/**
 * Estado de conteúdo da disciplina
 */
export type ContentStatus = 'incomplete' | 'complete';

/**
 * Tipo de uma disciplina com todos os campos opcionais, exceto id
 */
export type PartialDiscipline = Partial<Omit<Discipline, 'id'>> & { id: number };

/**
 * Tipo para formulário de criação de disciplina
 */
export type DisciplineFormData = Omit<Discipline, 'id' | 'createdAt' | 'updatedAt' | 'contentStatus'>;

/**
 * Mapeamento de nomes de fonte de vídeo para exibição
 */
export const videoSourceLabels: Record<VideoSource, string> = {
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  onedrive: 'OneDrive',
  google_drive: 'Google Drive',
  upload: 'Upload Direto'
};