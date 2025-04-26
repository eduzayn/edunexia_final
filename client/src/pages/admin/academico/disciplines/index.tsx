import React from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import { Helmet } from "react-helmet";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { DisciplineList } from "@/components/disciplines/discipline-list";

export default function DisciplinesPage() {
  return (
    <>
      <Helmet>
        <title>Disciplinas | EdunexIA</title>
      </Helmet>
      
      <DashboardShell>
        <DashboardHeader heading="Disciplinas" text="Gerencie as disciplinas oferecidas pela instituição." />
        
        <div className="space-y-4">
          <Breadcrumbs
            items={[
              { title: "Dashboard", href: "/admin/dashboard" },
              { title: "Acadêmico", href: "/admin/academico" },
              { title: "Disciplinas", href: "/admin/academico/disciplines" }
            ]}
          />
          
          <DisciplineList />
        </div>
      </DashboardShell>
    </>
  );
}