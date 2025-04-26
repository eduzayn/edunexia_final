import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CompletenessChecker } from './CompletenessChecker';
import { VideoPlayer } from './VideoPlayer';
import { EbookViewer } from './EbookViewer';
import { SimuladoPreview } from './SimuladoPreview';
import { AvaliacaoFinalPreview } from './AvaliacaoFinalPreview';
import { PlusCircle, Video, FileText, BookOpen, ClipboardList, FileCheck } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// Interface para a disciplina
interface Discipline {
  id: number;
  code: string;
  name: string;
  description: string;
  workload: number;
  syllabus: string;
  contentStatus: 'complete' | 'incomplete';
}

// Interface para as props do componente
interface DisciplineContentManagerProps {
  discipline: Discipline;
  readOnly?: boolean;
}

// Componente principal
export function DisciplineContentManager({ discipline, readOnly = false }: DisciplineContentManagerProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [contentStatus, setContentStatus] = useState<'complete' | 'incomplete'>(discipline.contentStatus || 'incomplete');
  const { toast } = useToast();

  // Atualizar o status de completude
  const handleCompletenessChange = (isComplete: boolean) => {
    setContentStatus(isComplete ? 'complete' : 'incomplete');
  };

  // Renderizar um botão para adicionar conteúdo
  const renderAddButton = (title: string, icon: React.ReactNode, onClick: () => void) => {
    if (readOnly) return null;
    return (
      <Button 
        variant="outline" 
        className="w-full flex items-center justify-center gap-2 mt-4"
        onClick={onClick}
      >
        {icon}
        <span>Adicionar {title}</span>
      </Button>
    );
  };

  // Funções para adicionar conteúdo (seriam implementadas em uma aplicação real)
  const addVideo = () => {
    // Implementação para adicionar vídeo
    toast({
      title: "Adicionar vídeo",
      description: "Funcionalidade de adicionar vídeo seria implementada aqui",
    });
  };

  const addEbook = () => {
    // Implementação para adicionar e-book
    toast({
      title: "Adicionar e-book",
      description: "Funcionalidade de adicionar e-book seria implementada aqui",
    });
  };

  const addInteractiveEbook = () => {
    // Implementação para adicionar e-book interativo
    toast({
      title: "Adicionar e-book interativo",
      description: "Funcionalidade de adicionar e-book interativo seria implementada aqui",
    });
  };

  const addSimulado = () => {
    // Implementação para adicionar simulado
    toast({
      title: "Adicionar simulado",
      description: "Funcionalidade de adicionar simulado seria implementada aqui",
    });
  };

  const addAvaliacaoFinal = () => {
    // Implementação para adicionar avaliação final
    toast({
      title: "Adicionar avaliação final",
      description: "Funcionalidade de adicionar avaliação final seria implementada aqui",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Conteúdo da Disciplina: {discipline.name}</CardTitle>
          <CardDescription>
            Gerencie vídeos, e-books, simulados e avaliações para esta disciplina
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="overview" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-3 md:grid-cols-6">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="videos">Vídeos</TabsTrigger>
              <TabsTrigger value="ebooks">E-books</TabsTrigger>
              <TabsTrigger value="interactive">Interativos</TabsTrigger>
              <TabsTrigger value="simulado">Simulado</TabsTrigger>
              <TabsTrigger value="avaliacao">Avaliação Final</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Informações Básicas</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Código:</span> {discipline.code}
                    </div>
                    <div>
                      <span className="font-medium">Carga Horária:</span> {discipline.workload} horas
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>{' '}
                      <span className={contentStatus === 'complete' ? 'text-green-600' : 'text-amber-600'}>
                        {contentStatus === 'complete' ? 'Completa' : 'Incompleta'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-medium mb-1">Descrição:</h4>
                    <p className="text-sm text-muted-foreground">{discipline.description}</p>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-medium mb-1">Ementa:</h4>
                    <p className="text-sm text-muted-foreground">{discipline.syllabus}</p>
                  </div>
                </div>

                <div>
                  <CompletenessChecker 
                    disciplineId={discipline.id} 
                    onStatusChange={handleCompletenessChange}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="videos" className="pt-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Vídeos da Disciplina</h3>
                <p className="text-sm text-muted-foreground">
                  Gerencie os vídeos disponíveis para esta disciplina. É necessário ter pelo menos 1 vídeo.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {/* Este é um exemplo, seria substituído por dados reais */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Introdução à Disciplina</CardTitle>
                      <CardDescription>15:30 minutos • Adicionado em 15/03/2025</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="aspect-video bg-slate-100 rounded flex items-center justify-center">
                        <VideoPlayer 
                          url="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                          title="Introdução à Disciplina" 
                        />
                      </div>
                    </CardContent>
                    {!readOnly && (
                      <CardFooter className="flex justify-end pt-0">
                        <Button variant="outline" size="sm">Editar</Button>
                        <Button variant="destructive" size="sm" className="ml-2">Remover</Button>
                      </CardFooter>
                    )}
                  </Card>
                </div>
                
                {renderAddButton("Vídeo", <Video className="h-4 w-4" />, addVideo)}
              </div>
            </TabsContent>

            <TabsContent value="ebooks" className="pt-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">E-books da Disciplina</h3>
                <p className="text-sm text-muted-foreground">
                  Gerencie os e-books disponíveis para esta disciplina. É necessário ter pelo menos 1 e-book.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {/* Este é um exemplo, seria substituído por dados reais */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Material Complementar</CardTitle>
                      <CardDescription>PDF • 2.5 MB • Adicionado em 15/03/2025</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="h-40 bg-slate-100 rounded flex items-center justify-center">
                        <FileText className="h-12 w-12 text-muted-foreground" />
                      </div>
                    </CardContent>
                    {!readOnly && (
                      <CardFooter className="flex justify-end pt-0">
                        <Button variant="outline" size="sm">Visualizar</Button>
                        <Button variant="destructive" size="sm" className="ml-2">Remover</Button>
                      </CardFooter>
                    )}
                  </Card>
                </div>
                
                {renderAddButton("E-book", <BookOpen className="h-4 w-4" />, addEbook)}
              </div>
            </TabsContent>

            <TabsContent value="interactive" className="pt-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">E-books Interativos</h3>
                <p className="text-sm text-muted-foreground">
                  Gerencie os e-books interativos disponíveis para esta disciplina.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {/* Este é um exemplo, seria substituído por dados reais */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Tutorial Interativo</CardTitle>
                      <CardDescription>HTML Interativo • Adicionado em 18/03/2025</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="h-40 bg-slate-100 rounded flex items-center justify-center">
                        <FileText className="h-12 w-12 text-blue-500" />
                      </div>
                    </CardContent>
                    {!readOnly && (
                      <CardFooter className="flex justify-end pt-0">
                        <Button variant="outline" size="sm">Visualizar</Button>
                        <Button variant="destructive" size="sm" className="ml-2">Remover</Button>
                      </CardFooter>
                    )}
                  </Card>
                </div>
                
                {renderAddButton("E-book Interativo", <FileText className="h-4 w-4" />, addInteractiveEbook)}
              </div>
            </TabsContent>

            <TabsContent value="simulado" className="pt-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Simulado da Disciplina</h3>
                <p className="text-sm text-muted-foreground">
                  Gerencie o simulado da disciplina. É necessário ter pelo menos 5 questões.
                </p>
                
                <div className="mt-4">
                  {/* Este é um exemplo, seria substituído por dados reais */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Simulado: Conhecimentos Gerais</CardTitle>
                      <CardDescription>3 questões cadastradas • Nota mínima: 6.0</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center py-4">
                        <ClipboardList className="h-16 w-16 text-amber-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-amber-500 font-medium">Atenção: são necessárias pelo menos 5 questões!</p>
                        <p className="text-sm text-muted-foreground mt-1">Adicione mais 2 questões para completar o requisito mínimo.</p>
                      </div>
                    </CardContent>
                    {!readOnly && (
                      <CardFooter className="flex justify-center">
                        <Button variant="outline">Gerenciar Questões</Button>
                      </CardFooter>
                    )}
                  </Card>
                </div>
                
                {renderAddButton("Simulado", <ClipboardList className="h-4 w-4" />, addSimulado)}
              </div>
            </TabsContent>

            <TabsContent value="avaliacao" className="pt-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Avaliação Final</h3>
                <p className="text-sm text-muted-foreground">
                  Gerencie a avaliação final da disciplina. É necessário ter exatamente 10 questões.
                </p>
                
                <div className="mt-4">
                  {/* Este é um exemplo, seria substituído por dados reais */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Avaliação Final da Disciplina</CardTitle>
                      <CardDescription>Não configurada • Nota mínima: 7.0</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center py-4">
                        <FileCheck className="h-16 w-16 text-amber-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-amber-500 font-medium">Atenção: a avaliação final precisa ter 10 questões!</p>
                        <p className="text-sm text-muted-foreground mt-1">Adicione questões para completar a avaliação final.</p>
                      </div>
                    </CardContent>
                    {!readOnly && (
                      <CardFooter className="flex justify-center">
                        <Button variant="outline">Gerenciar Avaliação</Button>
                      </CardFooter>
                    )}
                  </Card>
                </div>
                
                {renderAddButton("Avaliação Final", <FileCheck className="h-4 w-4" />, addAvaliacaoFinal)}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default DisciplineContentManager;