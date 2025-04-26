import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, CheckCircle } from "lucide-react";
import { CompletenessChecker } from "@/pages/admin/academico/componentes/disciplinas/CompletenessChecker";
import { VideoManager } from "@/pages/admin/academico/componentes/disciplinas/VideoManager";
import { EbookManager } from "@/pages/admin/academico/componentes/disciplinas/EbookManager";
import { InteractiveEbookManager } from "@/pages/admin/academico/componentes/disciplinas/InteractiveEbookManager";
import { SimuladoManager } from "@/pages/admin/academico/componentes/disciplinas/SimuladoManager";
import { AvaliacaoFinalManager } from "@/pages/admin/academico/componentes/disciplinas/AvaliacaoFinalManager";

export default function DisciplinaContentPage() {
  const [activeTab, setActiveTab] = useState("videos");
  const params = useParams();
  const [, navigate] = useLocation();
  const disciplineId = params.id;

  // Consulta para buscar os detalhes da disciplina
  const { 
    data: discipline, 
    isLoading, 
    isError,
    error 
  } = useQuery({
    queryKey: [`/api/disciplines/${disciplineId}`],
    enabled: !!disciplineId,
  });

  // Função para verificar se a disciplina está completa
  const isDisciplineComplete = (discipline: any) => {
    if (!discipline) return false;
    
    const hasVideos = Boolean(
      discipline.videoAula1Url || 
      discipline.videoAula2Url || 
      discipline.videoAula3Url
    );
    
    const hasEbook = Boolean(discipline.apostilaPdfUrl);
    const hasInteractiveEbook = Boolean(discipline.ebookInterativoUrl);
    
    // Verificações simplificadas para simulado e avaliação
    // Na prática, você precisaria consultar as APIs correspondentes
    const hasSimulado = discipline.hasSimulado;
    const hasAvaliacaoFinal = discipline.hasAvaliacaoFinal;
    
    return hasVideos && hasEbook && hasInteractiveEbook && hasSimulado && hasAvaliacaoFinal;
  };

  // Navegar de volta para a lista de disciplinas
  const handleBackToList = () => {
    navigate("/admin/academico/disciplinas");
  };

  if (isError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            {error instanceof Error 
              ? `Ocorreu um erro ao carregar a disciplina: ${error.message}` 
              : "Ocorreu um erro ao carregar a disciplina."}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={handleBackToList}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para lista de disciplinas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Button variant="outline" onClick={handleBackToList}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : discipline && discipline.data ? (
        <>
          <div>
            <h1 className="text-3xl font-bold">{discipline.data.name}</h1>
            <p className="text-gray-500">
              Código: {discipline.data.code} | Carga horária: {discipline.data.workload}h
            </p>
          </div>

          <CompletenessChecker discipline={discipline.data} />

          <Tabs defaultValue="videos" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="videos">Vídeo-aulas</TabsTrigger>
              <TabsTrigger value="ebook">E-book</TabsTrigger>
              <TabsTrigger value="interactive">E-book Interativo</TabsTrigger>
              <TabsTrigger value="simulado">Simulado</TabsTrigger>
              <TabsTrigger value="avaliacao">Avaliação Final</TabsTrigger>
            </TabsList>
            <TabsContent value="videos" className="py-4">
              <VideoManager disciplineId={disciplineId} />
            </TabsContent>
            <TabsContent value="ebook" className="py-4">
              <EbookManager disciplineId={disciplineId} />
            </TabsContent>
            <TabsContent value="interactive" className="py-4">
              <InteractiveEbookManager disciplineId={disciplineId} />
            </TabsContent>
            <TabsContent value="simulado" className="py-4">
              <SimuladoManager disciplineId={disciplineId} />
            </TabsContent>
            <TabsContent value="avaliacao" className="py-4">
              <AvaliacaoFinalManager disciplineId={disciplineId} />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Disciplina não encontrada</AlertTitle>
          <AlertDescription>
            A disciplina solicitada não foi encontrada ou não está disponível.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}