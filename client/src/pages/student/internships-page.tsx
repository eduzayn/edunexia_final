import React from 'react';
import { useAuth } from "@/hooks/use-auth";
import StudentLayout from "@/components/layout/student-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudentInternshipsPage() {
  const { user } = useAuth();

  return (
    <StudentLayout
      title="Estágios"
      subtitle="Visualize e candidate-se para oportunidades de estágio"
      breadcrumbs={[
        { title: "Home", href: "/student" },
        { title: "Estágios", href: "/student/internships" }
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle>Oportunidades de Estágio</CardTitle>
          <CardDescription>
            Visualize e candidate-se para oportunidades de estágio disponíveis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Nenhuma oportunidade de estágio disponível no momento.</p>
          <p className="text-sm text-muted-foreground mt-4">
            Esta página está em desenvolvimento. Em breve você poderá acessar oportunidades de estágio aqui.
          </p>
        </CardContent>
      </Card>
    </StudentLayout>
  );
}