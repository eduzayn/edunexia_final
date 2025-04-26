
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, BookIcon, PlayIcon, TestTubeIcon, GraduationCapIcon, CheckCircleIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import VideoManager from "@/components/disciplinas/VideoManager";
import EbookManager from "@/components/disciplinas/EbookManager";
import InteractiveEbookManager from "@/components/disciplinas/InteractiveEbookManager";
import SimuladoManager from "@/components/disciplinas/SimuladoManager";
import AvaliacaoFinalManager from "@/components/disciplinas/AvaliacaoFinalManager";
import CompletenessChecker from "@/components/disciplinas/CompletenessChecker";

export default function DisciplineContentPage() {
  const { id } = useParams();
  const [discipline, setDiscipline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDiscipline() {
      try {
        setLoading(true);
        const response = await fetch(`/api/disciplines/${id}`);
        if (!response.ok) {
          throw new Error('Falha ao carregar dados da disciplina');
        }
        const data = await response.json();
        setDiscipline(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar disciplina');
        console.error('Erro ao carregar disciplina:', err);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchDiscipline();
    }
  }, [id]);

  if (loading) {
    return <div className="flex justify-center p-8">Carregando dados da disciplina...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-3xl mx-auto my-8">
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container py-6">
      <PageHeader
        title={discipline?.name || 'Conteúdo da Disciplina'}
        description={`Gerencie o conteúdo pedagógico da disciplina ${discipline?.code || ''}`}
      />

      <CompletenessChecker disciplineId={id} className="mb-6" />

      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <PlayIcon className="h-4 w-4" />
            Vídeos
          </TabsTrigger>
          <TabsTrigger value="ebook" className="flex items-center gap-2">
            <BookIcon className="h-4 w-4" />
            E-book
          </TabsTrigger>
          <TabsTrigger value="interactive" className="flex items-center gap-2">
            <BookIcon className="h-4 w-4" />
            E-book Interativo
          </TabsTrigger>
          <TabsTrigger value="simulado" className="flex items-center gap-2">
            <TestTubeIcon className="h-4 w-4" />
            Simulado
          </TabsTrigger>
          <TabsTrigger value="avaliacao" className="flex items-center gap-2">
            <GraduationCapIcon className="h-4 w-4" />
            Avaliação Final
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos">
          <Card>
            <CardHeader>
              <CardTitle>Vídeos da Disciplina</CardTitle>
            </CardHeader>
            <CardContent>
              <VideoManager disciplineId={id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ebook">
          <Card>
            <CardHeader>
              <CardTitle>E-book</CardTitle>
            </CardHeader>
            <CardContent>
              <EbookManager disciplineId={id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactive">
          <Card>
            <CardHeader>
              <CardTitle>E-book Interativo</CardTitle>
            </CardHeader>
            <CardContent>
              <InteractiveEbookManager disciplineId={id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulado">
          <Card>
            <CardHeader>
              <CardTitle>Simulado</CardTitle>
            </CardHeader>
            <CardContent>
              <SimuladoManager disciplineId={id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="avaliacao">
          <Card>
            <CardHeader>
              <CardTitle>Avaliação Final</CardTitle>
            </CardHeader>
            <CardContent>
              <AvaliacaoFinalManager disciplineId={id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
