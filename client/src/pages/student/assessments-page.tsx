import React, { useState } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard, 
  BookOpenText,
  BookMarked,
  GraduationCap,
  FileQuestion,
  BriefcaseBusiness,
  Handshake,
  Banknote,
  Calendar,
  MessagesSquare,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  BookOpen,
  BarChart,
  Search,
  Loader2
} from 'lucide-react';
import { Sidebar } from "@/components/layout/sidebar";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Definir itens da sidebar
  const [location] = useLocation();
  const sidebarItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={18} />, href: "/student/dashboard", active: location === "/student/dashboard" },
    { name: "Meus Cursos", icon: <BookOpenText size={18} />, href: "/student/courses", active: location === "/student/courses" || location.startsWith("/student/courses/") },
    { name: "Biblioteca", icon: <BookMarked size={18} />, href: "/student/library", active: location === "/student/library" },
    { name: "Credencial", icon: <GraduationCap size={18} />, href: "/student/credencial", active: location === "/student/credencial" },
    { name: "Avaliações", icon: <FileQuestion size={18} />, href: "/student/assessments", active: location === "/student/assessments" },
    { name: "Estágios", icon: <BriefcaseBusiness size={18} />, href: "/student/internships", active: location === "/student/internships" },
    { name: "Contratos", icon: <Handshake size={18} />, href: "/student/contracts", active: location === "/student/contracts" },
    { name: "Financeiro", icon: <Banknote size={18} />, href: "/student/financial", active: location === "/student/financial" },
    { name: "Calendário", icon: <Calendar size={18} />, href: "/student/calendar", active: location === "/student/calendar" },
    { name: "Mensagens", icon: <MessagesSquare size={18} />, href: "/student/messages", active: location === "/student/messages" },
    { name: "Meu Perfil", icon: <User size={18} />, href: "/student/profile", active: location === "/student/profile" }
  ];

  // Consulta para buscar avaliações
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['/api-json/student/assessments'],
    queryFn: async () => {
      try {
        const response = await fetch('/api-json/student/assessments');
        if (!response.ok) {
          throw new Error('Erro ao buscar avaliações');
        }
        return response.json();
      } catch (err) {
        console.error('Erro na consulta de avaliações:', err);
        throw err;
      }
    }
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
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        items={sidebarItems}
        user={user}
        portalType="student"
        portalColor="#12B76A"
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 py-20 md:py-6 md:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Avaliações</h1>
            <p className="text-gray-600">Visualize e realize suas avaliações</p>
          </div>
          
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
                          Tente mudar os filtros ou volte mais tarde.
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSearchTerm('');
                            setFilterType('all');
                          }}
                          className="mt-4"
                        >
                          Limpar filtros
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredAssessments.map((assessment: Assessment) => (
                      <AssessmentCard key={assessment.id} assessment={assessment} />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* Histórico */}
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>Histórico de Avaliações</CardTitle>
                    <CardDescription>
                      Veja todas as avaliações que você já realizou
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Avaliação</TableHead>
                            <TableHead>Disciplina</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Nota</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assessmentHistory.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="h-24 text-center">
                                Nenhuma avaliação realizada ainda.
                              </TableCell>
                            </TableRow>
                          ) : (
                            assessmentHistory.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.title}</TableCell>
                                <TableCell>{item.disciplineName}</TableCell>
                                <TableCell>
                                  {item.type === 'simulado' ? 'Simulado' : 'Avaliação Final'}
                                </TableCell>
                                <TableCell>
                                  <AssessmentStatusBadge status={item.status} />
                                </TableCell>
                                <TableCell>
                                  {item.score !== null ? `${item.score}%` : '-'}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Estatísticas */}
              <TabsContent value="stats">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Sumário */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Resumo de Desempenho</CardTitle>
                      <CardDescription>
                        Visão geral das suas avaliações
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-500">Avaliações totais</p>
                          <div className="flex items-center">
                            <FileQuestion className="mr-2 h-5 w-5 text-primary" />
                            <span className="text-2xl font-bold">{statsData.totalAssessments}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-500">Concluídas</p>
                          <div className="flex items-center">
                            <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                            <span className="text-2xl font-bold">{statsData.completedAssessments}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-500">Nota média</p>
                          <div className="flex items-center">
                            <BarChart className="mr-2 h-5 w-5 text-blue-500" />
                            <span className="text-2xl font-bold">{statsData.averageScore}%</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-500">Pendentes</p>
                          <div className="flex items-center">
                            <Clock className="mr-2 h-5 w-5 text-amber-500" />
                            <span className="text-2xl font-bold">{statsData.pendingAssessments}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Progresso */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Progresso Geral</CardTitle>
                      <CardDescription>
                        Acompanhe sua jornada acadêmica
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium">Simulados completados</p>
                          <p className="text-sm text-gray-500">0/1</p>
                        </div>
                        <Progress value={0} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium">Avaliações finais</p>
                          <p className="text-sm text-gray-500">0/1</p>
                        </div>
                        <Progress value={0} className="h-2" />
                      </div>
                      <Separator />
                      <div>
                        <div className="flex justify-between mb-2">
                          <h4 className="text-sm font-medium">Por disciplina</h4>
                          <p className="text-xs text-gray-500">Avaliações pendentes</p>
                        </div>
                        {data?.assessments && data.assessments.length > 0 ? (
                          <ul className="space-y-2 text-sm">
                            {[...new Set(data.assessments.map((a: Assessment) => a.disciplineName))].map((disciplineName, index) => (
                              <li key={index} className="flex justify-between">
                                <span>{disciplineName}</span>
                                <span className="text-gray-500">2</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-2">
                            Nenhuma disciplina com avaliações
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}