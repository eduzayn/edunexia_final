import React from "react";
import { useParams } from "wouter";
import { EbookManager } from "./EbookManager";
import { VideoManager } from "./VideoManager";
import { SimuladoManager } from "./SimuladoManager";
import { AvaliacaoFinalManager } from "./AvaliacaoFinalManager";
import { InteractiveEbookManager } from "./InteractiveEbookManager";
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
              <InteractiveEbookManager disciplinaId={disciplineId} />
            </TabsContent>
            <TabsContent value="simulado" className="pt-4">
              <SimuladoManager disciplinaId={disciplineId} />
            </TabsContent>
            <TabsContent value="avaliacao-final" className="pt-4">
              <AvaliacaoFinalManager disciplinaId={disciplineId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}