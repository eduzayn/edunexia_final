import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ExtendedUser } from "@/types/user";
import { Sidebar } from "@/components/layout/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { buildApiUrl } from "@/lib/api-config";
import { fetchDiscipline } from "@/lib/queryClient";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { BookIcon, DashboardIcon, SchoolIcon, ArrowLeftIcon, AlertCircleIcon } from "@/components/ui/icons";

// Componentes do módulo pedagógico
import { VideoManager } from "@/components/disciplinas/VideoManager";
import { EbookManager } from "@/components/disciplinas/EbookManager";
import { InteractiveEbookManager } from "@/components/disciplinas/InteractiveEbookManager";
import { SimuladoManager } from "@/components/disciplinas/SimuladoManager";
import { AvaliacaoFinalManager } from "@/components/disciplinas/AvaliacaoFinalManager";
import { CompletenessChecker } from "@/components/disciplinas/CompletenessChecker";

export default function DisciplinaContentPage() {
  const [, navigate] = useLocation();
  const { id } = useParams();
  const disciplineId = parseInt(id as string);
  const { user } = useAuth();
  
  // Corrigindo o problema de tipagem do usuário
  const typedUser = user ? {
    ...user,
    portalType: user.portalType || 'admin',
    role: (user as any).role || (user.portalType === 'admin' ? 'admin' : 'student')
  } as ExtendedUser : null;
  
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("conteudo");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sidebar items for admin portal
  const sidebarItems = [
    { name: "Dashboard", icon: <DashboardIcon />, href: "/admin/dashboard" },
    { name: "Disciplinas", icon: <BookIcon />, href: "/admin/academico/disciplines", active: true },
    { name: "Cursos", icon: <SchoolIcon />, href: "/admin/academico/courses" },
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
        
        // Verificação básica - ID é essencial, o resto pode ser null
        if (!data.id) {
          throw new Error(`Dados da disciplina inválidos: ${JSON.stringify(data)}`);
        }
        
        // Preenche valores padrão para campos que podem ser null
        return {
          ...data,
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
          <div className="mb-6">
            <Skeleton className="h-8 w-1/4 mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-[250px] mb-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Skeleton className="h-6 w-[180px] mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3 mt-2" />
                </div>
              </CardContent>
            </Card>
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
            Tentar novamente
          </Button>
          <Button 
            onClick={() => navigate('/admin/academico/disciplines')}
            className="mb-4"
            variant="outline"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Voltar para lista de disciplinas
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
      <div className="flex-1 overflow-auto p-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar conteúdo pedagógico</h1>
            <p className="text-gray-500">{discipline.code} - {discipline.name}</p>
          </div>
          <Button 
            onClick={() => navigate('/admin/academico/disciplines')}
            variant="outline"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <CompletenessChecker discipline={discipline} />

        <Tabs defaultValue="conteudo" className="mt-6">
          <TabsList className="mb-4">
            <TabsTrigger value="conteudo">Conteúdo didático</TabsTrigger>
            <TabsTrigger value="info">Informações gerais</TabsTrigger>
          </TabsList>
          <TabsContent value="conteudo">
            <div className="grid grid-cols-1 gap-6">
              <VideoManager disciplineId={disciplineId} discipline={discipline} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <EbookManager disciplineId={disciplineId} discipline={discipline} />
                <InteractiveEbookManager disciplineId={disciplineId} discipline={discipline} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <SimuladoManager disciplineId={disciplineId} discipline={discipline} />
                <AvaliacaoFinalManager disciplineId={disciplineId} discipline={discipline} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Informações da disciplina</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium">Código</h3>
                    <p className="text-gray-700">{discipline.code}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Carga Horária</h3>
                    <p className="text-gray-700">{discipline.workload}h</p>
                  </div>
                  <div className="col-span-2">
                    <h3 className="text-sm font-medium">Descrição</h3>
                    <p className="text-gray-700 mt-1">{discipline.description}</p>
                  </div>
                  <div className="col-span-2">
                    <h3 className="text-sm font-medium">Ementa</h3>
                    <p className="text-gray-700 mt-1">{discipline.syllabus}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}