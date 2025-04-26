import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  FileVideo,
  Upload,
  LinkIcon,
  Loader2,
  ExternalLink,
  Trash2,
  Edit,
  Play,
  ArrowUp,
  ArrowDown,
  Plus,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Video, VideoSource } from "@/types/pedagogico";
import { Badge } from "@/components/ui/badge";

const videoFormSchema = z.object({
  source: z.enum(["youtube", "vimeo", "onedrive", "upload", "other"]),
  url: z.string().url({ message: "Insira uma URL válida" }),
  title: z.string().min(3, { message: "O título deve ter pelo menos 3 caracteres" }),
  description: z.string().optional(),
  durationSeconds: z.number().positive().optional(),
});

type VideoFormValues = z.infer<typeof videoFormSchema>;

export function VideoManager({ disciplineId }: { disciplineId: number | string }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  // Função para construir a URL da API de vídeos para uma disciplina
  const buildDisciplineVideosApiUrl = (disciplineId: number | string) => {
    return `/api/disciplines/${disciplineId}/videos`;
  };

  // Busca os dados de vídeos da disciplina
  const {
    data: videos = [],
    isLoading: isVideosLoading,
    refetch: refetchVideos,
  } = useQuery<Video[]>({
    queryKey: [buildDisciplineVideosApiUrl(disciplineId)],
    enabled: !!disciplineId,
  });

  // Mutation para adicionar/atualizar vídeo
  const videoMutation = useMutation({
    mutationFn: (data: VideoFormValues) => {
      // Se já existe um vídeo selecionado, faz update, senão cria
      const method = selectedVideo && selectedVideo.id ? "PUT" : "POST";
      const url = selectedVideo && selectedVideo.id
        ? `${buildDisciplineVideosApiUrl(disciplineId)}/${selectedVideo.id}`
        : buildDisciplineVideosApiUrl(disciplineId);
      return apiRequest(method, url, data);
    },
    onSuccess: () => {
      const isUpdate = !!(selectedVideo && selectedVideo.id);
      toast({
        title: isUpdate ? "Vídeo atualizado com sucesso" : "Vídeo adicionado com sucesso",
        description: isUpdate ? "As alterações foram salvas." : "O vídeo foi vinculado à disciplina.",
        variant: "default",
      });
      setIsDialogOpen(false);
      setIsEditDialogOpen(false);
      form.reset();
      // Recarrega os dados dos vídeos
      queryClient.invalidateQueries({ queryKey: [buildDisciplineVideosApiUrl(disciplineId)] });
      refetchVideos();
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar vídeo",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir vídeo
  const deleteVideoMutation = useMutation({
    mutationFn: (videoId: number | string) => {
      return apiRequest("DELETE", `${buildDisciplineVideosApiUrl(disciplineId)}/${videoId}`);
    },
    onSuccess: () => {
      toast({
        title: "Vídeo excluído com sucesso",
        description: "O vídeo foi removido da disciplina.",
        variant: "default",
      });
      // Recarrega os dados dos vídeos
      queryClient.invalidateQueries({ queryKey: [buildDisciplineVideosApiUrl(disciplineId)] });
      refetchVideos();
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir vídeo",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Formulário para adição e edição de vídeo
  const form = useForm<VideoFormValues>({
    resolver: zodResolver(videoFormSchema),
    defaultValues: {
      source: "youtube",
      url: "",
      title: "",
      description: "",
    },
  });

  // Para edição, atualiza o formulário com os dados do vídeo selecionado
  const handleEditVideo = (videoData: Video | Record<string, any>) => {
    setSelectedVideo(videoData as Video);
    form.reset({
      source: videoData?.source as VideoSource || "youtube",
      url: videoData?.url || "",
      title: videoData?.title || "",
      description: videoData?.description || "",
      durationSeconds: videoData?.durationSeconds,
    });
    setIsEditDialogOpen(true);
  };

  const onSubmit = (data: VideoFormValues) => {
    videoMutation.mutate(data);
  };

  const handleDeleteVideo = (videoId: number | string) => {
    if (confirm("Tem certeza que deseja excluir este vídeo?")) {
      deleteVideoMutation.mutate(videoId);
    }
  };

  // Funções para reordenar vídeos
  const handleMoveUp = (index: number) => {
    if (index > 0) {
      // Lógica para mover para cima
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "A reordenação de vídeos será implementada em breve.",
      });
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < videos.length - 1) {
      // Lógica para mover para baixo
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "A reordenação de vídeos será implementada em breve.",
      });
    }
  };

  // Função para extrair o ID do vídeo do YouTube da URL
  const getYoutubeVideoId = (url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : "";
  };

  // Função para exibir o tipo de vídeo
  const renderVideoSourceBadge = (source: VideoSource) => {
    const badges: Record<VideoSource, { label: string, className: string }> = {
      youtube: { label: "YouTube", className: "bg-red-500" },
      vimeo: { label: "Vimeo", className: "bg-blue-400" },
      onedrive: { label: "OneDrive", className: "bg-blue-600" },
      upload: { label: "Upload", className: "bg-green-500" },
      other: { label: "Link Externo", className: "bg-gray-500" },
    };

    const badge = badges[source] || badges.other;

    return (
      <Badge className={`${badge.className} text-white`}>
        {badge.label}
      </Badge>
    );
  };

  const renderVideoList = () => {
    if (isVideosLoading) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      );
    }

    if (videos.length === 0) {
      return (
        <div className="text-center py-8">
          <FileVideo className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">Nenhum vídeo adicionado</h3>
          <p className="text-gray-500 mt-1 mb-4">
            Adicione vídeo-aulas para esta disciplina
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Vídeo
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button 
            onClick={() => setIsDialogOpen(true)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Vídeo
          </Button>
        </div>
        
        <div className="space-y-3">
          {videos.map((video, index) => (
            <div key={video.id || index} className="border rounded-md p-4 bg-gray-50">
              <div className="flex justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{video.title}</h4>
                    {renderVideoSourceBadge(video.source)}
                  </div>
                  {video.description && (
                    <p className="text-sm text-gray-600 mb-2">{video.description}</p>
                  )}
                  <div className="flex items-center gap-3">
                    <a 
                      href={video.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Ver vídeo
                    </a>
                    {video.durationSeconds && (
                      <span className="text-xs text-gray-500">
                        {Math.floor(video.durationSeconds / 60)}:{(video.durationSeconds % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === videos.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditVideo(video)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteVideo(video.id || 0)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {video.source === "youtube" && (
                <div className="mt-3 aspect-video">
                  <iframe
                    className="w-full h-full rounded"
                    src={`https://www.youtube.com/embed/${getYoutubeVideoId(video.url)}`}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Vídeo-aulas</CardTitle>
        <CardDescription>
          Gerencie os vídeos da disciplina
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {renderVideoList()}
      </CardContent>
      
      {/* Diálogo para adicionar/editar vídeo */}
      <Dialog 
        open={isDialogOpen || isEditDialogOpen} 
        onOpenChange={(open) => {
          if (isDialogOpen) setIsDialogOpen(open);
          if (isEditDialogOpen) setIsEditDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Editar Vídeo" : "Adicionar Vídeo"}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen 
                ? "Edite as informações do vídeo atual."
                : "Adicione um vídeo para esta disciplina."
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do Vídeo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Introdução ao tema" {...field} />
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
                      <Input 
                        placeholder="Breve descrição do conteúdo" 
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
                name="source"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Origem do Vídeo</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="youtube" id="source-youtube" />
                          <Label htmlFor="source-youtube" className="flex items-center">
                            YouTube
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="vimeo" id="source-vimeo" />
                          <Label htmlFor="source-vimeo" className="flex items-center">
                            Vimeo
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="onedrive" id="source-onedrive" />
                          <Label htmlFor="source-onedrive" className="flex items-center">
                            OneDrive
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="other" id="source-other" />
                          <Label htmlFor="source-other" className="flex items-center">
                            Outro (link externo)
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do Vídeo</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://www.youtube.com/watch?v=..." 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="durationSeconds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (em segundos)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="Ex: 120 (para 2 minutos)" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          field.onChange(isNaN(value) ? undefined : value);
                        }}
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
                  onClick={() => {
                    setIsDialogOpen(false);
                    setIsEditDialogOpen(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={videoMutation.isPending}
                >
                  {videoMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditDialogOpen ? "Salvar alterações" : "Adicionar Vídeo"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}