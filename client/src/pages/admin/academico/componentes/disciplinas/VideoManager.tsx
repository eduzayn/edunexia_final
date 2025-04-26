import { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  PlayIcon, 
  PlusIcon, 
  VideoIcon, 
  Youtube as YoutubeIcon, 
  Edit as EditIcon, 
  Trash as TrashIcon,
  Loader2 
} from "lucide-react";

// Custom Vimeo icon component
const VimeoIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 7c-5 0-9 4-9 9s4 9 9 9 9-4 9-9-4-9-9-9Zm0 16c-3.9 0-7-3.1-7-7s3.1-7 7-7 7 3.1 7 7-3.1 7-7 7Z" />
    <path d="M10 9v6l5-3-5-3Z" />
  </svg>
);

// Componente para mostrar uma miniatura do vídeo
interface VideoThumbnailProps {
  url: string;
  className?: string;
}

function VideoThumbnail({ url, className = "" }: VideoThumbnailProps) {
  // Retorna uma imagem estática para o vídeo (poderia ser mais sofisticado)
  return (
    <div className={`bg-gray-200 ${className}`}>
      <VideoIcon className="w-full h-full p-2 text-gray-400" />
    </div>
  );
}

// Componente para exibir o player de vídeo incorporado
interface EmbeddedVideoPlayerProps {
  url: string;
}

function EmbeddedVideoPlayer({ url }: EmbeddedVideoPlayerProps) {
  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      // Extract YouTube ID
      let videoId = '';
      if (url.includes('v=')) {
        videoId = url.split('v=')[1];
        const ampersandPosition = videoId.indexOf('&');
        if (ampersandPosition !== -1) {
          videoId = videoId.substring(0, ampersandPosition);
        }
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1];
      }
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    } else if (url.includes('vimeo.com')) {
      // Extract Vimeo ID
      let videoId = '';
      if (url.includes('vimeo.com/')) {
        videoId = url.split('vimeo.com/')[1];
        const questionMarkPosition = videoId.indexOf('?');
        if (questionMarkPosition !== -1) {
          videoId = videoId.substring(0, questionMarkPosition);
        }
      }
      return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
    }
    // Default fallback
    return url;
  };

  const embedUrl = getEmbedUrl(url);

  return (
    <iframe 
      src={embedUrl}
      className="w-full h-full" 
      allowFullScreen
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    ></iframe>
  );
}

// Interface para os campos do formulário de vídeo
interface VideoFormFields {
  title: string;
  description?: string;
  videoSource: "youtube" | "vimeo" | "other";
  url: string;
  duration: string;
  startTime: string;
}

// Esquema de validação para o formulário de vídeo
const videoFormSchema = z.object({
  title: z.string().min(3, { message: "O título deve ter pelo menos 3 caracteres" }),
  description: z.string().optional(),
  videoSource: z.enum(["youtube", "vimeo", "other"]),
  url: z.string().url({ message: "Insira uma URL válida" }),
  duration: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, { 
    message: "Formato: mm:ss ou hh:mm:ss" 
  }).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, { 
    message: "Formato: mm:ss ou hh:mm:ss" 
  }).optional(),
});

type VideoFormValues = z.infer<typeof videoFormSchema>;

