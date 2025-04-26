
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VideoManager from '@/components/disciplinas/VideoManager';
import EbookManager from '@/components/disciplinas/EbookManager';
import InteractiveEbookManager from '@/components/disciplinas/InteractiveEbookManager';
import SimuladoManager from '@/components/disciplinas/SimuladoManager';
import AvaliacaoFinalManager from '@/components/disciplinas/AvaliacaoFinalManager';
import CompletenessChecker from '@/components/disciplinas/CompletenessChecker';
import { PageHeader } from '@/components/ui/page-header';
import AdminBreadcrumb from '@/components/admin/admin-breadcrumb';

export default function DisciplineContentPage() {
  const { id } = useParams<{ id: string }>();
  
  return (
    <div className="container mx-auto py-6">
      <AdminBreadcrumb 
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Acadêmico', href: '/admin/academico' },
          { label: 'Disciplinas', href: '/admin/academico/disciplinas' },
          { label: 'Conteúdo', href: `/admin/academico/disciplinas/${id}/content` }
        ]} 
      />
      
      <PageHeader 
        title="Gerenciamento de Conteúdo" 
        description="Gerencie os conteúdos e recursos da disciplina" 
      />

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
              <CardDescription>Acompanhe o status de completude da disciplina</CardDescription>
            </CardHeader>
            <CardContent>
              <CompletenessChecker disciplineId={id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
