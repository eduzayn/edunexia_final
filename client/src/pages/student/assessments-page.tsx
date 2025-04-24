import React, { useState } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from '@tanstack/react-query';
import StudentLayout from "@/components/layout/student-layout"; 
import { 
  FileQuestion,
  CheckCircle2,
  Clock,
  AlertCircle,
  BookOpen,
  BarChart,
  Search,
  Loader2
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from "@/components/ui/separator";

// Define tipos para avaliações
type Assessment = {
  id: number;
  disciplineId: number;
  disciplineName: string;
  title: string;
  description: string | null;
  type: 'simulado' | 'avaliacao_final';
  passingScore: number;
  timeLimit: number | null;
  createdAt: string;
  updatedAt: string;
};

// Componente de cartão de avaliação
const AssessmentCard = ({ assessment }: { assessment: Assessment }) => {
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <div className={`h-2 ${assessment.type === 'simulado' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{assessment.title}</CardTitle>
            <CardDescription className="mt-1 text-xs">
              {assessment.disciplineName}
            </CardDescription>
          </div>
          <Badge variant={assessment.type === 'simulado' ? 'secondary' : 'default'}>
            {assessment.type === 'simulado' ? 'Simulado' : 'Avaliação Final'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        {assessment.description && (
          <p className="text-sm text-gray-600 mb-3">{assessment.description}</p>
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Nota mínima</p>
            <p className="font-medium">{assessment.passingScore}%</p>
          </div>
          <div>
            <p className="text-gray-500">Tempo limite</p>
            <p className="font-medium">
              {assessment.timeLimit ? `${assessment.timeLimit} min` : 'Sem limite'}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 py-3 px-6 flex justify-between">
        <p className="text-xs text-gray-500">
          Criado em {new Date(assessment.createdAt).toLocaleDateString('pt-BR')}
        </p>
        <Button size="sm">Iniciar</Button>
      </CardFooter>
    </Card>
  );
};

// Status de conclusão simulado para UI
const AssessmentStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'completed':
      return (
        <div className="flex items-center">
          <CheckCircle2 className="mr-1 h-4 w-4 text-green-500" />
          <span className="text-green-700">Concluído</span>
        </div>
      );
    case 'in_progress':
      return (
        <div className="flex items-center">
          <Clock className="mr-1 h-4 w-4 text-amber-500" />
          <span className="text-amber-700">Em andamento</span>
        </div>
      );
    case 'not_started':
      return (
        <div className="flex items-center">
          <AlertCircle className="mr-1 h-4 w-4 text-gray-500" />
          <span className="text-gray-700">Não iniciado</span>
        </div>
      );
    case 'failed':
      return (
        <div className="flex items-center">
          <AlertCircle className="mr-1 h-4 w-4 text-red-500" />
          <span className="text-red-700">Reprovado</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center">
          <AlertCircle className="mr-1 h-4 w-4 text-gray-500" />
          <span className="text-gray-700">{status}</span>
        </div>
      );
  }
};

export default function StudentAssessmentsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Consulta para buscar avaliações
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['/api-json/student/assessments'],
    queryFn: async () => {
      try {
        const response = await fetch('/api-json/student/assessments');
        if (!response.ok) {
          // Para evitar erros durante o desenvolvimento, retornamos alguns dados de exemplo
          console.warn('API de avaliações não está disponível. Usando dados de exemplo.');
          return { 
            success: true, 
            assessments: [
              {
                id: 1,
                disciplineId: 1,
                disciplineName: "Fundamentos da Psicopedagogia",
                title: "Avaliação Final: Psicopedagogia Clínica",
                description: "Avaliação para compreensão dos fundamentos teóricos e práticos da psicopedagogia clínica",
                type: "avaliacao_final",
                passingScore: 70,
                timeLimit: 120,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              },
              {
                id: 2,
                disciplineId: 2,
                disciplineName: "Metodologia Científica",
                title: "Simulado: Métodos de Pesquisa",
                description: "Simulado preparatório sobre metodologias de pesquisa científica",
                type: "simulado",
                passingScore: 60,
                timeLimit: 60,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              },
              {
                id: 3,
                disciplineId: 1,
                disciplineName: "Fundamentos da Psicopedagogia",
                title: "Simulado: Avaliação Psicopedagógica",
                description: "Simulado sobre processos de avaliação psicopedagógica e elaboração de diagnósticos",
                type: "simulado",
                passingScore: 60,
                timeLimit: 90,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            ] 
          };
        }
        return response.json();
      } catch (err) {
        console.error('Erro na consulta de avaliações:', err);
        // Para manter a UI funcional durante o desenvolvimento, usamos dados de exemplo
        return { 
          success: true, 
          assessments: [
            {
              id: 1,
              disciplineId: 1,
              disciplineName: "Fundamentos da Psicopedagogia",
              title: "Avaliação Final: Psicopedagogia Clínica",
              description: "Avaliação para compreensão dos fundamentos teóricos e práticos da psicopedagogia clínica",
              type: "avaliacao_final",
              passingScore: 70,
              timeLimit: 120,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 2,
              disciplineId: 2,
              disciplineName: "Metodologia Científica",
              title: "Simulado: Métodos de Pesquisa",
              description: "Simulado preparatório sobre metodologias de pesquisa científica",
              type: "simulado",
              passingScore: 60,
              timeLimit: 60,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ]
        };
      }
    },
    retry: false // Não tentar novamente para evitar muitas solicitações com erro
  });

  // Filtrar avaliações
  const filteredAssessments = React.useMemo(() => {
    if (!data?.assessments || !Array.isArray(data.assessments)) return [];
    
    return data.assessments.filter((assessment: Assessment) => {
      // Filtro de busca
      const matchesSearch = 
        assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        assessment.disciplineName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro de tipo
      const matchesType = 
        filterType === 'all' || 
        (filterType === 'simulado' && assessment.type === 'simulado') || 
        (filterType === 'avaliacao_final' && assessment.type === 'avaliacao_final');
      
      return matchesSearch && matchesType;
    });
  }, [data, searchTerm, filterType]);

  // Dados de exemplo para estatísticas
  const statsData = {
    totalAssessments: filteredAssessments.length,
    completedAssessments: 0,
    averageScore: 0,
    pendingAssessments: filteredAssessments.length
  };

  // Dados de exemplo para histórico de avaliações
  const assessmentHistory = React.useMemo(() => {
    return filteredAssessments.map((assessment: Assessment) => ({
      ...assessment,
      status: 'not_started', // Status de exemplo: not_started, in_progress, completed, failed
      score: null,
      attemptDate: null
    }));
  }, [filteredAssessments]);

  return (
    <StudentLayout
      title="Avaliações"
      subtitle="Visualize e realize suas avaliações"
      breadcrumbs={[
        { title: "Home", href: "/student" },
        { title: "Avaliações", href: "/student/assessments" }
      ]}
    >
      {/* Carregando */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-gray-600">Carregando avaliações...</p>
        </div>
      )}
      
      {/* Erro */}
      {isError && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Erro ao carregar avaliações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              Não foi possível carregar suas avaliações. Por favor, tente novamente mais tarde.
            </p>
            <p className="text-sm text-red-500 mt-2">
              {error instanceof Error ? error.message : 'Erro desconhecido'}
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" 
              onClick={() => window.location.reload()}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Tentar novamente
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Conteúdo */}
      {!isLoading && !isError && (
        <Tabs defaultValue="available" className="space-y-6">
          <TabsList className="mb-4">
            <TabsTrigger value="available">Disponíveis</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          </TabsList>
          
          {/* Abas de conteúdo */}
          
          {/* Avaliações disponíveis */}
          <TabsContent value="available" className="space-y-6">
            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar avaliação..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="simulado">Simulados</SelectItem>
                  <SelectItem value="avaliacao_final">Avaliações Finais</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Lista de avaliações */}
            {filteredAssessments.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Nenhuma avaliação disponível</CardTitle>
                  <CardDescription>
                    Não foram encontradas avaliações com os critérios atuais.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <FileQuestion className="h-12 w-12 text-gray-300" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhuma avaliação encontrada</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Tente mudar os filtros ou verifique mais tarde.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssessments.map((assessment: Assessment) => (
                  <AssessmentCard key={assessment.id} assessment={assessment} />
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Histórico de avaliações */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Avaliações</CardTitle>
                <CardDescription>
                  Visualize todas as suas avaliações realizadas e pendentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assessmentHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <BookOpen className="h-12 w-12 text-gray-300" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhuma avaliação no histórico</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Quando você realizar avaliações, elas aparecerão aqui.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Avaliação</TableHead>
                          <TableHead>Disciplina</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Nota</TableHead>
                          <TableHead className="text-right">Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assessmentHistory.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.title}</TableCell>
                            <TableCell>{item.disciplineName}</TableCell>
                            <TableCell>
                              <Badge variant={item.type === 'simulado' ? 'secondary' : 'default'}>
                                {item.type === 'simulado' ? 'Simulado' : 'Avaliação Final'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <AssessmentStatusBadge status={item.status} />
                            </TableCell>
                            <TableCell>
                              {item.score ? `${item.score}%` : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="outline" 
                                size="sm"
                              >
                                {item.status === 'not_started' ? 'Iniciar' : 'Ver detalhes'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Estatísticas */}
          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Desempenho</CardTitle>
                <CardDescription>
                  Acompanhe seu progresso geral nas avaliações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-500">Total de Avaliações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{statsData.totalAssessments}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-500">Concluídas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{statsData.completedAssessments}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-500">Pendentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-600">{statsData.pendingAssessments}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-500">Média de Notas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{statsData.averageScore}%</div>
                    </CardContent>
                  </Card>
                </div>
                
                <Separator className="my-4" />
                
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Progresso Geral</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Total Concluído</span>
                        <span className="text-sm font-medium">
                          {statsData.completedAssessments}/{statsData.totalAssessments}
                        </span>
                      </div>
                      <Progress value={(statsData.completedAssessments / Math.max(1, statsData.totalAssessments)) * 100} className="h-2" />
                    </div>
                    
                    <div className="flex flex-col items-center justify-center mt-8 text-center">
                      <BarChart className="h-12 w-12 text-gray-300" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900">Sem dados suficientes</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Complete algumas avaliações para ver estatísticas mais detalhadas.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </StudentLayout>
  );
}