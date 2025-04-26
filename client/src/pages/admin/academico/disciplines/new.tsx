import React, { useState } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DisciplineForm } from "@/components/disciplines/discipline-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { createDiscipline } from "@/api/disciplines";
import { z } from "zod";
import { insertDisciplineSchema } from "@shared/schema";

export default function NewDisciplinePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: z.infer<typeof insertDisciplineSchema>) => {
    setIsSubmitting(true);
    try {
      await createDiscipline(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardShell>
      <Breadcrumbs
        items={[
          { title: "Dashboard", href: "/admin/dashboard" },
          { title: "Acadêmico", href: "/admin/academico" },
          { title: "Disciplinas", href: "/admin/academico/disciplines" },
          { title: "Nova Disciplina", href: "/admin/academico/disciplines/new" }
        ]}
      />
      <DashboardHeader
        heading="Nova Disciplina"
        description="Crie uma nova disciplina para o seu catálogo acadêmico."
      />
      <div className="mt-6">
        <DisciplineForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </DashboardShell>
  );
}