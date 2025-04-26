import React from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import { Helmet } from "react-helmet";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { getDiscipline } from "@/api/disciplines";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoManager } from "@/components/disciplines/video-manager";
import { InteractiveEbookManager } from "@/components/disciplines/interactive-ebook-manager";
import { ApostilaManager } from "@/components/disciplines/apostila-manager";

export default function DisciplineContentPage() {
  const [, params] = useRoute("/admin/academico/disciplines/:id/content");
  const id = params?.id;

  // Busca os dados da disciplina pelo ID
  const { data: discipline, isLoading, error } = useQuery({
    queryKey: [`/api/admin/disciplines/${id}/content`],
    queryFn: () => id ? getDiscipline(id) : Promise.reject(new Error("ID não fornecido")),
    enabled: !!id,
  });

  // Renderiza estado de carregamento
  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-sm text-muted-foreground">Carregando conteúdo da disciplina...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  // Renderiza estado de erro
  if (error || !discipline) {
    return (
      <DashboardShell>
        <div className="py-10">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>
              Não foi possível carregar o conteúdo da disciplina. Verifique se o ID está correto.
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            <Link href="/admin/academico/disciplines">
              <Button>Voltar para a lista de disciplinas</Button>
            </Link>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`Conteúdo: ${discipline.name} | EdunexIA`}</title>
      </Helmet>
      
      <DashboardShell>
        <DashboardHeader 
          heading={`Conteúdo: ${discipline.name}`} 
          text="Gerencie vídeos, e-books e apostilas da disciplina."
        />
        
        <div className="space-y-4">
          <Breadcrumbs
            items={[
              { title: "Dashboard", href: "/admin/dashboard" },
              { title: "Acadêmico", href: "/admin/academico" },
              { title: "Disciplinas", href: "/admin/academico/disciplines" },
              { title: discipline.name, href: `/admin/academico/disciplines/${id}/content` }
            ]}
          />
          
          <Tabs defaultValue="videos" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="videos">Vídeo Aulas</TabsTrigger>
              <TabsTrigger value="ebook">E-book Interativo</TabsTrigger>
              <TabsTrigger value="apostila">Apostila (PDF)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="videos" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Componentes de vídeo - limitado aos primeiros 4 para este exemplo */}
                <VideoManager discipline={discipline} videoNumber={1} />
                <VideoManager discipline={discipline} videoNumber={2} />
                <VideoManager discipline={discipline} videoNumber={3} />
                <VideoManager discipline={discipline} videoNumber={4} />
              </div>
            </TabsContent>
            
            <TabsContent value="ebook" className="pt-4">
              <InteractiveEbookManager discipline={discipline} />
            </TabsContent>
            
            <TabsContent value="apostila" className="pt-4">
              <ApostilaManager discipline={discipline} />
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end mt-6">
            <Link href={`/admin/academico/disciplines/${id}/edit`}>
              <Button variant="outline" className="mr-2">
                Editar Disciplina
              </Button>
            </Link>
            <Link href="/admin/academico/disciplines">
              <Button variant="secondary">
                Voltar para Disciplinas
              </Button>
            </Link>
          </div>
        </div>
      </DashboardShell>
    </>
  );
}