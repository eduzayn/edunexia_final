// Tipos relacionados ao módulo de disciplinas
import { z } from "zod";
import { insertDisciplineSchema } from "@shared/schema";

// Tipo base para disciplina vindo do esquema de inserção
export type Discipline = {
  id: number;
  code: string;
  name: string;
  description: string;
  workload: number;
  syllabus: string;
  
  // Vídeo aulas
  videoAula1Url?: string | null;
  videoAula1Source?: string | null;
  videoAula1StartTime?: string | null;
  videoAula2Url?: string | null;
  videoAula2Source?: string | null;
  videoAula2StartTime?: string | null;
  videoAula3Url?: string | null;
  videoAula3Source?: string | null;
  videoAula3StartTime?: string | null;
  videoAula4Url?: string | null;
  videoAula4Source?: string | null;
  videoAula4StartTime?: string | null;
  videoAula5Url?: string | null;
  videoAula5Source?: string | null;
  videoAula5StartTime?: string | null;
  videoAula6Url?: string | null;
  videoAula6Source?: string | null;
  videoAula6StartTime?: string | null;
  videoAula7Url?: string | null;
  videoAula7Source?: string | null;
  videoAula7StartTime?: string | null;
  videoAula8Url?: string | null;
  videoAula8Source?: string | null;
  videoAula8StartTime?: string | null;
  videoAula9Url?: string | null;
  videoAula9Source?: string | null;
  videoAula9StartTime?: string | null;
  videoAula10Url?: string | null;
  videoAula10Source?: string | null;
  videoAula10StartTime?: string | null;
  
  // Materiais de apoio
  apostilaPdfUrl?: string | null;
  ebookInterativoUrl?: string | null;
  
  // Status de completude
  contentStatus: "incomplete" | "complete";
  
  // Metadados
  createdById?: number;
  createdAt: string;
  updatedAt: string;
};

// Tipo para formulário de criação de disciplina
export type DisciplineFormData = z.infer<typeof insertDisciplineSchema>;

// Enums para fontes de vídeo que refletem os valores do banco de dados
export enum VideoSource {
  YOUTUBE = "youtube",
  ONEDRIVE = "onedrive",
  GOOGLE_DRIVE = "google_drive",
  VIMEO = "vimeo",
  UPLOAD = "upload"
}

// Tipo para conteúdo de vídeo aula
export type VideoContent = {
  url: string;
  source: VideoSource;
  startTime?: string;
  number: number; // Número do vídeo (1-10)
};

// Tipo para ebook interativo
export type EbookContent = {
  url: string;
};

// Tipo para o estado de completude de uma disciplina
export type CompletenessStatus = {
  hasVideos: boolean;
  hasEbook: boolean;
  hasAssessments: boolean;
  isComplete: boolean;
};

// Tipo para avaliação
export type Assessment = {
  id: number;
  disciplineId: number;
  title: string;
  description?: string;
  type: "simulado" | "avaliacao_final";
  passingScore: number;
  timeLimit?: number;
  questions?: Question[];
  createdAt: string;
  updatedAt: string;
};

// Tipo para questão
export type Question = {
  id: number;
  disciplineId: number;
  statement: string;
  options: string[];
  correctOption: number;
  explanation?: string;
  questionType: string;
  createdAt: string;
  updatedAt: string;
};

// Schema para validação de formulário de video
export const videoFormSchema = z.object({
  url: z.string().url("URL deve ser válida").min(1, "URL é obrigatória"),
  source: z.enum(["youtube", "onedrive", "google_drive", "vimeo", "upload"], {
    required_error: "Selecione uma fonte de vídeo",
  }),
  startTime: z.string().optional(),
});

// Schema para validação de formulário de ebook interativo
export const ebookFormSchema = z.object({
  url: z.string().url("URL deve ser válida").min(1, "URL é obrigatória"),
});

// Schema para validação de formulário de avaliação
export const assessmentFormSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  type: z.enum(["simulado", "avaliacao_final"], {
    required_error: "Selecione um tipo de avaliação",
  }),
  passingScore: z.number().min(0).max(100),
  timeLimit: z.number().optional(),
});

// Schema para validação de formulário de questão
export const questionFormSchema = z.object({
  statement: z.string().min(1, "Enunciado é obrigatório"),
  options: z.array(z.string()).min(2, "Pelo menos 2 opções são necessárias"),
  correctOption: z.number().min(0, "Selecione a resposta correta"),
  explanation: z.string().optional(),
  questionType: z.string().default("multiple_choice"),
});