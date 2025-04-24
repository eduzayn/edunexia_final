import React from 'react';
import { useAuth } from "@/hooks/use-auth";
import StudentLayout from "@/components/layout/student-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudentCalendarPage() {
  const { user } = useAuth();

  return (
    <StudentLayout
      title="Calendário Acadêmico"
      subtitle="Visualize datas importantes e eventos"
      breadcrumbs={[
        { title: "Home", href: "/student" },
        { title: "Calendário", href: "/student/calendar" }
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle>Calendário de Eventos</CardTitle>
          <CardDescription>
            Visualize datas importantes, prazos e eventos acadêmicos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Nenhum evento agendado no momento.</p>
          <p className="text-sm text-muted-foreground mt-4">
            Esta página está em desenvolvimento. Em breve você poderá visualizar seu calendário acadêmico aqui.
          </p>
        </CardContent>
      </Card>
    </StudentLayout>
  );
}