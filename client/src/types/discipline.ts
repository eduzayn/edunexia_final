// Tipos para módulo de disciplinas
export type VideoSource = "youtube" | "vimeo" | "onedrive" | "google_drive" | "upload";

export const videoSourceLabels: Record<VideoSource, string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  onedrive: "OneDrive",
  google_drive: "Google Drive",
  upload: "Upload Direto"
};

export type DisciplineFormData = {
  code: string;
  name: string;
  description: string;
  workload: number;
  syllabus: string;
  // Vídeo Aula 1
  videoAula1Url?: string | null;
  videoAula1Source?: VideoSource | null;
  videoAula1StartTime?: string | null;
  // Vídeo Aula 2
  videoAula2Url?: string | null;
  videoAula2Source?: VideoSource | null;
  videoAula2StartTime?: string | null;
  // Vídeo Aula 3
  videoAula3Url?: string | null;
  videoAula3Source?: VideoSource | null;
  videoAula3StartTime?: string | null;
  // Vídeo Aula 4
  videoAula4Url?: string | null;
  videoAula4Source?: VideoSource | null;
  videoAula4StartTime?: string | null;
  // Vídeo Aula 5
  videoAula5Url?: string | null;
  videoAula5Source?: VideoSource | null;
  videoAula5StartTime?: string | null;
  // Vídeo Aula 6
  videoAula6Url?: string | null;
  videoAula6Source?: VideoSource | null;
  videoAula6StartTime?: string | null;
  // Vídeo Aula 7
  videoAula7Url?: string | null;
  videoAula7Source?: VideoSource | null;
  videoAula7StartTime?: string | null;
  // Vídeo Aula 8
  videoAula8Url?: string | null;
  videoAula8Source?: VideoSource | null;
  videoAula8StartTime?: string | null;
  // Vídeo Aula 9
  videoAula9Url?: string | null;
  videoAula9Source?: VideoSource | null;
  videoAula9StartTime?: string | null;
  // Vídeo Aula 10
  videoAula10Url?: string | null;
  videoAula10Source?: VideoSource | null;
  videoAula10StartTime?: string | null;
  // Recursos adicionais
  apostilaUrl?: string | null;
  ebookInterativoUrl?: string | null;
};