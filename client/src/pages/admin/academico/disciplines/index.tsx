import React from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DisciplineList } from "@/components/disciplines/discipline-list";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default function DisciplinesPage() {
  return (
    <DashboardShell>
      <Breadcrumbs
        items={[
          { title: "Dashboard", href: "/admin/dashboard" },
          { title: "Acadêmico", href: "/admin/academico" },
          { title: "Disciplinas", href: "/admin/academico/disciplines" },
        ]}
      />
      <DashboardHeader
        heading="Disciplinas"
        description="Gerencie as disciplinas do seu catálogo acadêmico."
      />
      <div className="mt-6">
        <DisciplineList />
      </div>
    </DashboardShell>
  );
}