import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { 
  LayoutDashboard,
  BookOpenText, 
  GraduationCap, 
  FileQuestion, 
  BriefcaseBusiness, 
  Handshake, 
  Banknote, 
  Calendar, 
  MessagesSquare, 
  User,
  BookMarked
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ChartIcon,
  SchoolIcon,
  MenuBookIcon,
  EventNoteIcon,
  DescriptionIcon,
  PaymentsIcon,
  HelpOutlineIcon,
  ClockIcon,
  ChevronLeftIcon,
  PlayCircleIcon,
  YoutubeIcon,
  OneDriveIcon,
  GoogleDriveIcon,
  VimeoIcon,
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Interface para detalhes da disciplina
interface DisciplineDetail {
  id: number;
  name: string;
  code: string;
  description: string;
  workload: number;
  progress: number;
  videoAula1Url?: string;
  videoAula1Source?: string;
  videoAula2Url?: string;
  videoAula2Source?: string;
  videoAula3Url?: string;
  videoAula3Source?: string;
  videoAula4Url?: string;
  videoAula4Source?: string;
  videoAula5Url?: string;
  videoAula5Source?: string;
  videoAula6Url?: string;
  videoAula6Source?: string;
  videoAula7Url?: string;
  videoAula7Source?: string;
  videoAula8Url?: string;
  videoAula8Source?: string;
  videoAula9Url?: string;
  videoAula9Source?: string;
  videoAula10Url?: string;
  videoAula10Source?: string;
  apostilaPdfUrl?: string;
  ebookInterativoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function DisciplineVideoPage() {
  const { id, videoNumber } = useParams<{ id: string; videoNumber: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: discipline, isLoading } = useQuery<DisciplineDetail>({
    queryKey: [`/api/student/disciplines/${id}`],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Definir itens da sidebar diretamente (sem depender do componente obsoleto)
  const [location] = useLocation();
  const sidebarItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={18} />, href: "/student/dashboard", active: location === "/student/dashboard" },
    { name: "Meus Cursos", icon: <BookOpenText size={18} />, href: "/student/courses", active: location === "/student/courses" || location.startsWith("/student/courses/") },
    { name: "Biblioteca", icon: <BookMarked size={18} />, href: "/student/library", active: location === "/student/library" },
    { name: "Credencial", icon: <GraduationCap size={18} />, href: "/student/credencial", active: location === "/student/credencial" },
    { name: "Avaliações", icon: <FileQuestion size={18} />, href: "/student/assessments", active: location === "/student/assessments" },
    { name: "Estágios", icon: <BriefcaseBusiness size={18} />, href: "/student/internships", active: location === "/student/internships" },
    { name: "Contratos", icon: <Handshake size={18} />, href: "/student/contracts", active: location === "/student/contracts" },
    { name: "Financeiro", icon: <Banknote size={18} />, href: "/student/financial", active: location === "/student/financial" },
    { name: "Calendário", icon: <Calendar size={18} />, href: "/student/calendar", active: location === "/student/calendar" },
    { name: "Mensagens", icon: <MessagesSquare size={18} />, href: "/student/messages", active: location === "/student/messages" },
    { name: "Meu Perfil", icon: <User size={18} />, href: "/student/profile", active: location === "/student/profile" },
  ];

  // Determinar o vídeo a ser exibido baseado no parâmetro videoNumber
  const videoNum = parseInt(videoNumber || "1");
  
  // Função para obter URL e fonte com base no número do vídeo
  const getVideoData = (num: number) => {
    switch(num) {
      case 1: return { url: discipline?.videoAula1Url, source: discipline?.videoAula1Source };
      case 2: return { url: discipline?.videoAula2Url, source: discipline?.videoAula2Source };
      case 3: return { url: discipline?.videoAula3Url, source: discipline?.videoAula3Source };
      case 4: return { url: discipline?.videoAula4Url, source: discipline?.videoAula4Source };
      case 5: return { url: discipline?.videoAula5Url, source: discipline?.videoAula5Source };
      case 6: return { url: discipline?.videoAula6Url, source: discipline?.videoAula6Source };
      case 7: return { url: discipline?.videoAula7Url, source: discipline?.videoAula7Source };
      case 8: return { url: discipline?.videoAula8Url, source: discipline?.videoAula8Source };
      case 9: return { url: discipline?.videoAula9Url, source: discipline?.videoAula9Source };
      case 10: return { url: discipline?.videoAula10Url, source: discipline?.videoAula10Source };
      default: return { url: discipline?.videoAula1Url, source: discipline?.videoAula1Source };
    }
  };
  
  const videoData = getVideoData(videoNum);
  const videoUrl = videoData.url;
  const videoSource = videoData.source;
  const videoTitle = `Vídeo-aula ${videoNum}`;

  // Função para renderizar o player de vídeo de acordo com a fonte
  const renderVideoPlayer = () => {
    if (!videoUrl) {
      return (
        <div className="bg-gray-100 p-6 rounded-md flex items-center justify-center flex-col h-96">
          <PlayCircleIcon className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-500">Vídeo não disponível</p>
        </div>
      );
    }

    // Verificar a origem do vídeo e renderizar o player apropriado
    switch (videoSource) {
      case "youtube":
        // Extrair o ID do vídeo do YouTube
        const youtubeId = videoUrl.includes("youtu.be") 
          ? videoUrl.split("/").pop() 
          : videoUrl.includes("v=") 
            ? new URLSearchParams(videoUrl.split("?")[1]).get("v") 
            : videoUrl;
        
        return (
          <div className="aspect-video">
            <iframe
              className="w-full h-full rounded-md"
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title={videoTitle}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        );
      case "vimeo":
        // Extrair o ID do vídeo do Vimeo
        const vimeoId = videoUrl.split("/").pop();
        
        return (
          <div className="aspect-video">
            <iframe 
              className="w-full h-full rounded-md"
              src={`https://player.vimeo.com/video/${vimeoId}`}
              title={videoTitle}
              frameBorder="0" 
              allow="autoplay; fullscreen; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        );
      case "onedrive":
      case "google_drive":
      default:
        // Para outros serviços, apenas fornecer um link
        return (
          <div className="bg-gray-100 p-6 rounded-md flex items-center justify-center flex-col h-96">
            {videoSource === "onedrive" && <OneDriveIcon className="h-16 w-16 text-blue-500 mb-4" />}
            {videoSource === "google_drive" && <GoogleDriveIcon className="h-16 w-16 text-blue-500 mb-4" />}
            {!videoSource && <PlayCircleIcon className="h-16 w-16 text-gray-400 mb-4" />}
            <p className="text-gray-700 mb-4">Este vídeo está hospedado externamente</p>
            <Button variant="secondary" onClick={() => window.open(videoUrl, "_blank")}>
              Assistir no site original
            </Button>
          </div>
        );
    }
  };

  // Função para determinar o ícone da fonte de vídeo
  const getVideoSourceIcon = () => {
    switch (videoSource) {
      case "youtube":
        return <YoutubeIcon className="h-4 w-4 mr-1 text-red-600" />;
      case "vimeo":
        return <VimeoIcon className="h-4 w-4 mr-1 text-blue-600" />;
      case "onedrive":
        return <OneDriveIcon className="h-4 w-4 mr-1 text-blue-500" />;
      case "google_drive":
        return <GoogleDriveIcon className="h-4 w-4 mr-1 text-green-500" />;
      default:
        return <PlayCircleIcon className="h-4 w-4 mr-1" />;
    }
  };

  // Função para navegar entre os conteúdos
  const goToNextContent = () => {
    // Verificar se há próximo vídeo disponível
    const nextVideoNum = videoNum + 1;
    const nextVideoData = getVideoData(nextVideoNum);
    
    if (nextVideoNum <= 10 && nextVideoData.url) {
      // Se houver próximo vídeo, navegar para ele
      setLocation(`/student/discipline/${id}/video/${nextVideoNum}`);
    } else {
      // Caso contrário, ir para a apostila em PDF
      setLocation(`/student/discipline/${id}/apostila`);
    }
  };

  // Função para marcar o vídeo como assistido (seria implementado com uma chamada à API)
  const markAsWatched = () => {
    // Simulação: navegar para o próximo conteúdo automaticamente
    goToNextContent();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        items={sidebarItems}
        user={user}
        portalType="student"
        portalColor="#12B76A"
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 py-20 md:py-6 md:px-8">
          {/* Back button */}
          <Button
            variant="ghost"
            className="mb-4 text-gray-600 hover:text-gray-900"
            onClick={() => window.history.back()}
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Voltar para o curso
          </Button>

          {isLoading ? (
            <>
              <Skeleton className="h-8 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/3 mb-6" />
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="aspect-video w-full" />
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Video header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {videoTitle} - {discipline?.name}
                </h1>
                <div className="flex items-center text-gray-600">
                  {getVideoSourceIcon()}
                  <span>Fonte: {videoSource === "google_drive" ? "Google Drive" : videoSource === "onedrive" ? "OneDrive" : videoSource || "Desconhecida"}</span>
                </div>
              </div>

              {/* Video Player */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  {renderVideoPlayer()}
                </CardContent>
              </Card>

              {/* Video details and navigation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Sobre esta vídeo-aula</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">
                      {videoNum === 1 
                        ? "Esta é a primeira vídeo-aula da disciplina. Assista com atenção para compreender os conceitos iniciais."
                        : `Esta é a vídeo-aula ${videoNum} da disciplina. Continue assistindo para aprofundar seus conhecimentos.`}
                    </p>
                    <Progress value={discipline?.progress || 0} className="h-2 mb-1" />
                    <p className="text-sm text-gray-600">
                      Progresso na disciplina: {discipline?.progress || 0}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Navegação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {videoNum > 1 && (
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => setLocation(`/student/discipline/${id}/video/${videoNum - 1}`)}
                        >
                          <PlayCircleIcon className="h-4 w-4 mr-2" />
                          Voltar para Vídeo-aula {videoNum - 1}
                        </Button>
                      )}
                      
                      {/* Avançar para próximo vídeo se disponível */}
                      {getVideoData(videoNum + 1).url && (
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => setLocation(`/student/discipline/${id}/video/${videoNum + 1}`)}
                        >
                          <PlayCircleIcon className="h-4 w-4 mr-2" />
                          Avançar para Vídeo-aula {videoNum + 1}
                        </Button>
                      )}
                      
                      <Button 
                        className="w-full justify-start" 
                        onClick={markAsWatched}
                      >
                        <PlayCircleIcon className="h-4 w-4 mr-2" />
                        Marcar como assistido
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Related lessons */}
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Conteúdos relacionados</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {/* Renderizar botões para todos os vídeos disponíveis */}
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
                  const data = getVideoData(num);
                  // Só mostrar botão se o vídeo existir
                  if (data.url) {
                    return (
                      <Button
                        key={`video-${num}`}
                        variant={videoNum === num ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => setLocation(`/student/discipline/${id}/video/${num}`)}
                      >
                        <PlayCircleIcon className="h-4 w-4 mr-2" />
                        Vídeo-aula {num}
                      </Button>
                    );
                  }
                  return null;
                })}
                
                {/* Outros tipos de conteúdo */}
                {discipline?.apostilaPdfUrl && (
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => setLocation(`/student/discipline/${id}/apostila`)}
                  >
                    <DescriptionIcon className="h-4 w-4 mr-2" />
                    Apostila em PDF
                  </Button>
                )}
                
                {discipline?.ebookInterativoUrl && (
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => setLocation(`/student/discipline/${id}/ebook`)}
                  >
                    <MenuBookIcon className="h-4 w-4 mr-2" />
                    E-book Interativo
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}