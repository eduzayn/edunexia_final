// Schema para validação dos formulários
const videoFormSchema = z.object({
  title: z.string().min(3, { message: "Título deve ter pelo menos 3 caracteres" }),
  description: z.string().optional(),
  videoSource: z.enum(["youtube", "onedrive", "google_drive", "vimeo", "upload"]),
  url: z.string().url({ message: "URL inválida" }),
  duration: z.string().regex(/^\d+:\d+$/, { message: "Duração deve estar no formato mm:ss" }),
});
