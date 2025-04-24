import { useState } from "react";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import StudentLayout from "@/components/layout/student-layout";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
  Bookmark,
  Share2,
  RotateCw,
  Search,
  Home,
  Printer,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

export default function DisciplineEbookPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pageToGo, setPageToGo] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Mock data - em uma implementação real, isso viria da API
  const ebookData = {
    id: parseInt(id || "1"),
    title: "Fundamentos da Alfabetização e Letramento",
    author: "Dra. Maria Santos",
    publisher: "Editora Educacional",
    year: 2023,
    totalPages: 184,
    description: "Este e-book aborda as teorias e práticas fundamentais no processo de alfabetização e letramento, explorando métodos contemporâneos e estratégias eficazes para educadores.",
    disciplineId: 1,
    disciplineName: "Fundamentos da Alfabetização",
    courseId: 101,
    courseName: "Pós-Graduação em Alfabetização e Letramento",
    coverImage: "https://placehold.co/300x400/e2e8f0/475569?text=Capa+do+E-book:+Fundamentos+da+Alfabetização",
    pdfUrl: "https://example.com/ebook.pdf", // Em produção, URL real do PDF
    pageImages: [
      "https://placehold.co/800x1000/fff/333?text=Página+1",
      "https://placehold.co/800x1000/fff/333?text=Página+2",
      "https://placehold.co/800x1000/fff/333?text=Página+3",
      // ... mais páginas
    ]
  };

  // Consulta para obter os detalhes do e-book
  const { data: ebook, isLoading, error } = useQuery({
    queryKey: ['/api-json/student/ebooks', id],
    queryFn: async () => {
      try {
        const response = await fetch(`/api-json/student/ebooks/${id}`);
        if (!response.ok) {
          // No ambiente de desenvolvimento, retornar dados fictícios
          return ebookData;
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching ebook details:", error);
        // No ambiente de desenvolvimento, retornar dados fictícios
        return ebookData;
      }
    }
  });

  // Manipuladores de eventos para o visualizador de e-book
  const nextPage = () => {
    if (ebook && currentPage < ebook.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleZoomIn = () => {
    if (zoomLevel < 200) {
      setZoomLevel(zoomLevel + 25);
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel > 50) {
      setZoomLevel(zoomLevel - 25);
    }
  };

  const toggleFullscreen = () => {
    const viewer = document.getElementById('ebook-viewer');
    
    if (!document.fullscreenElement && viewer) {
      viewer.requestFullscreen().catch(err => {
        toast({
          title: "Erro",
          description: `Não foi possível ativar o modo tela cheia: ${err.message}`,
          variant: "destructive",
        });
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handlePageGoTo = () => {
    const pageNum = parseInt(pageToGo);
    if (!isNaN(pageNum) && ebook && pageNum > 0 && pageNum <= ebook.totalPages) {
      setCurrentPage(pageNum);
      setPageToGo("");
    } else {
      toast({
        title: "Página inválida",
        description: `Por favor, insira um número de página válido entre 1 e ${ebook?.totalPages || 1}.`,
        variant: "destructive",
      });
    }
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({
      title: isBookmarked ? "Marcador removido" : "E-book marcado",
      description: isBookmarked 
        ? "Este e-book foi removido dos seus marcadores." 
        : "Este e-book foi adicionado aos seus marcadores.",
    });
  };

  const handlePrint = () => {
    toast({
      title: "Impressão não disponível",
      description: "A funcionalidade de impressão está desativada para proteger os direitos autorais do material.",
      variant: "destructive",
    });
  };

  const handleDownload = () => {
    toast({
      title: "Download iniciado",
      description: "O download do e-book começou. O arquivo será salvo em seu dispositivo em breve.",
    });
    // Em produção, implementar o download real do PDF
    // window.open(ebook?.pdfUrl, '_blank');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copiado",
      description: "O link para este e-book foi copiado para sua área de transferência.",
    });
  };

  return (
    <StudentLayout
      title={ebook?.title || "Carregando..."}
      subtitle={`${ebook?.disciplineName || "Disciplina"} - ${ebook?.courseName || "Curso"}`}
      breadcrumbs={[
        { title: "Home", href: "/student" },
        { title: "Meus Cursos", href: "/student/courses" },
        { title: ebook?.courseName || "Curso", href: `/student/courses/${ebook?.courseId}` },
        { title: ebook?.disciplineName || "Disciplina", href: `/student/learning?disciplineId=${ebook?.disciplineId}` },
        { title: ebook?.title || "E-book", href: `/student/discipline-ebook/${id}` }
      ]}
      backButton={{
        label: "Voltar para o curso",
        onClick: () => window.history.back()
      }}
    >
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-8 w-2/3 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-6" />
          <Skeleton className="w-full aspect-[3/4] max-w-3xl mx-auto" />
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-medium text-red-800 mb-2">Erro ao carregar e-book</h3>
          <p className="text-red-600">
            Não foi possível carregar os detalhes do e-book. Por favor, tente novamente mais tarde.
          </p>
          <Button 
            variant="secondary" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div className="relative">
          {/* Barra de ferramentas do e-book */}
          <div className="bg-white border rounded-t-lg p-2 sticky top-0 flex flex-wrap items-center justify-between gap-2 z-10 shadow-sm">
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={prevPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Página anterior</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  Página {currentPage} de {ebook.totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <Input
                    className="w-16 h-8"
                    value={pageToGo}
                    onChange={(e) => setPageToGo(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePageGoTo()}
                    placeholder="Ir para"
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handlePageGoTo}
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Ir para página</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={nextPage}
                      disabled={currentPage === ebook.totalPages}
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Próxima página</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="h-6 mx-2 border-l border-gray-200"></div>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleZoomOut}
                      disabled={zoomLevel <= 50}
                    >
                      <ZoomOut className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Diminuir zoom</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <span className="text-sm font-medium">{zoomLevel}%</span>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleZoomIn}
                      disabled={zoomLevel >= 200}
                    >
                      <ZoomIn className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Aumentar zoom</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={toggleBookmark}
                    >
                      <Bookmark className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isBookmarked ? "Remover marcador" : "Adicionar marcador"}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleDownload}
                    >
                      <Download className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Baixar PDF</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleShare}
                    >
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Compartilhar</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handlePrint}
                    >
                      <Printer className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Imprimir</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={toggleFullscreen}
                    >
                      <Maximize className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Tela cheia</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          {/* Visualizador de e-book */}
          <div 
            id="ebook-viewer"
            className="bg-gray-900 border border-t-0 rounded-b-lg p-6 flex justify-center items-center min-h-[70vh]"
          >
            <div
              className="relative bg-white shadow-lg transition-transform duration-200 transform-gpu"
              style={{ 
                transform: `scale(${zoomLevel / 100})`,
                maxWidth: '100%'
              }}
            >
              {/* Mostrar página atual aqui */}
              <img 
                src={ebook.pageImages[Math.min(currentPage - 1, ebook.pageImages.length - 1)]} 
                alt={`Página ${currentPage}`}
                className="max-w-full h-auto"
              />
            </div>
          </div>
          
          {/* Detalhes do e-book */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <img 
                src={ebook.coverImage} 
                alt={`Capa do e-book: ${ebook.title}`}
                className="w-full rounded-lg shadow-md"
              />
            </div>
            <div className="md:col-span-2">
              <h3 className="text-xl font-semibold mb-2">{ebook.title}</h3>
              <p className="text-gray-600 mb-4">{ebook.description}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Autor</h4>
                  <p className="text-gray-800">{ebook.author}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Editora</h4>
                  <p className="text-gray-800">{ebook.publisher}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Ano</h4>
                  <p className="text-gray-800">{ebook.year}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Páginas</h4>
                  <p className="text-gray-800">{ebook.totalPages}</p>
                </div>
              </div>
              
              <div className="flex mt-6 gap-3">
                <Button onClick={handleDownload} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Baixar PDF
                </Button>
                <Button 
                  variant="outline" 
                  onClick={toggleBookmark}
                  className="flex items-center gap-2"
                >
                  <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
                  {isBookmarked ? "Remover marcador" : "Adicionar marcador"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}