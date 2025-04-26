import { useParams } from "react-router-dom";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoManager } from "@/components/disciplinas/VideoManager";
import { EbookManager } from "@/components/disciplinas/EbookManager";
import { InteractiveEbookManager } from "@/components/disciplinas/InteractiveEbookManager";
import { SimuladoManager } from "@/components/disciplinas/SimuladoManager";
import { AvaliacaoFinalManager } from "@/components/disciplinas/AvaliacaoFinalManager";
import { CompletenessChecker } from "@/components/disciplinas/CompletenessChecker";

export default function DisciplinaContentPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div>Disciplina não encontrada</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Gerenciar conteúdo pedagógico da disciplina</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="videos" className="w-full">
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="videos">Vídeos</TabsTrigger>
              <TabsTrigger value="ebook">E-book</TabsTrigger>
              <TabsTrigger value="interactive">E-book Interativo</TabsTrigger>
              <TabsTrigger value="simulados">Simulados</TabsTrigger>
              <TabsTrigger value="avaliacao">Avaliação Final</TabsTrigger>
            </TabsList>

            <TabsContent value="videos" className="mt-4">
              <VideoManager disciplineId={id} />
            </TabsContent>

            <TabsContent value="ebook" className="mt-4">
              <EbookManager disciplineId={id} />
            </TabsContent>

            <TabsContent value="interactive" className="mt-4">
              <InteractiveEbookManager disciplineId={id} />
            </TabsContent>

            <TabsContent value="simulados" className="mt-4">
              <SimuladoManager disciplineId={id} />
            </TabsContent>

            <TabsContent value="avaliacao" className="mt-4">
              <AvaliacaoFinalManager disciplineId={id} />
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Status da Disciplina</CardTitle>
            </CardHeader>
            <div className="p-4">
              <CompletenessChecker disciplineId={id} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}