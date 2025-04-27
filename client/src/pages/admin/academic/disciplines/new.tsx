import React, { useState } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import { Helmet } from "react-helmet";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { DisciplineForm } from "@/components/disciplines/discipline-form";
import { createDiscipline } from "@/api/disciplines";
import { DisciplineFormData } from "@/types/discipline";

export default function NewDisciplinePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Função para lidar com a criação de uma nova disciplina
  const handleCreateDiscipline = async (data: DisciplineFormData) => {
    setIsSubmitting(true);
    try {
      await createDiscipline(data);
    } catch (error) {
      console.error("Erro ao criar disciplina:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Nova Disciplina | EdunexIA</title>
      </Helmet>
      
      <DashboardShell>
        <DashboardHeader 
          heading="Nova Disciplina" 
          text="Crie uma nova disciplina para oferecer aos alunos."
        />
        
        <div className="space-y-4">
          <Breadcrumbs
            items={[
              { title: "Dashboard", href: "/admin/dashboard" },
              { title: "Acadêmico", href: "/admin/academic" },
              { title: "Disciplinas", href: "/admin/academic/disciplines" },
              { title: "Nova Disciplina", href: "/admin/academic/disciplines/new" }
            ]}
          />
          
          <DisciplineForm 
            onSubmit={handleCreateDiscipline}
            isSubmitting={isSubmitting}
          />
        </div>
      </DashboardShell>
    </>
  );
}