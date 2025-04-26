import React from "react";
import { useParams } from "wouter";
import { EbookManager } from "./EbookManager";
import { VideoManager } from "./VideoManager";
import { SimuladoManager } from "./SimuladoManager";
import { AvaliacaoFinalManager } from "./AvaliacaoFinalManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DisciplineContentManager() {
  const params = useParams();
  const disciplineId = params.id;

  if (!disciplineId) {
    return <div className="text-center p-4">ID da disciplina não encontrado.</div>;
  }

  return (
    <div className="container py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Conteúdo da Disciplina</CardTitle>
          <CardDescription>
            Gerencie os materiais de estudo para esta disciplina.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="videos" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="videos">Vídeo-aulas</TabsTrigger>
              <TabsTrigger value="ebooks">E-book Estático</TabsTrigger>
              <TabsTrigger value="interactive">Conteúdo Interativo</TabsTrigger>
              <TabsTrigger value="simulado">Simulado</TabsTrigger>
              <TabsTrigger value="avaliacao-final">Avaliação Final</TabsTrigger>
            </TabsList>
            <TabsContent value="videos" className="pt-4">
              <VideoManager disciplinaId={disciplineId} />
            </TabsContent>
            <TabsContent value="ebooks" className="pt-4">
              <EbookManager disciplinaId={disciplineId} />
            </TabsContent>
            <TabsContent value="interactive" className="pt-4">
              <div className="border rounded-md p-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">Conteúdo Interativo</h3>
                  <p className="text-muted-foreground">
                    Aqui você poderá criar e gerenciar o conteúdo interativo da disciplina.
                    Esta funcionalidade será implementada em breve.
                  </p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="simulado" className="pt-4">
              <SimuladoManager />
            </TabsContent>
            <TabsContent value="avaliacao-final" className="pt-4">
              <AvaliacaoFinalManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}