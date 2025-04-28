import React, { useState } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import { Helmet } from "react-helmet";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { DisciplineForm } from "@/components/disciplines/discipline-form";
import { createDiscipline } from "@/api/disciplines";
import { DisciplineFormData } from "@/types/discipline";
import { useQueryClient } from "@tanstack/react-query";

export default function NewDisciplinePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Função para lidar com a criação de uma nova disciplina
  const handleCreateDiscipline = async (data: DisciplineFormData) => {
    setIsSubmitting(true);
    try {
      await createDiscipline(data);
      
      // Após criar com sucesso, invalidar a consulta para forçar a recarga da lista
      console.log("Invalidando cache após criar disciplina");
      // Invalidar a consulta com a mesma queryKey usada no componente DisciplineList
      queryClient.invalidateQueries({ queryKey: ["/api/admin/disciplines"] });
      
      // Garantir que a invalidação tenha efeito antes de redirecionar
      await new Promise(resolve => setTimeout(resolve, 300));
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