// Componente para os campos específicos de vídeo (fonte, URL, duração)
function VideoFormFields({ form }: { form: any }) {
  return (
    <>
      <FormField
        control={form.control}
        name="videoSource"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Fonte do vídeo</FormLabel>
            <div className="grid grid-cols-3 gap-3">
              <Button
                type="button"
                variant={field.value === "youtube" ? "default" : "outline"}
                onClick={() => field.onChange("youtube")}
                className="justify-start"
              >
                <YoutubeIcon className="h-4 w-4 mr-2" />
                YouTube
              </Button>
              
              <Button
                type="button"
                variant={field.value === "vimeo" ? "default" : "outline"}
                onClick={() => field.onChange("vimeo")}
                className="justify-start"
              >
                <VimeoIcon className="h-4 w-4 mr-2" />
                Vimeo
              </Button>
              
              <Button
                type="button"
                variant={field.value === "other" ? "default" : "outline"}
                onClick={() => field.onChange("other")}
                className="justify-start"
              >
                <VideoIcon className="h-4 w-4 mr-2" />
                Outro
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL do vídeo</FormLabel>
            <FormControl>
              <Input 
                placeholder={`${
                  form.getValues("videoSource") === "youtube" 
                    ? "https://www.youtube.com/watch?v=..." 
                    : form.getValues("videoSource") === "vimeo"
                      ? "https://vimeo.com/..." 
                      : "https://..."
                }`} 
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duração (opcional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="mm:ss ou hh:mm:ss" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="startTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tempo de início (opcional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="mm:ss ou hh:mm:ss" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
}

// Função para detectar a fonte do vídeo a partir da URL
function detectVideoSource(url: string): "youtube" | "vimeo" | "other" {
  if (!url) return "other";
  
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return "youtube";
  } else if (url.includes('vimeo.com')) {
    return "vimeo";
  }
  
  return "other";
}

// Função para construir a URL da API de vídeos para uma disciplina
function buildDisciplineVideosApiUrl(disciplineId: number | string) {
  return `/api/disciplines/${disciplineId}/videos`;
}

// Componente principal de gerenciamento de vídeos
export function VideoManager({ disciplineId }: { disciplineId: number | string }) {
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [isVideoEditDialogOpen, setIsVideoEditDialogOpen] = useState(false);
  const [isVideoPreviewDialogOpen, setIsVideoPreviewDialogOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string>("");
  const [previewVideoSource, setPreviewVideoSource] = useState<"youtube" | "vimeo" | "other">("youtube");
  
  const queryClient = useQueryClient();
  
  // Busca a lista de vídeos da disciplina
  const { 
    data: videos, 
    isLoading: isVideosLoading,
    refetch: refetchVideos
  } = useQuery({
    queryKey: [buildDisciplineVideosApiUrl(disciplineId)],
    enabled: !!disciplineId,
  });
  
  // Mutation para adicionar vídeo
  const addVideoMutation = useMutation({
    mutationFn: (data: VideoFormValues) => {
      return apiRequest('POST', buildDisciplineVideosApiUrl(disciplineId), data);
    },
    onSuccess: () => {
      toast({
        title: "Vídeo adicionado com sucesso",
        description: "O vídeo foi vinculado à disciplina.",
        variant: "default",
      });
      setIsVideoDialogOpen(false);
      form.reset();
      // Recarrega a lista de vídeos
      queryClient.invalidateQueries({ queryKey: [buildDisciplineVideosApiUrl(disciplineId)] });
      refetchVideos();
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar vídeo",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutation para editar vídeo
  const editVideoMutation = useMutation({
    mutationFn: (data: VideoFormValues & { id: number }) => {
      const { id, ...videoData } = data;
      return apiRequest('PUT', `${buildDisciplineVideosApiUrl(disciplineId)}/${id}`, videoData);
    },
    onSuccess: () => {
      toast({
        title: "Vídeo atualizado com sucesso",
        description: "As alterações foram salvas.",
        variant: "default",
      });
      setIsVideoEditDialogOpen(false);
      // Recarrega a lista de vídeos
      queryClient.invalidateQueries({ queryKey: [buildDisciplineVideosApiUrl(disciplineId)] });
      refetchVideos();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar vídeo",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mutation para excluir vídeo
  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: number) => {
      return apiRequest('DELETE', `${buildDisciplineVideosApiUrl(disciplineId)}/${videoId}`);
    },
    onSuccess: () => {
      toast({
        title: "Vídeo excluído com sucesso",
        description: "O vídeo foi removido da disciplina.",
        variant: "default",
      });
      // Recarrega a lista de vídeos
      queryClient.invalidateQueries({ queryKey: [buildDisciplineVideosApiUrl(disciplineId)] });
      refetchVideos();
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir vídeo",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Formulário para adição de vídeo
  const form = useForm<VideoFormValues>({
    resolver: zodResolver(videoFormSchema),
    defaultValues: {
      title: "",
      description: "",
      videoSource: "youtube",
      url: "",
      duration: "00:00",
      startTime: "00:00",
    },
  });

  // Formulário para edição de vídeo
  const editForm = useForm<VideoFormValues>({
    resolver: zodResolver(videoFormSchema),
    defaultValues: {
      title: "",
      description: "",
      videoSource: "youtube",
      url: "",
      duration: "00:00",
      startTime: "00:00",
    },
  });

  const onSubmit = (data: VideoFormValues) => {
    addVideoMutation.mutate(data);
  };

  const onEditSubmit = (data: VideoFormValues) => {
    if (selectedVideoId) {
      editVideoMutation.mutate({ ...data, id: selectedVideoId });
    }
  };

  const handleEditVideo = (video: any) => {
    setSelectedVideoId(video.id);
    setSelectedVideo(video);
    
    // Preenche o formulário com os dados do vídeo
    editForm.reset({
      title: video.title || "",
      description: video.description || "",
      videoSource: video.videoSource || "youtube",
      url: video.url || "",
      duration: video.duration || "00:00",
      startTime: video.startTime || "00:00",
    });
    
    setIsVideoEditDialogOpen(true);
  };

  const handlePreviewVideo = (video: any) => {
    setSelectedVideo(video);
    setPreviewVideoUrl(video.url);
    setPreviewVideoSource(detectVideoSource(video.url));
    setIsVideoPreviewDialogOpen(true);
  };

  const handleDeleteVideo = (videoId: number) => {
    if (confirm("Tem certeza que deseja excluir este vídeo?")) {
      deleteVideoMutation.mutate(videoId);
    }
  };

  const renderVideoSourceIcon = (source: string, className = "h-4 w-4") => {
    switch (source) {
      case 'youtube':
        return <YoutubeIcon className={className} />;
      case 'vimeo':
        return <VimeoIcon className={className} />;
      default:
        return <VideoIcon className={className} />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl">Vídeo-aulas</CardTitle>
          <CardDescription>Adicione até 10 vídeos para esta disciplina</CardDescription>
        </div>
        <Button 
          size="sm" 
          onClick={() => setIsVideoDialogOpen(true)}
          disabled={videos && videos.length >= 10}
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Adicionar vídeo
        </Button>
      </CardHeader>
      <CardContent>
        {isVideosLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : videos && videos.length > 0 ? (
          <div className="space-y-2">
            {videos.map((video: any, index: number) => (
              <div key={video.id} className="flex items-center border rounded-md p-3 hover:bg-gray-50">
                <div className="w-24 h-16 relative rounded overflow-hidden bg-gray-100 mr-4 flex-shrink-0">
                  <VideoThumbnail 
                    url={video.url}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={() => handlePreviewVideo(video)}
                      className="bg-black bg-opacity-60 rounded-full p-1.5 hover:bg-opacity-80 transition-colors"
                    >
                      <PlayIcon className="h-5 w-5 text-white" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-grow">
                  <div className="flex items-center">
                    {renderVideoSourceIcon(video.videoSource, "h-3.5 w-3.5 mr-1 text-gray-500")}
                    <span className="text-xs text-gray-500">Vídeo {index + 1}</span>
                  </div>
                  <h3 className="font-medium">{video.title}</h3>
                  <p className="text-sm text-gray-600 truncate">{video.description}</p>
                </div>
                
                <div className="flex ml-4">
                  <Button variant="ghost" size="icon" onClick={() => handleEditVideo(video)}>
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteVideo(video.id)}>
                    <TrashIcon className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <VideoIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">Nenhum vídeo adicionado</h3>
            <p className="text-gray-500 mt-1">Clique no botão "Adicionar vídeo" para começar</p>
          </div>
        )}
      </CardContent>

      {/* Diálogo para adicionar vídeo */}
      <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Adicionar vídeo</DialogTitle>
            <DialogDescription>
              Adicione um vídeo à disciplina. Você pode usar vídeos do YouTube, Vimeo ou fazer upload.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do vídeo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Introdução à disciplina" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Breve descrição do conteúdo do vídeo" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <VideoFormFields form={form} />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsVideoDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={addVideoMutation.isPending}>
                  {addVideoMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Adicionar vídeo
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar vídeo */}
      <Dialog open={isVideoEditDialogOpen} onOpenChange={setIsVideoEditDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Editar vídeo</DialogTitle>
            <DialogDescription>
              Modifique as informações do vídeo selecionado.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do vídeo</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <VideoFormFields form={editForm} />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsVideoEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={editVideoMutation.isPending}>
                  {editVideoMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar alterações
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para prévia de vídeo */}
      <Dialog open={isVideoPreviewDialogOpen} onOpenChange={setIsVideoPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title || "Prévia de vídeo"}</DialogTitle>
          </DialogHeader>
          
          <div className="w-full aspect-video rounded-md overflow-hidden bg-black">
            {previewVideoUrl && (
              <EmbeddedVideoPlayer 
                url={previewVideoUrl}
              />
            )}
          </div>
          
          {selectedVideo?.description && (
            <p className="text-sm text-gray-600">{selectedVideo.description}</p>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsVideoPreviewDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}