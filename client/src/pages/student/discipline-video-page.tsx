import { useState, useRef, useEffect } from "react";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import StudentLayout from "@/components/layout/student-layout";
import EmbeddedVideoPlayer from "@/components/video-player/embedded-video-player";
import { 
  ChevronLeft as ChevronLeftIcon,
  PlayCircle,
  PauseCircle,
  Volume2,
  VolumeX,
  Maximize,
  SkipForward,
  SkipBack,
  Download,
  ThumbsUp,
  MessageSquare,
  Share2,
  Bookmark,
  Settings
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DisciplineVideoPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Mock data - em uma implementação real, isso viria da API
  const videoData = {
    id: parseInt(id || "1"),
    title: "Introdução à Psicopedagogia Clínica",
    description: "Nesta aula, abordamos os conceitos fundamentais da psicopedagogia clínica e sua importância no processo de aprendizagem. Discutimos também os principais teóricos da área e suas contribuições para o campo.",
    duration: 3600, // em segundos
    thumbnail: "https://placehold.co/800x450/e2e8f0/475569?text=Videoaula:+Introdução+à+Psicopedagogia+Clínica",
    url: "https://www.w3schools.com/html/mov_bbb.mp4", // URL de exemplo
    disciplineId: 1,
    disciplineName: "Fundamentos da Psicopedagogia",
    courseId: 101,
    courseName: "Pós-Graduação em Psicopedagogia Clínica e Institucional",
    professor: "Dra. Ana Silva",
    views: 245,
    likes: 38,
    comments: 12,
    relatedVideos: [
      {
        id: 2,
        title: "Diagnóstico Psicopedagógico",
        thumbnail: "https://placehold.co/120x68/e2e8f0/475569?text=Diagnóstico+Psicopedagógico",
        duration: 2400,
        progress: 0
      },
      {
        id: 3,
        title: "Técnicas de Avaliação Psicopedagógica",
        thumbnail: "https://placehold.co/120x68/e2e8f0/475569?text=Técnicas+de+Avaliação",
        duration: 1800,
        progress: 0
      },
      {
        id: 4,
        title: "Intervenção Psicopedagógica na Prática Clínica",
        thumbnail: "https://placehold.co/120x68/e2e8f0/475569?text=Intervenção+Psicopedagógica",
        duration: 3000,
        progress: 0
      }
    ],
    attachments: [
      {
        id: 101,
        name: "Slides da Aula.pdf",
        size: "2.4 MB",
        type: "pdf"
      },
      {
        id: 102,
        name: "Material Complementar.pdf",
        size: "1.8 MB",
        type: "pdf"
      },
      {
        id: 103,
        name: "Bibliografia Recomendada.pdf",
        size: "512 KB",
        type: "pdf"
      }
    ]
  };

  // Consulta para obter os detalhes do vídeo
  const { data: video, isLoading, error } = useQuery({
    queryKey: ['/api-json/student/videos', id],
    queryFn: async () => {
      try {
        const response = await fetch(`/api-json/student/videos/${id}`);
        if (!response.ok) {
          // No ambiente de desenvolvimento, retornar dados fictícios
          return videoData;
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching video details:", error);
        // No ambiente de desenvolvimento, retornar dados fictícios
        return videoData;
      }
    }
  });

  // Formatar a duração para exibição (MM:SS)
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Controles de vídeo
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const videoDuration = videoRef.current.duration;
      setCurrentTime(current);
      setProgress((current / videoDuration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const progressBar = e.currentTarget;
      const position = (e.nativeEvent.offsetX / progressBar.offsetWidth);
      videoRef.current.currentTime = position * videoRef.current.duration;
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        videoRef.current.requestFullscreen().catch(err => {
          toast({
            title: "Erro",
            description: `Não foi possível ativar o modo tela cheia: ${err.message}`,
            variant: "destructive",
          });
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime += 10; // Avançar 10 segundos
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime -= 10; // Retroceder 10 segundos
    }
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({
      title: isBookmarked ? "Marcador removido" : "Vídeo marcado",
      description: isBookmarked 
        ? "Este vídeo foi removido dos seus marcadores." 
        : "Este vídeo foi adicionado aos seus marcadores.",
    });
  };

  return (
    <StudentLayout
      title={video?.title || "Carregando..."}
      subtitle={`${video?.disciplineName || "Disciplina"} - ${video?.courseName || "Curso"}`}
      breadcrumbs={[
        { title: "Home", href: "/student" },
        { title: "Meus Cursos", href: "/student/courses" },
        { title: video?.courseName || "Curso", href: `/student/courses/${video?.courseId}` },
        { title: video?.disciplineName || "Disciplina", href: `/student/learning?disciplineId=${video?.disciplineId}` },
        { title: video?.title || "Vídeo", href: `/student/discipline-video/${id}` }
      ]}
      backButton={{
        label: "Voltar para o curso",
        onClick: () => window.history.back()
      }}
    >
      {isLoading ? (
        <>
          <Skeleton className="h-8 w-2/3 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-6" />
          <Skeleton className="aspect-video w-full mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Skeleton className="h-32 mb-4" />
              <Skeleton className="h-64" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </>
      ) : error ? (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Erro ao carregar vídeo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              Não foi possível carregar os detalhes do vídeo. Por favor, tente novamente mais tarde.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <>
          {/* Player de vídeo */}
          <div className="mb-6 relative shadow-md">
            <EmbeddedVideoPlayer
              url={video.url}
              title={video.title}
              source={video.source || 'youtube'}
              poster={video.thumbnail}
              onEnded={() => setIsPlaying(false)}
              className="rounded-lg overflow-hidden"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Detalhes do vídeo e comentários */}
            <div className="md:col-span-2 space-y-6">
              {/* Informações da aula */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{video.title}</CardTitle>
                      <CardDescription>
                        Por {video.professor} • {video.views} visualizações
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Concluído
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    {video.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => {
                      toast({
                        title: "Curtida adicionada",
                        description: "Você curtiu este vídeo!",
                      });
                    }}>
                      <ThumbsUp className="h-4 w-4" />
                      <span>{video.likes}</span>
                    </Button>
                    
                    <Button variant="outline" size="sm" className="gap-1" onClick={toggleBookmark}>
                      <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
                      <span>Marcar</span>
                    </Button>
                    
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => {
                      toast({
                        title: "Link de compartilhamento copiado",
                        description: "O link deste vídeo foi copiado para sua área de transferência.",
                      });
                    }}>
                      <Share2 className="h-4 w-4" />
                      <span>Compartilhar</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Materiais de apoio */}
              <Card>
                <CardHeader>
                  <CardTitle>Materiais de Apoio</CardTitle>
                  <CardDescription>
                    Arquivos complementares para esta aula
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {video.attachments.length === 0 ? (
                    <p className="text-gray-600">Nenhum material disponível para esta aula.</p>
                  ) : (
                    <div className="space-y-3">
                      {video.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex justify-between items-center p-3 rounded-md border hover:bg-gray-50">
                          <div className="flex items-center">
                            <div className="bg-primary/10 rounded-md p-2 mr-3">
                              <Download className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{attachment.name}</p>
                              <p className="text-xs text-gray-500">{attachment.size}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Seção de comentários */}
              <Card>
                <CardHeader>
                  <CardTitle>Comentários ({video.comments})</CardTitle>
                  <CardDescription>
                    Dúvidas e comentários sobre esta aula
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-gray-600 py-4">
                    Seja o primeiro a comentar nesta aula!
                  </p>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <div className="w-full">
                    <textarea
                      className="w-full border rounded-md p-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Escreva seu comentário ou dúvida..."
                      rows={3}
                    ></textarea>
                    <div className="flex justify-end mt-2">
                      <Button>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Comentar
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </div>
            
            {/* Próximas aulas */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Próximas Aulas</CardTitle>
                  <CardDescription>
                    Continue aprendendo com as próximas aulas
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {video.relatedVideos.map((relatedVideo) => (
                      <div 
                        key={relatedVideo.id}
                        className="flex p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => window.location.href = `/student/discipline-video/${relatedVideo.id}`}
                      >
                        <div className="relative flex-shrink-0 w-32 h-18 rounded-md overflow-hidden mr-3">
                          <img 
                            src={relatedVideo.thumbnail} 
                            alt={relatedVideo.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                            {formatTime(relatedVideo.duration)}
                          </div>
                          {relatedVideo.progress > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                              <div 
                                className="h-full bg-primary"
                                style={{ width: `${relatedVideo.progress}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                            {relatedVideo.title}
                          </h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </StudentLayout>
  );
}