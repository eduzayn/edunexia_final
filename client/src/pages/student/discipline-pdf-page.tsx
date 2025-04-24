import { useState, useRef } from "react";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import StudentLayout from "@/components/layout/student-layout";
import {
  ChevronLeft as ChevronLeftIcon,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Printer,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Search,
  Home,
  Share2,
  Bookmark
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

export default function DisciplinePdfPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [pageToGo, setPageToGo] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Mock data - em uma implementação real, isso viria da API
  const pdfData = {
    id: parseInt(id || "1"),
    title: "Material Complementar de Psicopedagogia",
    description: "Este material apresenta técnicas e métodos para avaliação psicopedagógica em casos de dificuldades de aprendizagem.",
    author: "Prof. Dr. Carlos Mendes",
    totalPages: 24,
    currentPage: 1,
    disciplineId: 1,
    disciplineName: "Fundamentos da Psicopedagogia",
    courseId: 101,
    courseName: "Pós-Graduação em Psicopedagogia Clínica e Institucional",
    pdfUrl: "https://example.com/pdf/material.pdf", // Em produção, URL real do PDF
    // Array de URLs simulando as páginas do PDF
    pageImages: Array.from({ length: 24 }, (_, i) => 
      `https://placehold.co/800x1100/fff/333?text=Página+${i + 1}+do+PDF`
    ),
    createdAt: "2024-10-15"
  };

  // Consulta para obter os detalhes do PDF
  const { data: pdf, isLoading, error } = useQuery({
    queryKey: ['/api-json/student/pdfs', id],
    queryFn: async () => {
      try {
        const response = await fetch(`/api-json/student/pdfs/${id}`);
        if (!response.ok) {
          // No ambiente de desenvolvimento, retornar dados fictícios
          return pdfData;
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching PDF details:", error);
        // No ambiente de desenvolvimento, retornar dados fictícios
        return pdfData;
      }
    }
  });

  // Manipuladores de eventos para o visualizador de PDF
  const nextPage = () => {
    if (pdf && currentPage < pdf.totalPages) {
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

  const handleRotate = () => {
    setRotation((rotation + 90) % 360);
  };

  const toggleFullscreen = () => {
    if (pdfContainerRef.current) {
      if (!document.fullscreenElement) {
        pdfContainerRef.current.requestFullscreen().catch(err => {
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

  const handlePageGoTo = () => {
    const pageNum = parseInt(pageToGo);
    if (!isNaN(pageNum) && pdf && pageNum > 0 && pageNum <= pdf.totalPages) {
      setCurrentPage(pageNum);
      setPageToGo("");
    } else {
      toast({
        title: "Página inválida",
        description: `Por favor, insira um número de página válido entre 1 e ${pdf?.totalPages || 1}.`,
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    toast({
      title: "Enviando para impressão",
      description: "Documento sendo enviado para impressão. Verifique sua impressora.",
    });
    // Implementação real: window.print()
  };

  const handleDownload = () => {
    toast({
      title: "Download iniciado",
      description: "O download do arquivo PDF começou. O arquivo será salvo em seu dispositivo em breve.",
    });
    // Implementação real: window.open(pdf?.pdfUrl, '_blank')
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({
      title: isBookmarked ? "Marcador removido" : "PDF marcado",
      description: isBookmarked 
        ? "Este PDF foi removido dos seus marcadores." 
        : "Este PDF foi adicionado aos seus marcadores.",
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copiado",
      description: "O link para este PDF foi copiado para sua área de transferência.",
    });
  };

  return (
    <StudentLayout
      title={pdf?.title || "Carregando..."}
      subtitle={`${pdf?.disciplineName || "Disciplina"} - ${pdf?.courseName || "Curso"}`}
      breadcrumbs={[
        { title: "Home", href: "/student" },
        { title: "Meus Cursos", href: "/student/courses" },
        { title: pdf?.courseName || "Curso", href: `/student/courses/${pdf?.courseId}` },
        { title: pdf?.disciplineName || "Disciplina", href: `/student/learning?disciplineId=${pdf?.disciplineId}` },
        { title: pdf?.title || "PDF", href: `/student/discipline-pdf/${id}` }
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
          <h3 className="text-lg font-medium text-red-800 mb-2">Erro ao carregar PDF</h3>
          <p className="text-red-600">
            Não foi possível carregar o PDF. Por favor, tente novamente mais tarde.
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
        <div className="space-y-6">
          {/* Barra de ferramentas do PDF */}
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
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Página anterior</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  Página {currentPage} de {pdf.totalPages}
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
                      disabled={currentPage === pdf.totalPages}
                    >
                      <ChevronRight className="h-5 w-5" />
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
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleRotate}
                    >
                      <RotateCw className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Girar página</TooltipContent>
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
          
          {/* Visualizador de PDF */}
          <div 
            ref={pdfContainerRef}
            className="bg-gray-900 border border-t-0 rounded-b-lg p-6 flex justify-center items-center min-h-[70vh] overflow-auto"
          >
            <div
              className="relative transition-transform duration-200 transform-gpu"
              style={{ 
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
              }}
            >
              {/* Mostrar página atual do PDF aqui */}
              <img 
                src={pdf.pageImages[currentPage - 1]} 
                alt={`Página ${currentPage} do PDF`}
                className="max-w-full h-auto shadow-xl bg-white"
              />
            </div>
          </div>
          
          {/* Informações do documento */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-xl font-semibold mb-4">{pdf.title}</h3>
            <div className="text-gray-600 mb-4">{pdf.description}</div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-500">Autor</h4>
                <p>{pdf.author}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-500">Disciplina</h4>
                <p>{pdf.disciplineName}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-500">Data de criação</h4>
                <p>{new Date(pdf.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-500">Páginas</h4>
                <p>{pdf.totalPages}</p>
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
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
      )}
    </StudentLayout>
  );
}