import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { Discipline, videoSourceEnum } from "@shared/schema";
import { queryClient, apiRequest, fetchDisciplineVideos } from "@/lib/queryClient";
import { buildDisciplineVideosApiUrl } from "@/lib/api-config";
import { detectVideoSource, processVideoUrl } from "@/lib/video-utils";
import VideoThumbnail from "@/components/video-player/video-thumbnail";
import EmbeddedVideoPlayer from "@/components/video-player/embedded-video-player";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import VideoFormFields from "@/components/disciplinas/video-form-fields";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Video as VideoIcon, 
  Plus as PlusIcon, 
  Play as PlayIcon, 
  Edit as EditIcon,
  Trash as TrashIcon,
  Youtube as YoutubeIcon,
  Video as VimeoIcon,
  AlertCircle as AlertCircleIcon,
  Loader2
} from "lucide-react";

interface VideoManagerProps {
  disciplineId: number;
  discipline: Discipline;
}

// Schema para validação dos formulários
const videoFormSchema = z.object({
  title: z.string().min(3, { message: "Título deve ter pelo menos 3 caracteres" }),
  description: z.string().optional(),
  videoSource: z.enum(["youtube", "onedrive", "google_drive", "vimeo", "upload"]),
  url: z.string().url({ message: "URL inválida" }),
  duration: z.string().regex(/^\d+:\d+$/, { message: "Duração deve estar no formato mm:ss" }),
  startTime: z.string().regex(/^\d+:\d+$/, { message: "Tempo de início deve estar no formato mm:ss" }).optional(),
});

type VideoFormValues = z.infer<typeof videoFormSchema>;

export function VideoManager({ disciplineId, discipline }: VideoManagerProps) {
  const { toast } = useToast();
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [isVideoEditDialogOpen, setIsVideoEditDialogOpen] = useState(false);
  const [isVideoPreviewDialogOpen, setIsVideoPreviewDialogOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState("");
  const [previewVideoSource, setPreviewVideoSource] = useState<"youtube" | "vimeo" | "other">("youtube");

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

  // Mutation para adicionar vídeo
  const addVideoMutation = useMutation({
    mutationFn: async (data: VideoFormValues) => {
      return apiRequest('POST', buildDisciplineVideosApiUrl(disciplineId), data);
    },
    onSuccess: () => {
      toast({
        title: "Vídeo adicionado com sucesso",
        description: "O vídeo foi adicionado à disciplina.",
        variant: "default",
      });
      setIsVideoDialogOpen(false);
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
    mutationFn: async (data: VideoFormValues & { id: number }) => {
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
                    videoSource={video.videoSource} 
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
                videoSource={previewVideoSource} 
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