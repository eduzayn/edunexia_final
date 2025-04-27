import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Página de Gerenciamento de Assinaturas (Portal Financeiro Empresarial)
 * Este componente renderiza uma página para gestão de assinaturas recorrentes no módulo financeiro
 */
export default function SubscriptionsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Gerenciamento de Assinaturas</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Assinaturas</CardTitle>
          <CardDescription>
            Gerencie todas as assinaturas e pagamentos recorrentes da plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Esta funcionalidade está em desenvolvimento. Em breve você poderá:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Visualizar e gerenciar todas as assinaturas ativas</li>
            <li>Controlar ciclos de faturamento</li> 
            <li>Gerenciar renovações automáticas</li>
            <li>Exportar relatórios de assinaturas</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}