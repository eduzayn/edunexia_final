import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DisciplineForm } from "@/components/disciplines/discipline-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getDiscipline, updateDiscipline } from "@/api/disciplines";
import { queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { insertDisciplineSchema } from "@shared/schema";

export default function EditDisciplinePage() {
  const [, params] = useRoute<{ id: string }>("/admin/academico/disciplines/:id/edit");
  const disciplineId = params?.id;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: discipline, isLoading, error } = useQuery({
    queryKey: [`/api/admin/disciplines/${disciplineId}`],
    queryFn: () => getDiscipline(disciplineId || ""),
    enabled: !!disciplineId,
  });

  const handleSubmit = async (data: z.infer<typeof insertDisciplineSchema>) => {
    if (!disciplineId) return;
    
    setIsSubmitting(true);
    try {
      await updateDiscipline(disciplineId, data);
      // Invalidate cache to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/admin/disciplines/${disciplineId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/disciplines'] });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <Breadcrumbs
          items={[
            { title: "Dashboard", href: "/admin/dashboard" },
            { title: "Acadêmico", href: "/admin/academico" },
            { title: "Disciplinas", href: "/admin/academico/disciplines" },
            { title: "Editar Disciplina", href: `/admin/academico/disciplines/${disciplineId}/edit` }
          ]}
        />
        <DashboardHeader
          heading="Editar Disciplina"
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
                <p className="text-muted-foreground">Carregando informações da disciplina...</p>
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
            { title: "Editar Disciplina", href: `/admin/academico/disciplines/${disciplineId}/edit` }
          ]}
        />
        <DashboardHeader
          heading="Editar Disciplina"
          description="Ocorreu um erro ao carregar a disciplina."
        />
        <div className="mt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>
              Não foi possível carregar os detalhes da disciplina. Verifique se o ID é válido ou tente novamente mais tarde.
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
          { title: "Editar Disciplina", href: `/admin/academico/disciplines/${disciplineId}/edit` }
        ]}
      />
      <DashboardHeader
        heading={`Editar Disciplina: ${discipline.name}`}
        description="Edite os detalhes desta disciplina."
      />
      <div className="mt-6">
        <DisciplineForm 
          initialData={discipline} 
          onSubmit={handleSubmit} 
          isSubmitting={isSubmitting} 
        />
      </div>
    </DashboardShell>
  );
}