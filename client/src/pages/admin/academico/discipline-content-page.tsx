import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ExtendedUser } from "@/types/user";
import { Sidebar } from "@/components/layout/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { 
  queryClient, 
  apiRequest, 
  fetchDiscipline, 
  fetchDisciplineVideos, 
  fetchDisciplineMaterial, 
  fetchDisciplineEbook 
} from "@/lib/queryClient";
import { 
  buildDisciplineApiUrl, 
  buildDisciplineVideosApiUrl, 
  buildDisciplineMaterialApiUrl, 
  buildDisciplineEbookApiUrl, 
  buildDisciplineQuestionsApiUrl, 
  buildDisciplineAssessmentsApiUrl, 
  buildApiUrl 
} from "@/lib/api-config";
import EmbeddedVideoPlayer from "@/components/video-player/embedded-video-player";
import { Discipline, videoSourceEnum, contentCompletionStatusEnum } from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import EbookContentSection from "@/components/discipline/ebook-content-section";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Checkbox,
} from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  VideoIcon,
  BookIcon,
  FileTextIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ArrowLeftIcon,
  SaveIcon,
  PencilIcon,
  PlusIcon,
  MinusIcon,
  RefreshCwIcon,
  UploadIcon,
  DashboardIcon,
  SchoolIcon,
  FileIcon,
  PlayIcon,
  LinkIcon,
  AlertTriangleIcon,
  YoutubeIcon,
  OneDriveIcon,
  GoogleDriveIcon,
  VimeoIcon,
  CheckIcon,
  EditIcon,
} from "@/components/ui/icons";
import { Clock as ClockIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import VideoFormFields, { VideoSource } from "@/components/disciplinas/video-form-fields";

// Schema para validação dos formulários
const videoFormSchema = z.object({
  title: z.string().min(3, { message: "Título deve ter pelo menos 3 caracteres" }),
  description: z.string().optional(),
  videoSource: z.enum(["youtube", "onedrive", "google_drive", "vimeo", "upload"]),
  url: z.string().url({ message: "URL inválida" }),
  duration: z.string().regex(/^\d+:\d+$/, { message: "Duração deve estar no formato mm:ss" }),
  startTime: z.string().regex(/^\d+:\d+$/, { message: "Tempo de início deve estar no formato mm:ss" }).optional(),
});

const materialFormSchema = z.object({
  title: z.string().min(3, { message: "Título deve ter pelo menos 3 caracteres" }),
  description: z.string().min(10, { message: "Descrição deve ter pelo menos 10 caracteres" }),
  url: z.string().url({ message: "URL inválida" }).optional(),
  file: z.any().optional(), // Suporte para upload de arquivo PDF
}).refine(
  (data) => data.url || data.file, 
  {
    message: "Forneça um link para o PDF ou faça upload de um arquivo",
    path: ["url"],
  }
);

// Schema para inserção de link de e-book externo
const ebookLinkFormSchema = z.object({
  title: z.string().min(3, { message: "Título deve ter pelo menos 3 caracteres" }),
  description: z.string().min(10, { message: "Descrição deve ter pelo menos 10 caracteres" }),
  url: z.string().url({ message: "URL inválida" }),
});

const questionFormSchema = z.object({
  statement: z.string().min(5, { message: "Enunciado deve ter pelo menos 5 caracteres" }),
  options: z.array(z.string()).min(4, { message: "Deve ter pelo menos 4 opções" }).max(5, { message: "Deve ter no máximo 5 opções" }),
  correctOption: z.number().min(0, { message: "Selecione a opção correta" }),
  explanation: z.string().min(5, { message: "Explicação deve ter pelo menos 5 caracteres" }),
});

const assessmentFormSchema = z.object({
  title: z.string().min(3, { message: "Título deve ter pelo menos 3 caracteres" }),
  description: z.string().min(10, { message: "Descrição deve ter pelo menos 10 caracteres" }),
  type: z.enum(["simulado", "avaliacao_final"]),
  passingScore: z.coerce.number().min(0, { message: "Nota mínima deve ser maior ou igual a 0" }).max(10, { message: "Nota mínima deve ser menor ou igual a 10" }),
  questionIds: z.array(z.number()).optional(),
});

type VideoFormValues = z.infer<typeof videoFormSchema>;
type MaterialFormValues = z.infer<typeof materialFormSchema>;
type EbookLinkFormValues = z.infer<typeof ebookLinkFormSchema>;
type QuestionFormValues = z.infer<typeof questionFormSchema>;
type AssessmentFormValues = z.infer<typeof assessmentFormSchema>;

export default function DisciplineContentPage() {
  const [, navigate] = useLocation();
  const { id } = useParams();
  const disciplineId = parseInt(id as string);
  const { user } = useAuth();
  
  // Corrigindo o problema de tipagem do usuário
  // Como o user pode ser undefined, precisamos fazer verificações seguras
  const typedUser = user ? {
    ...user,
    portalType: user.portalType || 'admin',
    // O casting para any é necessário para acessar propriedades que podem não existir no tipo
    role: (user as any).role || (user.portalType === 'admin' ? 'admin' : 'student')
  } as ExtendedUser : null;
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Estados para diálogos
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [isVideoEditDialogOpen, setIsVideoEditDialogOpen] = useState(false);
  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);
  const [isEbookLinkDialogOpen, setIsEbookLinkDialogOpen] = useState(false);
  // Estado isEbookDialogOpen removido - usando interface completa em /admin/ebooks/generate
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [isAssessmentDialogOpen, setIsAssessmentDialogOpen] = useState(false);
  
  // Estados para seleção de itens
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [selectedAssessmentType, setSelectedAssessmentType] = useState<"simulado" | "avaliacao_final">("simulado");
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);
  
  // Estado para prévia de vídeo
  const [previewVideoUrl, setPreviewVideoUrl] = useState("");
  const [previewVideoSource, setPreviewVideoSource] = useState<VideoSource>("youtube");
  
  // Estados para formulários de questões
  const [questionOptions, setQuestionOptions] = useState<string[]>(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState<number>(0);
  
  // Contador de progresso
  const [completionProgress, setCompletionProgress] = useState(0);

  // Sidebar items for admin portal
  const sidebarItems = [
    { name: "Dashboard", icon: <DashboardIcon />, href: "/admin/dashboard" },
    { name: "Disciplinas", icon: <BookIcon />, href: "/admin/disciplines", active: true },
    { name: "Cursos", icon: <SchoolIcon />, href: "/admin/courses" },
  ];

  // Consulta para obter a disciplina pelo ID
  const { 
    data: discipline, 
    isLoading: isDisciplineLoading, 
    isError: isDisciplineError,
    error: disciplineError,
    refetch: refetchDiscipline
  } = useQuery({
    queryKey: [buildApiUrl(`/admin/disciplines/${disciplineId}`)],
    queryFn: async () => {
      try {
        console.log(`Buscando disciplina com ID: ${disciplineId}`);
        // Usando a função centralizada para construir a URL
        const response = await fetchDiscipline(disciplineId);
        
        // Verifica o tipo de conteúdo da resposta
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.error(`Erro: Resposta não é JSON. Content-Type: ${contentType}`);
          
          // Obtém o texto da resposta para diagnóstico
          const text = await response.text();
          console.error(`Resposta recebida (primeiros 100 caracteres): ${text.substring(0, 100)}...`);
          
          throw new Error(`Resposta do servidor não é JSON. Recebido: ${contentType || "desconhecido"}`);
        }
        
        // Se chegou aqui, é seguro processar como JSON
        const response_data = await response.clone().json();
        console.log(`Dados da disciplina recebidos:`, response_data);
        
        // Verifica formato de resposta padrão da API {success: boolean, data: object}
        let data;
        if (response_data && typeof response_data === 'object' && 'success' in response_data && 'data' in response_data) {
          data = response_data.data;
        } else {
          data = response_data; // Se não estiver no formato padrão, usa o objeto completo
        }
        
        // Verifica se a resposta é um objeto vazio ou null
        if (!data) {
          throw new Error("Dados da disciplina não encontrados");
        }
        
        // Verifica se é um array vazio ou objeto JSON sem propriedade id
        if (Array.isArray(data) && data.length === 0) {
          throw new Error("Disciplina retornou array vazio");
        }
        
        // Verificação básica - ID é essencial, o resto pode ser null
        if (!data.id) {
          throw new Error(`Dados da disciplina inválidos: ${JSON.stringify(data)}`);
        }
        
        // Preenche valores padrão para campos que podem ser null
        // Isso garante que a UI não quebre ao tentar acessar esses campos
        return {
          ...data,
          // Definindo valores padrão para os campos que podem ser null
          videoAula1Url: data.videoAula1Url || null,
          videoAula1Source: data.videoAula1Source || null,
          videoAula2Url: data.videoAula2Url || null,
          videoAula2Source: data.videoAula2Source || null,
          videoAula3Url: data.videoAula3Url || null,
          videoAula3Source: data.videoAula3Source || null,
          videoAula4Url: data.videoAula4Url || null,
          videoAula4Source: data.videoAula4Source || null,
          videoAula5Url: data.videoAula5Url || null,
          videoAula5Source: data.videoAula5Source || null,
          videoAula6Url: data.videoAula6Url || null,
          videoAula6Source: data.videoAula6Source || null,
          videoAula7Url: data.videoAula7Url || null,
          videoAula7Source: data.videoAula7Source || null,
          videoAula8Url: data.videoAula8Url || null,
          videoAula8Source: data.videoAula8Source || null,
          videoAula9Url: data.videoAula9Url || null,
          videoAula9Source: data.videoAula9Source || null,
          videoAula10Url: data.videoAula10Url || null,
          videoAula10Source: data.videoAula10Source || null,
          apostilaPdfUrl: data.apostilaPdfUrl || null,
          ebookInterativoUrl: data.ebookInterativoUrl || null,
          contentStatus: data.contentStatus || 'incomplete',
        };
      } catch (error) {
        console.error(`Erro ao buscar disciplina ${disciplineId}:`, error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
  });
  
  // Consulta para obter vídeos da disciplina
  const { 
    data: videos, 
    isLoading: isVideosLoading,
    refetch: refetchVideos
  } = useQuery({
    queryKey: [buildDisciplineVideosApiUrl(disciplineId)],
    queryFn: async () => {
      try {
        const response = await fetchDisciplineVideos(disciplineId);
        const data = await response.json();
        // Retorna array vazio se não houver dados
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Erro ao buscar vídeos da disciplina:", error);
        return []; // Retorna array vazio em caso de erro
      }
    },
  });
  
  // Consulta para obter apostila da disciplina
  const { 
    data: material, 
    isLoading: isMaterialLoading,
    refetch: refetchMaterial
  } = useQuery({
    queryKey: [buildDisciplineMaterialApiUrl(disciplineId)],
    queryFn: async () => {
      try {
        const response = await fetchDisciplineMaterial(disciplineId);
        const data = await response.json();
        return data || { apostilaPdfUrl: null, id: disciplineId };
      } catch (error) {
        console.error("Erro ao buscar material da disciplina:", error);
        return { apostilaPdfUrl: null, id: disciplineId };
      }
    },
  });
  
  // Consulta para obter e-book da disciplina
  const { 
    data: ebook, 
    isLoading: isEbookLoading,
    refetch: refetchEbook
  } = useQuery({
    queryKey: [buildDisciplineEbookApiUrl(disciplineId)],
    queryFn: async () => {
      try {
        const response = await fetchDisciplineEbook(disciplineId);
        const data = await response.json();
        return data || { ebookPdfUrl: null, ebookInterativoUrl: null, id: disciplineId };
      } catch (error) {
        console.error("Erro ao buscar e-book da disciplina:", error);
        return { ebookPdfUrl: null, ebookInterativoUrl: null, id: disciplineId };
      }
    },
  });
  
  // Consulta para obter questões da disciplina
  const { 
    data: questions, 
    isLoading: isQuestionsLoading,
    refetch: refetchQuestions
  } = useQuery({
    queryKey: [buildDisciplineQuestionsApiUrl(disciplineId)],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", buildDisciplineQuestionsApiUrl(disciplineId));
        const data = await response.json();
        // Retorna array vazio se não houver dados ou se o formato for inválido
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Erro ao buscar questões da disciplina:", error);
        return []; // Retorna array vazio em caso de erro
      }
    },
  });
  
  // Consulta para obter avaliações da disciplina
  const { 
    data: assessments, 
    isLoading: isAssessmentsLoading,
    refetch: refetchAssessments
  } = useQuery({
    queryKey: [buildDisciplineAssessmentsApiUrl(disciplineId)],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", buildDisciplineAssessmentsApiUrl(disciplineId));
        const data = await response.json();
        // Retorna array vazio se não houver dados ou se o formato for inválido
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Erro ao buscar avaliações da disciplina:", error);
        return []; // Retorna array vazio em caso de erro
      }
    },
  });
  
  // Mutation para adicionar vídeo
  const addVideoMutation = useMutation({
    mutationFn: async (data: VideoFormValues) => {
      const response = await apiRequest("POST", buildDisciplineVideosApiUrl(disciplineId), data);
      
      // Verificar o tipo de conteúdo antes de tentar parsear como JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Resposta do servidor não está no formato JSON');
      }
      
      try {
        return await response.json();
      } catch (error) {
        console.error('Erro ao parsear resposta como JSON:', error);
        throw new Error('Formato de resposta inválido');
      }
    },
    onSuccess: () => {
      toast({
        title: "Vídeo adicionado com sucesso!",
        description: "O vídeo foi vinculado à disciplina.",
      });
      refetchVideos();
      setIsVideoDialogOpen(false);
      videoForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar vídeo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation para editar vídeo
  const editVideoMutation = useMutation({
    mutationFn: async ({ videoId, data }: { videoId: number, data: VideoFormValues }) => {
      const videoUrl = buildApiUrl(`/admin/discipline-videos/${videoId}`);
      const response = await apiRequest("PUT", videoUrl, data);
      
      // Verificar o tipo de conteúdo antes de tentar parsear como JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Resposta do servidor não está no formato JSON');
      }
      
      try {
        return await response.json();
      } catch (error) {
        console.error('Erro ao parsear resposta como JSON:', error);
        throw new Error('Formato de resposta inválido');
      }
    },
    onSuccess: () => {
      toast({
        title: "Vídeo atualizado com sucesso!",
        description: "As alterações foram salvas.",
      });
      refetchVideos();
      setIsVideoEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar vídeo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation para excluir vídeo
  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const videoUrl = buildApiUrl(`/admin/discipline-videos/${videoId}?disciplineId=${disciplineId}`);
      const response = await apiRequest("DELETE", videoUrl);
      
      // Verificar o tipo de conteúdo antes de tentar parsear como JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Resposta do servidor não está no formato JSON');
      }
      
      try {
        return await response.json();
      } catch (error) {
        console.error('Erro ao parsear resposta como JSON:', error);
        throw new Error('Formato de resposta inválido');
      }
    },
    onSuccess: () => {
      toast({
        title: "Vídeo excluído com sucesso!",
        description: "O vídeo foi removido da disciplina.",
      });
      refetchVideos();
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir vídeo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation para adicionar apostila
  const addMaterialMutation = useMutation({
    mutationFn: async (data: MaterialFormValues) => {
      // Verificar se é upload de arquivo ou URL
      if (data.file) {
        // Criar FormData para upload de arquivo
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('file', data.file);
        
        const response = await fetch(buildDisciplineMaterialApiUrl(disciplineId), {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Erro ao fazer upload da apostila: ${response.statusText}`);
        }
        
        return await response.json();
      } else {
        // Envio de URL
        const response = await apiRequest("POST", buildDisciplineMaterialApiUrl(disciplineId), data);
        
        // Verificar o tipo de conteúdo antes de tentar parsear como JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Resposta do servidor não está no formato JSON');
        }
        
        try {
          return await response.json();
        } catch (error) {
          console.error('Erro ao parsear resposta como JSON:', error);
          throw new Error('Formato de resposta inválido');
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Apostila adicionada com sucesso!",
        description: "A apostila foi vinculada à disciplina.",
      });
      refetchMaterial();
      setIsMaterialDialogOpen(false);
      materialForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar apostila",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation para excluir apostila
  const deleteMaterialMutation = useMutation({
    mutationFn: async () => {
      const materialUrl = buildApiUrl(`/api/disciplines/${disciplineId}/material`);
      const response = await apiRequest("DELETE", materialUrl);
      
      if (!response.ok) {
        throw new Error(`Erro ao excluir apostila: ${response.statusText}`);
      }
      
      try {
        return await response.json();
      } catch (error) {
        console.error('Erro ao parsear resposta como JSON:', error);
        throw new Error('Formato de resposta inválido');
      }
    },
    onSuccess: () => {
      toast({
        title: "Apostila excluída com sucesso!",
        description: "A apostila foi removida da disciplina.",
      });
      refetchMaterial();
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir apostila",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation para adicionar link de e-book externo
  const addEbookLinkMutation = useMutation({
    mutationFn: async (data: EbookLinkFormValues) => {
      const response = await apiRequest("POST", buildDisciplineEbookApiUrl(disciplineId), data);
      
      // Verificar o tipo de conteúdo antes de tentar parsear como JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Resposta do servidor não está no formato JSON');
      }
      
      try {
        return await response.json();
      } catch (error) {
        console.error('Erro ao parsear resposta como JSON:', error);
        throw new Error('Formato de resposta inválido');
      }
    },
    onSuccess: () => {
      toast({
        title: "E-book adicionado com sucesso!",
        description: "O link para o e-book externo foi vinculado à disciplina.",
      });
      refetchEbook();
      setIsEbookLinkDialogOpen(false);
      ebookLinkForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar e-book",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation para adicionar questão
  const addQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormValues & { disciplineId: number }) => {
      const response = await apiRequest("POST", buildApiUrl("/admin/questions"), data);
      
      // Verificar o tipo de conteúdo antes de tentar parsear como JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Resposta do servidor não está no formato JSON');
      }
      
      try {
        return await response.json();
      } catch (error) {
        console.error('Erro ao parsear resposta como JSON:', error);
        throw new Error('Formato de resposta inválido');
      }
    },
    onSuccess: () => {
      toast({
        title: "Questão adicionada com sucesso!",
        description: "A questão foi salva no banco de questões.",
      });
      refetchQuestions();
      setIsQuestionDialogOpen(false);
      questionForm.reset();
      setQuestionOptions(["", "", "", ""]);
      setCorrectOption(0);
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar questão",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation para adicionar avaliação
  const addAssessmentMutation = useMutation({
    mutationFn: async (data: AssessmentFormValues & { disciplineId: number }) => {
      // Usar o endpoint criado para avaliações
      const disciplineId = data.disciplineId;
      const response = await apiRequest("POST", buildApiUrl(`/api/disciplines/${disciplineId}/assessments`), data);
      
      // Verificar o tipo de conteúdo antes de tentar parsear como JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Resposta do servidor não está no formato JSON');
      }
      
      try {
        return await response.json();
      } catch (error) {
        console.error('Erro ao parsear resposta como JSON:', error);
        throw new Error('Formato de resposta inválido');
      }
    },
    onSuccess: () => {
      toast({
        title: "Avaliação criada com sucesso!",
        description: "A avaliação foi vinculada à disciplina.",
      });
      refetchAssessments();
      setIsAssessmentDialogOpen(false);
      assessmentForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar avaliação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation para verificar completude da disciplina
  const checkCompletenesssMutation = useMutation({
    mutationFn: async () => {
      const completenessUrl = buildApiUrl(`/admin/disciplines/${disciplineId}/check-completeness`);
      const response = await apiRequest("GET", completenessUrl);
      
      // Verificar o tipo de conteúdo antes de tentar parsear como JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Resposta do servidor não está no formato JSON');
      }
      
      try {
        return await response.json();
      } catch (error) {
        console.error('Erro ao parsear resposta como JSON:', error);
        throw new Error('Formato de resposta inválido');
      }
    },
    onSuccess: (data) => {
      if (data.complete) {
        toast({
          title: "Disciplina completa!",
          description: "Todos os elementos pedagógicos foram adicionados.",
        });
      } else {
        toast({
          title: "Disciplina incompleta",
          description: "Alguns elementos pedagógicos ainda precisam ser adicionados.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao verificar completude",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Formulários
  const videoForm = useForm<VideoFormValues>({
    resolver: zodResolver(videoFormSchema),
    defaultValues: {
      title: "",
      description: "",
      videoSource: "youtube",
      url: "",
      duration: "00:00",
    },
  });
  
  const materialForm = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
    },
  });
  
  // Formulário para inserir link de e-book externo
  const ebookLinkForm = useForm<EbookLinkFormValues>({
    resolver: zodResolver(ebookLinkFormSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
    },
  });
  
  const questionForm = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      statement: "",
      options: ["", "", "", ""],
      correctOption: 0,
      explanation: "",
    },
  });
  
  const assessmentForm = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "simulado",
      passingScore: 6,
      questionIds: [],
    },
  });
  
  // Funções para manipular dialogs
  const handleOpenVideoDialog = () => {
    videoForm.reset();
    // Resetar os estados de prévia ao abrir o diálogo
    setPreviewVideoUrl("");
    setPreviewVideoSource("youtube");
    setIsVideoDialogOpen(true);
  };
  
  const handleOpenVideoEditDialog = (video: any) => {
    setSelectedVideo(video);
    // Inicializar o formulário com os dados do vídeo
    videoForm.reset({
      title: video.title,
      description: video.description,
      videoSource: video.videoSource,
      url: video.url,
      duration: video.duration,
      startTime: video.startTime || "", // Incluir campo de tempo de início
    });
    // Inicializar estados de prévia com os dados do vídeo
    setPreviewVideoUrl(video.url);
    setPreviewVideoSource(video.videoSource as VideoSource);
    setIsVideoEditDialogOpen(true);
  };
  
  // Função para excluir um vídeo
  const handleDeleteVideo = (videoId: number) => {
    // Mostrar um diálogo de confirmação antes de excluir
    if (confirm('Tem certeza que deseja excluir este vídeo? Esta ação não pode ser desfeita.')) {
      deleteVideoMutation.mutate(videoId);
    }
  };
  
  const handleOpenMaterialDialog = () => {
    materialForm.reset();
    setIsMaterialDialogOpen(true);
  };
  
  // Manipulador para abrir o diálogo de link de e-book
  const handleOpenEbookLinkDialog = () => {
    ebookLinkForm.reset();
    setIsEbookLinkDialogOpen(true);
  };
  
  const handleOpenQuestionDialog = () => {
    questionForm.reset();
    setQuestionOptions(["", "", "", ""]);
    setCorrectOption(0);
    setIsQuestionDialogOpen(true);
  };
  
  const handleOpenAssessmentDialog = (type: "simulado" | "avaliacao_final") => {
    setSelectedAssessmentType(type);
    assessmentForm.reset({
      title: type === "simulado" ? "Simulado" : "Avaliação Final",
      description: type === "simulado" 
        ? "Simulado para prática e preparação" 
        : "Avaliação final para certificação",
      type: type,
      passingScore: 6,
    });
    setIsAssessmentDialogOpen(true);
  };
  
  // Funções para envio de formulários
  const onVideoSubmit = (data: VideoFormValues) => {
    addVideoMutation.mutate(data);
  };
  
  const onVideoEditSubmit = (data: VideoFormValues) => {
    if (selectedVideo) {
      editVideoMutation.mutate({ videoId: selectedVideo.id, data });
    }
  };
  
  const onMaterialSubmit = (data: MaterialFormValues) => {
    addMaterialMutation.mutate(data);
  };
  
  // Função para submeter o formulário de link de e-book
  const onEbookLinkSubmit = (data: EbookLinkFormValues) => {
    addEbookLinkMutation.mutate(data);
  };
  
  const onQuestionSubmit = (data: QuestionFormValues) => {
    addQuestionMutation.mutate({ ...data, disciplineId });
  };
  
  const onAssessmentSubmit = (data: AssessmentFormValues) => {
    console.log("Enviando dados de avaliação:", { ...data, disciplineId });
    // Verificar se há questões selecionadas
    if (!data.questionIds || data.questionIds.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos uma questão para a avaliação.",
        variant: "destructive",
      });
      return;
    }
    
    // Enviar dados para o backend
    addAssessmentMutation.mutate({ ...data, disciplineId });
  };
  
  // Manipuladores de opções para questões
  const handleAddOption = () => {
    if (questionOptions.length < 5) {
      setQuestionOptions([...questionOptions, ""]);
    }
  };
  
  const handleRemoveOption = (index: number) => {
    if (questionOptions.length > 4) {
      const newOptions = [...questionOptions];
      newOptions.splice(index, 1);
      setQuestionOptions(newOptions);
      
      // Ajusta a opção correta se necessário
      if (correctOption === index) {
        setCorrectOption(0);
      } else if (correctOption > index) {
        setCorrectOption(correctOption - 1);
      }
    }
  };
  
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...questionOptions];
    newOptions[index] = value;
    setQuestionOptions(newOptions);
    
    // Atualiza o formulário
    questionForm.setValue("options", newOptions);
  };
  
  // Calcula o progresso de completude
  useEffect(() => {
    let progress = 0;
    const totalItems = 5; // 2 vídeos, 1 apostila, 1 e-book, 1 conjunto de avaliações
    
    if (videos && videos.length >= 2) progress++; // Vídeos
    if (material) progress++; // Apostila
    if (ebook) progress++; // E-book
    
    // Simulado com pelo menos 30 questões
    const simulado = assessments?.find((a: any) => a.type === "simulado");
    if (simulado && (simulado.questionCount || 0) >= 30) progress++;
    
    // Avaliação final com pelo menos 10 questões
    const avaliacao = assessments?.find((a: any) => a.type === "avaliacao_final");
    if (avaliacao && (avaliacao.questionCount || 0) >= 10) progress++;
    
    setCompletionProgress(Math.floor((progress / totalItems) * 100));
  }, [videos, material, ebook, assessments]);

  // Efeito para fechar menu mobile quando a tela é redimensionada
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Loading state
  if (isDisciplineLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar
          items={sidebarItems}
          user={typedUser}
          portalType="admin"
          portalColor="#3451B2"
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        <div className="flex-1 overflow-auto p-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-[250px]" />
            <Skeleton className="h-4 w-[350px]" />
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(3)
                .fill(0)
                .map((_, index) => (
                  <Card key={index} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-[180px] mb-2" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3 mt-2" />
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isDisciplineError || !discipline) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar
          items={sidebarItems}
          user={typedUser}
          portalType="admin"
          portalColor="#3451B2"
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        <div className="flex-1 overflow-auto p-8">
          <Alert variant="destructive" className="mb-6">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Erro ao carregar disciplina</AlertTitle>
            <AlertDescription>
              Não foi possível carregar os dados da disciplina. Verifique se o ID está correto.
              {disciplineError && (
                <div className="mt-2 text-xs bg-red-50 p-2 rounded border border-red-200">
                  Detalhes do erro: {disciplineError instanceof Error ? disciplineError.message : 'Erro desconhecido'}
                </div>
              )}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => refetchDiscipline()}
            className="mb-4 mr-2"
            variant="outline"
          >
            <RefreshCwIcon className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
          <Button
            onClick={() => navigate("/admin/academico/disciplines")}
            className="mt-4"
            variant="outline"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Voltar para Lista de Disciplinas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        items={sidebarItems}
        user={typedUser}
        portalType="admin"
        portalColor="#3451B2"
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 py-20 md:py-6 md:px-8">
          {/* Header */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/admin/academico/disciplines")}
                  className="mr-2"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">
                  {discipline.code} - {discipline.name}
                </h1>
              </div>
              <p className="text-gray-600">
                Gerencie o conteúdo pedagógico da disciplina
              </p>
            </div>
            <div className="mt-4 flex space-x-2 md:mt-0">
              <Button
                onClick={() => checkCompletenesssMutation.mutate()}
                className="flex items-center"
                variant="outline"
              >
                <CheckCircleIcon className="mr-1 h-4 w-4" />
                Verificar Completude
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Progresso de Completude</h3>
                  <span className="text-sm font-semibold">{completionProgress}%</span>
                </div>
                <Progress value={completionProgress} className="h-2" />
                <p className="text-sm text-gray-500">
                  Complete todos os elementos pedagógicos para que a disciplina possa ser incluída em cursos.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="videos">Vídeo-aulas</TabsTrigger>
              <TabsTrigger value="materials">Apostila</TabsTrigger>
              <TabsTrigger value="ebook">E-book</TabsTrigger>
              <TabsTrigger value="assessments">Avaliações</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Card de Vídeos */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <VideoIcon className="mr-2 h-5 w-5" />
                      Vídeo-aulas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Progresso:</span>
                        <Badge variant={videos && videos.length >= 2 ? "default" : "outline"}>
                          {videos ? videos.length : 0}/2
                        </Badge>
                      </div>
                      <Progress value={videos ? Math.min(videos.length / 2 * 100, 100) : 0} className="h-2" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => setActiveTab("videos")} 
                      variant="outline" 
                      className="w-full"
                    >
                      {videos && videos.length >= 2 ? "Gerenciar Vídeos" : "Adicionar Vídeos"}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Card de Apostila */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <FileTextIcon className="mr-2 h-5 w-5" />
                      Apostila
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Progresso:</span>
                        <Badge variant={material ? "default" : "outline"}>
                          {material ? "1" : "0"}/1
                        </Badge>
                      </div>
                      <Progress value={material ? 100 : 0} className="h-2" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => setActiveTab("materials")} 
                      variant="outline" 
                      className="w-full"
                    >
                      {material ? "Gerenciar Apostila" : "Adicionar Apostila"}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Card de E-book */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <BookIcon className="mr-2 h-5 w-5" />
                      E-book Interativo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Progresso:</span>
                        <Badge variant={ebook ? "default" : "outline"}>
                          {ebook ? "1" : "0"}/1
                        </Badge>
                      </div>
                      <Progress value={ebook ? 100 : 0} className="h-2" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => setActiveTab("ebook")} 
                      variant="outline" 
                      className="w-full"
                    >
                      {ebook ? "Gerenciar E-book" : "Adicionar E-book"}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Card de Simulado */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <FileIcon className="mr-2 h-5 w-5" />
                      Simulado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(() => {
                        const simulado = assessments?.find((a: any) => a.type === "simulado");
                        const questionCount = simulado?.questionCount || 0;
                        const progress = Math.min(questionCount / 30 * 100, 100);
                        
                        return (
                          <>
                            <div className="flex justify-between items-center">
                              <span>Questões:</span>
                              <Badge variant={questionCount >= 30 ? "default" : "outline"}>
                                {questionCount}/30
                              </Badge>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </>
                        );
                      })()}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => setActiveTab("assessments")} 
                      variant="outline" 
                      className="w-full"
                    >
                      {assessments?.some((a: { type: string }) => a.type === "simulado") 
                        ? "Gerenciar Simulado" 
                        : "Adicionar Simulado"}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Card de Avaliação Final */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <CheckIcon className="mr-2 h-5 w-5" />
                      Avaliação Final
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(() => {
                        const avaliacao = assessments?.find((a: any) => a.type === "avaliacao_final");
                        const questionCount = avaliacao?.questionCount || 0;
                        const progress = Math.min(questionCount / 10 * 100, 100);
                        
                        return (
                          <>
                            <div className="flex justify-between items-center">
                              <span>Questões:</span>
                              <Badge variant={questionCount >= 10 ? "default" : "outline"}>
                                {questionCount}/10
                              </Badge>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </>
                        );
                      })()}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => setActiveTab("assessments")} 
                      variant="outline" 
                      className="w-full"
                    >
                      {assessments?.some((a: { type: string }) => a.type === "avaliacao_final") 
                        ? "Gerenciar Avaliação" 
                        : "Adicionar Avaliação"}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Card de Informações da Disciplina */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Informações Gerais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500">Código</h4>
                        <p>{discipline.code}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500">Carga Horária</h4>
                        <p>{discipline.workload} horas</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500">Status</h4>
                        <Badge variant={completionProgress >= 100 ? "default" : "outline"}>
                          {completionProgress >= 100 ? "Completa" : "Incompleta"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>Vídeo-aulas</CardTitle>
                      <CardDescription>
                        Adicione até 10 vídeo-aulas para a disciplina
                      </CardDescription>
                    </div>
                    <Button
                      onClick={handleOpenVideoDialog}
                      className="mt-4 md:mt-0"
                      disabled={videos && videos.length >= 10}
                    >
                      <PlusIcon className="mr-1 h-4 w-4" />
                      Adicionar Vídeo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isVideosLoading ? (
                    <div className="space-y-4">
                      {Array(10)
                        .fill(0)
                        .map((_, index) => (
                          <div key={index} className="flex flex-col space-y-2">
                            <Skeleton className="h-40 w-full" />
                            <Skeleton className="h-6 w-[250px]" />
                            <Skeleton className="h-4 w-full" />
                          </div>
                        ))}
                    </div>
                  ) : !videos || videos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <VideoIcon className="h-16 w-16 text-gray-300" />
                      <h3 className="mt-4 text-lg font-semibold text-gray-900">
                        Nenhuma vídeo-aula adicionada
                      </h3>
                      <p className="mt-1 text-gray-500">
                        Adicione vídeo-aulas para enriquecer o conteúdo da disciplina.
                      </p>
                      <Button onClick={handleOpenVideoDialog} className="mt-4">
                        <PlusIcon className="mr-1 h-4 w-4" />
                        Adicionar Vídeo
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {videos.map((video: { 
                        id: number, 
                        title: string, 
                        description: string, 
                        duration: string, 
                        videoSource: string, 
                        url: string,
                        startTime?: string
                      }) => (
                        <Card key={video.id} className="overflow-hidden">
                          <div className="relative aspect-video bg-gray-200">
                            {video.videoSource === 'youtube' ? (
                              <EmbeddedVideoPlayer 
                                url={video.url}
                                title={video.title}
                                source={'youtube'}
                                startTime={video.startTime}
                                className="w-full h-full"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <PlayIcon className="h-12 w-12 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <CardContent className="p-4">
                            <h3 className="text-lg font-semibold">{video.title}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                              {video.description}
                            </p>
                            <div className="flex flex-col mt-2 text-sm text-gray-500">
                              <span>Duração: {video.duration}</span>
                              {video.startTime && video.videoSource === 'youtube' && (
                                <span className="text-emerald-600 mt-1">
                                  <ClockIcon className="h-3 w-3 inline-block mr-1" />
                                  Início em: {video.startTime}
                                </span>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter className="p-4 pt-0 flex justify-between">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenVideoEditDialog(video)}
                              >
                                <PencilIcon className="mr-1 h-4 w-4" />
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteVideo(video.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <MinusIcon className="mr-1 h-4 w-4" />
                                Excluir
                              </Button>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(video.url, "_blank")}
                            >
                              <LinkIcon className="mr-1 h-4 w-4" />
                              Visualizar
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Materials Tab */}
            <TabsContent value="materials">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>Apostila</CardTitle>
                      <CardDescription>
                        Adicione a apostila principal em PDF para esta disciplina
                      </CardDescription>
                    </div>
                    <Button
                      onClick={handleOpenMaterialDialog}
                      className="mt-4 md:mt-0"
                      disabled={material !== null && material !== undefined}
                    >
                      <PlusIcon className="mr-1 h-4 w-4" />
                      {material ? "Substituir Apostila" : "Adicionar Apostila"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isMaterialLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-40 w-full" />
                      <Skeleton className="h-6 w-[250px]" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ) : !material ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FileTextIcon className="h-16 w-16 text-gray-300" />
                      <h3 className="mt-4 text-lg font-semibold text-gray-900">
                        Nenhuma apostila adicionada
                      </h3>
                      <p className="mt-1 text-gray-500">
                        Adicione uma apostila em PDF com o conteúdo principal da disciplina.
                      </p>
                      <Button onClick={handleOpenMaterialDialog} className="mt-4">
                        <PlusIcon className="mr-1 h-4 w-4" />
                        Adicionar Apostila
                      </Button>
                    </div>
                  ) : (
                    <Card>
                      <div className="p-6 flex flex-col md:flex-row gap-6">
                        <div className="relative aspect-[3/4] bg-gray-100 rounded-md min-w-[200px] overflow-hidden">
                          {material.url ? (
                            <iframe
                              src={`${material.url}#page=1&view=FitH`}
                              className="w-full h-full"
                              title={material.title || 'Visualização da apostila'}
                              sandbox="allow-scripts allow-same-origin"
                            />
                          ) : (
                            <div className="flex justify-center items-center h-full w-full">
                              <FileTextIcon className="h-20 w-20 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold">{material.title}</h3>
                          <p className="mt-2 text-gray-600">{material.description}</p>
                          <div className="mt-6 flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              onClick={() => window.open(material.url, "_blank")}
                            >
                              <LinkIcon className="mr-1 h-4 w-4" />
                              Visualizar PDF
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                materialForm.reset({
                                  title: material.title,
                                  description: material.description,
                                  url: material.url,
                                });
                                setIsMaterialDialogOpen(true);
                              }}
                            >
                              <PencilIcon className="mr-1 h-4 w-4" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                if (confirm('Tem certeza que deseja excluir esta apostila? Esta ação não pode ser desfeita.')) {
                                  deleteMaterialMutation.mutate();
                                }
                              }}
                            >
                              <MinusIcon className="mr-1 h-4 w-4" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* E-book Tab */}
            <TabsContent value="ebook">
              <EbookContentSection disciplineId={Number(disciplineId)} />
            </TabsContent>

            {/* Assessments Tab */}
            <TabsContent value="assessments">
              <div className="space-y-6">
                {/* Seção de Questões */}
                <Card>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle>Banco de Questões</CardTitle>
                        <CardDescription>
                          Gerencie as questões que serão utilizadas nas avaliações
                        </CardDescription>
                      </div>
                      <Button
                        onClick={handleOpenQuestionDialog}
                        className="mt-4 md:mt-0"
                      >
                        <PlusIcon className="mr-1 h-4 w-4" />
                        Nova Questão
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isQuestionsLoading ? (
                      <div className="space-y-4">
                        {Array(3)
                          .fill(0)
                          .map((_, index) => (
                            <Skeleton key={index} className="h-20 w-full" />
                          ))}
                      </div>
                    ) : !questions || questions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <AlertTriangleIcon className="h-16 w-16 text-gray-300" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">
                          Nenhuma questão adicionada
                        </h3>
                        <p className="mt-1 text-gray-500">
                          Adicione questões ao banco para criar avaliações e simulados.
                        </p>
                        <Button onClick={handleOpenQuestionDialog} className="mt-4">
                          <PlusIcon className="mr-1 h-4 w-4" />
                          Adicionar Questão
                        </Button>
                      </div>
                    ) : (
                      <Accordion type="single" collapsible className="w-full">
                        {questions.map((question: any, index: number) => (
                          <AccordionItem key={question.id} value={`question-${question.id}`}>
                            <AccordionTrigger className="text-left">
                              Questão {index + 1}: {question.statement.substring(0, 80)}
                              {question.statement.length > 80 ? "..." : ""}
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4 p-2">
                                <div>
                                  <h4 className="font-semibold">Enunciado:</h4>
                                  <p className="mt-1">{question.statement}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Alternativas:</h4>
                                  <ul className="space-y-2">
                                    {question.options.map((option: string, i: number) => (
                                      <li key={i} className="flex items-start">
                                        <span className={`font-medium ${i === question.correctOption ? "text-green-600" : ""}`}>
                                          {String.fromCharCode(65 + i)}.
                                        </span>
                                        <span className="ml-2">{option}</span>
                                        {i === question.correctOption && (
                                          <Badge className="ml-2 bg-green-500">Correta</Badge>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="font-semibold">Explicação:</h4>
                                  <p className="mt-1">{question.explanation}</p>
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedQuestion(question);
                                      questionForm.reset({
                                        statement: question.statement,
                                        options: question.options,
                                        correctOption: question.correctOption,
                                        explanation: question.explanation,
                                      });
                                      setQuestionOptions(question.options);
                                      setCorrectOption(question.correctOption);
                                      setIsQuestionDialogOpen(true);
                                    }}
                                  >
                                    <PencilIcon className="mr-1 h-4 w-4" />
                                    Editar
                                  </Button>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </CardContent>
                </Card>

                {/* Seção de Simulado */}
                <Card>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle>Simulado</CardTitle>
                        <CardDescription>
                          Configure o simulado com 30 questões para prática dos alunos
                        </CardDescription>
                      </div>
                      {!assessments?.some((a: { type: string }) => a.type === "simulado") && (
                        <Button
                          onClick={() => handleOpenAssessmentDialog("simulado")}
                          className="mt-4 md:mt-0"
                          disabled={!questions || questions.length < 1} // Reduzindo o requisito
                        >
                          <PlusIcon className="mr-1 h-4 w-4" />
                          Criar Simulado
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isAssessmentsLoading ? (
                      <Skeleton className="h-40 w-full" />
                    ) : assessments?.some((a: { type: string }) => a.type === "simulado") ? (
                      (() => {
                        const simulado = assessments.find((a: { type: string }) => a.type === "simulado");
                        if (!simulado) return null;
                        
                        return (
                          <Card>
                            <div className="p-6">
                              <h3 className="text-xl font-semibold">{simulado.title}</h3>
                              <p className="mt-2 text-gray-600">{simulado.description}</p>
                              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-500">Questões</h4>
                                  <p className="text-lg">
                                    {simulado.questionCount || 0} de 30 necessárias
                                  </p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-500">Nota para Aprovação</h4>
                                  <p className="text-lg">{simulado.passingScore}</p>
                                </div>
                              </div>
                              <div className="mt-6 flex flex-wrap gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    assessmentForm.reset({
                                      title: simulado.title,
                                      description: simulado.description,
                                      type: "simulado",
                                      passingScore: simulado.passingScore,
                                    });
                                    setSelectedAssessmentType("simulado");
                                    setIsAssessmentDialogOpen(true);
                                  }}
                                >
                                  <PencilIcon className="mr-1 h-4 w-4" />
                                  Editar
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {}}
                                >
                                  <PlusIcon className="mr-1 h-4 w-4" />
                                  Adicionar Questões
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })()
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <AlertCircleIcon className="h-16 w-16 text-gray-300" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">
                          Simulado não configurado
                        </h3>
                        <p className="mt-1 text-gray-500">
                          {!questions || questions.length < 30
                            ? `Você precisa adicionar pelo menos 30 questões no banco. Atualmente tem ${questions ? questions.length : 0} questão(ões).`
                            : "Configure o simulado para prática dos alunos."}
                        </p>
                        <Button
                          onClick={() => {
                            if (questions && questions.length >= 1) { // Reduzindo o requisito
                              handleOpenAssessmentDialog("simulado");
                            } else {
                              handleOpenQuestionDialog();
                            }
                          }}
                          className="mt-4"
                          disabled={!questions || questions.length < 1} // Reduzindo o requisito
                        >
                          <PlusIcon className="mr-1 h-4 w-4" />
                          {!questions || questions.length < 1 // Reduzindo o requisito
                            ? "Adicionar Questão"
                            : "Criar Simulado"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Seção de Avaliação Final */}
                <Card>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle>Avaliação Final</CardTitle>
                        <CardDescription>
                          Configure a avaliação final com 10 questões para certificação dos alunos
                        </CardDescription>
                      </div>
                      {!assessments?.some((a: { type: string }) => a.type === "avaliacao_final") && (
                        <Button
                          onClick={() => handleOpenAssessmentDialog("avaliacao_final")}
                          className="mt-4 md:mt-0"
                          disabled={!questions || questions.length < 1} // Reduzindo o requisito
                        >
                          <PlusIcon className="mr-1 h-4 w-4" />
                          Criar Avaliação
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isAssessmentsLoading ? (
                      <Skeleton className="h-40 w-full" />
                    ) : assessments?.some((a: { type: string }) => a.type === "avaliacao_final") ? (
                      (() => {
                        const avaliacao = assessments.find((a: { type: string }) => a.type === "avaliacao_final");
                        if (!avaliacao) return null;
                        
                        return (
                          <Card>
                            <div className="p-6">
                              <h3 className="text-xl font-semibold">{avaliacao.title}</h3>
                              <p className="mt-2 text-gray-600">{avaliacao.description}</p>
                              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-500">Questões</h4>
                                  <p className="text-lg">
                                    {avaliacao.questionCount || 0} de 10 necessárias
                                  </p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-500">Nota para Aprovação</h4>
                                  <p className="text-lg">{avaliacao.passingScore}</p>
                                </div>
                              </div>
                              <div className="mt-6 flex flex-wrap gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    assessmentForm.reset({
                                      title: avaliacao.title,
                                      description: avaliacao.description,
                                      type: "avaliacao_final",
                                      passingScore: avaliacao.passingScore,
                                    });
                                    setSelectedAssessmentType("avaliacao_final");
                                    setIsAssessmentDialogOpen(true);
                                  }}
                                >
                                  <PencilIcon className="mr-1 h-4 w-4" />
                                  Editar
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {}}
                                >
                                  <PlusIcon className="mr-1 h-4 w-4" />
                                  Adicionar Questões
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })()
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <AlertCircleIcon className="h-16 w-16 text-gray-300" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">
                          Avaliação final não configurada
                        </h3>
                        <p className="mt-1 text-gray-500">
                          {!questions || questions.length < 10
                            ? `Você precisa adicionar pelo menos 10 questões no banco. Atualmente tem ${questions ? questions.length : 0} questão(ões).`
                            : "Configure a avaliação final para certificação dos alunos."}
                        </p>
                        <Button
                          onClick={() => {
                            if (questions && questions.length >= 1) { // Reduzindo o requisito
                              handleOpenAssessmentDialog("avaliacao_final");
                            } else {
                              handleOpenQuestionDialog();
                            }
                          }}
                          className="mt-4"
                          disabled={!questions || questions.length < 1} // Reduzindo o requisito
                        >
                          <PlusIcon className="mr-1 h-4 w-4" />
                          {!questions || questions.length < 1 // Reduzindo o requisito
                            ? "Adicionar Questão"
                            : "Criar Avaliação"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Add Video Dialog */}
      <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Adicionar Vídeo-aula</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para adicionar uma vídeo-aula à disciplina.
            </DialogDescription>
          </DialogHeader>
          <Form {...videoForm}>
            <form onSubmit={videoForm.handleSubmit(onVideoSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <VideoFormFields 
                    control={videoForm.control} 
                    idSuffix="" 
                    setPreviewVideoUrl={setPreviewVideoUrl}
                    setPreviewVideoSource={setPreviewVideoSource}
                    watch={videoForm.watch}
                  />
                </div>
                <div className="flex flex-col space-y-4">
                  <div className="rounded-md border p-1">
                    <div className="text-sm font-medium mb-2 px-2">Prévia do Vídeo</div>
                    {previewVideoUrl ? (
                      <div className="aspect-video relative overflow-hidden rounded-md">
                        <EmbeddedVideoPlayer 
                          url={previewVideoUrl} 
                          source={previewVideoSource} 
                          title="Prévia do vídeo" 
                        />
                      </div>
                    ) : (
                      <div className="aspect-video flex items-center justify-center bg-slate-100 rounded-md text-slate-500">
                        <div className="text-center">
                          <VideoIcon className="h-10 w-10 mx-auto mb-2 text-slate-400" />
                          <p>Insira a URL do vídeo para visualizar a prévia</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 px-2">
                    <p>Dica: Visualize o vídeo antes de adicionar para garantir que está funcionando corretamente.</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsVideoDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Adicionar Vídeo</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Video Dialog */}
      <Dialog open={isVideoEditDialogOpen} onOpenChange={setIsVideoEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Editar Vídeo-aula</DialogTitle>
            <DialogDescription>
              Atualize as informações da vídeo-aula selecionada.
            </DialogDescription>
          </DialogHeader>
          <Form {...videoForm}>
            <form onSubmit={videoForm.handleSubmit(onVideoEditSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <VideoFormFields 
                    control={videoForm.control} 
                    idSuffix="-edit" 
                    setPreviewVideoUrl={setPreviewVideoUrl}
                    setPreviewVideoSource={setPreviewVideoSource}
                    watch={videoForm.watch}
                  />
                </div>
                <div className="flex flex-col space-y-4">
                  <div className="rounded-md border p-1">
                    <div className="text-sm font-medium mb-2 px-2">Prévia do Vídeo</div>
                    {previewVideoUrl ? (
                      <div className="aspect-video relative overflow-hidden rounded-md">
                        <EmbeddedVideoPlayer 
                          url={previewVideoUrl} 
                          source={previewVideoSource} 
                          title="Prévia do vídeo" 
                        />
                      </div>
                    ) : (
                      <div className="aspect-video flex items-center justify-center bg-slate-100 rounded-md text-slate-500">
                        <div className="text-center">
                          <VideoIcon className="h-10 w-10 mx-auto mb-2 text-slate-400" />
                          <p>Insira a URL do vídeo para visualizar a prévia</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 px-2">
                    <p>Dica: Visualize o vídeo antes de salvar para garantir que está funcionando corretamente.</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsVideoEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Material Dialog */}
      <Dialog open={isMaterialDialogOpen} onOpenChange={setIsMaterialDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Apostila</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para adicionar a apostila principal da disciplina.
            </DialogDescription>
          </DialogHeader>
          <Form {...materialForm}>
            <form onSubmit={materialForm.handleSubmit(onMaterialSubmit)} className="space-y-6">
              <FormField
                control={materialForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Apostila Completa de Matemática" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={materialForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrição do conteúdo da apostila..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-3">
                <div className="text-sm font-medium">Escolha uma opção:</div>
                <Tabs defaultValue="link" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="link">Link Externo</TabsTrigger>
                    <TabsTrigger value="upload">Upload de Arquivo</TabsTrigger>
                  </TabsList>
                  <TabsContent value="link" className="pt-4">
                    <FormField
                      control={materialForm.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL do PDF</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Link para o arquivo PDF da apostila. Pode ser um link direto ou de serviços como Google Drive.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  <TabsContent value="upload" className="pt-4">
                    <FormField
                      control={materialForm.control}
                      name="file"
                      render={({ field: { onChange, value, ...rest } }) => (
                        <FormItem>
                          <FormLabel>Arquivo PDF</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  onChange(file);
                                }
                              }}
                              {...rest}
                            />
                          </FormControl>
                          <FormDescription>
                            Selecione um arquivo PDF para upload (máximo 10MB).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMaterialDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Adicionar Apostila</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add E-book Dialog */}
      {/* Diálogo de E-book removido - usando interface completa em /admin/ebooks/generate */}

      {/* Add Question Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Questão</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para adicionar uma questão ao banco.
            </DialogDescription>
          </DialogHeader>
          <Form {...questionForm}>
            <form onSubmit={questionForm.handleSubmit(onQuestionSubmit)} className="space-y-6">
              <FormField
                control={questionForm.control}
                name="statement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enunciado</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Digite o enunciado da questão..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <FormLabel>Alternativas</FormLabel>
                <div className="space-y-3 mt-2">
                  {questionOptions.map((option, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="flex-shrink-0 pt-2">
                        <Label
                          htmlFor={`option-${index}`}
                          className="font-medium"
                        >
                          {String.fromCharCode(65 + index)}.
                        </Label>
                      </div>
                      <div className="flex-grow">
                        <div className="flex space-x-2">
                          <Input
                            id={`option-${index}`}
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                            className="flex-grow"
                          />
                          {index > 3 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleRemoveOption(index)}
                            >
                              <MinusIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {questionOptions.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddOption}
                      className="mt-2"
                    >
                      <PlusIcon className="mr-1 h-4 w-4" />
                      Adicionar Alternativa
                    </Button>
                  )}
                </div>
              </div>
              <FormField
                control={questionForm.control}
                name="correctOption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alternativa Correta</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => {
                          const index = parseInt(value);
                          setCorrectOption(index);
                          field.onChange(index);
                        }}
                        defaultValue={field.value.toString()}
                        className="flex flex-col space-y-1"
                      >
                        {questionOptions.map((_, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <RadioGroupItem
                              value={index.toString()}
                              id={`correct-${index}`}
                            />
                            <Label htmlFor={`correct-${index}`}>
                              Alternativa {String.fromCharCode(65 + index)}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={questionForm.control}
                name="explanation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Explicação</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Digite a explicação da resposta correta..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsQuestionDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Adicionar Questão</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Assessment Dialog */}
      <Dialog open={isAssessmentDialogOpen} onOpenChange={setIsAssessmentDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedAssessmentType === "simulado"
                ? "Criar Simulado"
                : "Criar Avaliação Final"}
            </DialogTitle>
            <DialogDescription>
              Configure os parâmetros da avaliação.
            </DialogDescription>
          </DialogHeader>
          <Form {...assessmentForm}>
            <form onSubmit={assessmentForm.handleSubmit(onAssessmentSubmit)} className="space-y-6">
              <FormField
                control={assessmentForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          selectedAssessmentType === "simulado"
                            ? "Ex: Simulado de Matemática"
                            : "Ex: Avaliação Final de Matemática"
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={assessmentForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrição da avaliação..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={assessmentForm.control}
                name="passingScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nota Mínima para Aprovação (0-10)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Defina a nota mínima que o aluno precisa atingir para ser aprovado.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={assessmentForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input type="hidden" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Seleção de questões */}
              <FormField
                control={assessmentForm.control}
                name="questionIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selecione as questões</FormLabel>
                    <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                      {isQuestionsLoading ? (
                        <div className="flex justify-center py-4">
                          <span className="animate-spin mr-2">◌</span> Carregando questões...
                        </div>
                      ) : questions && questions.length > 0 ? (
                        <div className="space-y-2">
                          {questions.map((question: any) => (
                            <div key={question.id} className="flex items-start space-x-2">
                              <Checkbox
                                id={`question-${question.id}`}
                                checked={field.value?.includes(question.id)}
                                onCheckedChange={(checked) => {
                                  const currentIds = [...(field.value || [])];
                                  if (checked) {
                                    if (!currentIds.includes(question.id)) {
                                      field.onChange([...currentIds, question.id]);
                                    }
                                  } else {
                                    field.onChange(currentIds.filter(id => id !== question.id));
                                  }
                                }}
                              />
                              <div className="grid gap-1.5 leading-none">
                                <label
                                  htmlFor={`question-${question.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {question.text.length > 100 
                                    ? `${question.text.substring(0, 100)}...` 
                                    : question.text}
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <p>Nenhuma questão disponível. Adicione questões primeiro.</p>
                        </div>
                      )}
                    </div>
                    <FormDescription>
                      {selectedAssessmentType === "simulado"
                        ? "Recomendamos selecionar pelo menos 30 questões para o simulado."
                        : "Recomendamos selecionar pelo menos 10 questões para a avaliação final."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAssessmentDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {addAssessmentMutation.isPending ? (
                    <>
                      <span className="animate-spin mr-2">◌</span>
                      Salvando...
                    </>
                  ) : (
                    selectedAssessmentType === "simulado"
                      ? "Criar Simulado"
                      : "Criar Avaliação"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog para inserir link de e-book externo */}
      <Dialog open={isEbookLinkDialogOpen} onOpenChange={setIsEbookLinkDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Inserir Link de E-book</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para adicionar um link para um e-book externo.
            </DialogDescription>
          </DialogHeader>
          <Form {...ebookLinkForm}>
            <form onSubmit={ebookLinkForm.handleSubmit(onEbookLinkSubmit)} className="space-y-6">
              <FormField
                control={ebookLinkForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: E-book Completo de Matemática" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={ebookLinkForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Breve descrição do conteúdo do e-book" 
                        className="min-h-[100px]" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={ebookLinkForm.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do E-book</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Insira a URL completa para o e-book externo, incluindo o protocolo (http:// ou https://)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEbookLinkDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {addEbookLinkMutation.isPending ? (
                    <>
                      <span className="animate-spin mr-2">◌</span>
                      Salvando...
                    </>
                  ) : (
                    "Adicionar E-book"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
