import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle } from "lucide-react";
import { getDisciplineContent, checkDisciplineCompleteness } from "@/api/disciplines";

export default function DisciplineContentPage() {
  const [, params] = useRoute<{ id: string }>("/admin/academico/disciplines/:id/content");
  const disciplineId = params?.id;

  const { data: discipline, isLoading: isLoadingDiscipline, error: disciplineError } = useQuery({
    queryKey: [`/api/admin/disciplines/${disciplineId}/content`],
    queryFn: () => getDisciplineContent(disciplineId || ""),
    enabled: !!disciplineId,
  });

  const { data: completeness, isLoading: isLoadingCompleteness } = useQuery({
    queryKey: [`/api/admin/disciplines/${disciplineId}/check-completeness`],
    queryFn: () => checkDisciplineCompleteness(disciplineId || ""),
    enabled: !!disciplineId,
  });

  const isLoading = isLoadingDiscipline || isLoadingCompleteness;
  const error = disciplineError;

  if (isLoading) {
    return (
      <DashboardShell>
        <Breadcrumbs
          items={[
            { title: "Dashboard", href: "/admin/dashboard" },
            { title: "Acadêmico", href: "/admin/academico" },
            { title: "Disciplinas", href: "/admin/academico/disciplines" },
            { title: "Conteúdo", href: `/admin/academico/disciplines/${disciplineId}/content` }
          ]}
        />
        <DashboardHeader
          heading="Conteúdo da Disciplina"
          description="Carregando detalhes da disciplina..."
        />
        <div className="mt-6">
          <Card>
            <CardContent className="p-8 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <svg className="animate-spin h-8 w-8 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-muted-foreground">Carregando informações do conteúdo...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  if (error || !discipline) {
    return (
      <DashboardShell>
        <Breadcrumbs
          items={[
            { title: "Dashboard", href: "/admin/dashboard" },
            { title: "Acadêmico", href: "/admin/academico" },
            { title: "Disciplinas", href: "/admin/academico/disciplines" },
            { title: "Conteúdo", href: `/admin/academico/disciplines/${disciplineId}/content` }
          ]}
        />
        <DashboardHeader
          heading="Conteúdo da Disciplina"
          description="Ocorreu um erro ao carregar a disciplina."
        />
        <div className="mt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>
              Não foi possível carregar os detalhes do conteúdo da disciplina. Verifique se o ID é válido ou tente novamente mais tarde.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <Breadcrumbs
        items={[
          { title: "Dashboard", href: "/admin/dashboard" },
          { title: "Acadêmico", href: "/admin/academico" },
          { title: "Disciplinas", href: "/admin/academico/disciplines" },
          { title: "Conteúdo", href: `/admin/academico/disciplines/${disciplineId}/content` }
        ]}
      />
      <DashboardHeader
        heading={`Conteúdo da Disciplina: ${discipline.name}`}
        description="Gerencie o conteúdo da disciplina, incluindo vídeos, e-books e apostilas."
      >
        <div className="flex items-center space-x-2">
          <Badge 
            variant={discipline.contentStatus === "complete" ? "default" : "outline"}
            className="px-3 py-1"
          >
            <span className="flex items-center">
              {discipline.contentStatus === "complete" ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Completa
                </>
              ) : (
                "Incompleta"
              )}
            </span>
          </Badge>
        </div>
      </DashboardHeader>

      <div className="mt-6">
        {/* Resumo do Status de Completude */}
        {completeness && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Status de Completude</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full ${completeness.hasVideos ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>Vídeos: {completeness.hasVideos ? "Completo" : "Incompleto"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full ${completeness.hasEbook ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>E-book: {completeness.hasEbook ? "Completo" : "Incompleto"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full ${completeness.hasAssessments ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>Avaliações: {completeness.hasAssessments ? "Completo" : "Incompleto"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="videos">Vídeos</TabsTrigger>
            <TabsTrigger value="ebooks">E-books</TabsTrigger>
            <TabsTrigger value="assessments">Avaliações</TabsTrigger>
          </TabsList>
          
          {/* Conteúdo da aba Vídeos */}
          <TabsContent value="videos" className="mt-6 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-primary/10 p-4 mb-4">
                    <AlertCircle className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Módulo de Vídeo-aulas</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-6">
                    O módulo de vídeo-aulas está em implementação. Aqui você poderá gerenciar todos os vídeos desta disciplina.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Conteúdo da aba E-books */}
          <TabsContent value="ebooks" className="mt-6 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-primary/10 p-4 mb-4">
                    <AlertCircle className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Módulo de E-books</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-6">
                    O módulo de e-books está em implementação. Aqui você poderá gerenciar e-books estáticos e interativos para esta disciplina.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Conteúdo da aba Avaliações (será implementado posteriormente) */}
          <TabsContent value="assessments" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-primary/10 p-4 mb-4">
                    <AlertCircle className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Módulo de Avaliações</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-6">
                    O módulo de avaliações será implementado em breve. Aqui você poderá criar simulados e avaliações finais para esta disciplina.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}