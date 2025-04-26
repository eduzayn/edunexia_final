import React, { useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import { Helmet } from "react-helmet";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { DisciplineForm } from "@/components/disciplines/discipline-form";
import { getDiscipline, updateDiscipline } from "@/api/disciplines";
import { DisciplineFormData } from "@/types/discipline";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function EditDisciplinePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, params] = useRoute("/admin/academico/disciplines/:id/edit");
  const id = params?.id;

  // Busca os dados da disciplina pelo ID
  const { data: discipline, isLoading, error } = useQuery({
    queryKey: [`/api/admin/disciplines/${id}`],
    queryFn: () => id ? getDiscipline(id) : Promise.reject(new Error("ID não fornecido")),
    enabled: !!id,
  });

  // Função para lidar com a atualização da disciplina
  const handleUpdateDiscipline = async (data: DisciplineFormData) => {
    if (!id) return Promise.reject(new Error("ID não fornecido"));
    
    setIsSubmitting(true);
    try {
      await updateDiscipline(id, data);
    } catch (error) {
      console.error("Erro ao atualizar disciplina:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderiza estado de carregamento
  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-sm text-muted-foreground">Carregando disciplina...</p>
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
              Não foi possível carregar a disciplina. Verifique se o ID está correto.
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
        <title>Editar Disciplina | EdunexIA</title>
      </Helmet>
      
      <DashboardShell>
        <DashboardHeader 
          heading={`Editar Disciplina: ${discipline.name}`} 
          text="Atualize as informações desta disciplina."
        />
        
        <div className="space-y-4">
          <Breadcrumbs
            items={[
              { title: "Dashboard", href: "/admin/dashboard" },
              { title: "Acadêmico", href: "/admin/academico" },
              { title: "Disciplinas", href: "/admin/academico/disciplines" },
              { title: discipline.name, href: `/admin/academico/disciplines/${id}/edit` }
            ]}
          />
          
          <DisciplineForm 
            initialData={discipline}
            onSubmit={handleUpdateDiscipline}
            isSubmitting={isSubmitting}
          />
        </div>
      </DashboardShell>
    </>
  );
}