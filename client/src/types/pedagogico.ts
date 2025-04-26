// Tipos para o Módulo Pedagógico
// Centralização das interfaces utilizadas nos componentes do módulo acadêmico/pedagógico

// Tipos para vídeos
export type VideoSource = 'youtube' | 'vimeo' | 'onedrive' | 'upload' | 'other';

export interface Video {
  id?: number | string;
  disciplineId?: number | string;
  title: string;
  description?: string;
  source: VideoSource;
  url: string;
  durationSeconds?: number;
  order?: number;
}


// Tipos para questões (utilizadas em simulados e avaliações)
export interface Question {
  id?: number | string;
  text: string;
  options: string[];
  correctOption: number; // índice da opção correta (0-based)
  explanation?: string;
}

// Tipos para simulados
export interface Simulado {
  id?: number | string;
  disciplineId?: number | string;
  title: string;
  description?: string;
  timeLimit?: number; // tempo em minutos
  questions: Question[];
}

// Tipos para avaliações finais
export interface AvaliacaoFinal {
  id?: number | string;
  disciplineId?: number | string;
  title: string;
  description?: string;
  timeLimit?: number; // tempo em minutos
  passingScore: number; // nota para aprovação (0-100)
  allowRetake: boolean;
  maxAttempts?: number;
  showExplanations: boolean;
  questions: Question[];
}

// Disciplina completa com todos os componentes
export interface DisciplinaCompleta {
  id: number | string;
  code: string;
  name: string;
  description: string;
  workload?: number; // carga horária
  videos: Video[];
  simulado?: Simulado;
  avaliacaoFinal?: AvaliacaoFinal;
}

// Status de conclusão de elementos da disciplina
export interface CompletenessStatus {
  videos: boolean;
  simulado: boolean;
  avaliacaoFinal: boolean;
}