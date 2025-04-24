import React from 'react';
import { useAuth } from "@/hooks/use-auth";
import StudentLayout from "@/components/layout/student-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudentMessagesPage() {
  const { user } = useAuth();

  return (
    <StudentLayout
      title="Mensagens"
      subtitle="Gerencie suas mensagens e comunicações"
      breadcrumbs={[
        { title: "Home", href: "/student" },
        { title: "Mensagens", href: "/student/messages" }
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle>Central de Mensagens</CardTitle>
          <CardDescription>
            Gerencie suas mensagens e comunicações.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Nenhuma mensagem disponível no momento.</p>
          <p className="text-sm text-muted-foreground mt-4">
            Esta página está em desenvolvimento. Em breve você poderá acessar suas mensagens aqui.
          </p>
        </CardContent>
      </Card>
    </StudentLayout>
  );
}