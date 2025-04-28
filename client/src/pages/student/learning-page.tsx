import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import StudentLayout from "@/components/layout/student-layout";
import {
  Book,
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  Film,
  GraduationCap,
  Lock,
  Play,
  Trophy,
  BadgeCheck,
  Star,
  Calendar,
  Clock2,
  Award,
  BookMarked,
  BarChart,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function LearningPage() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("conteudo");
  
  // Extrair o ID da disciplina dos parâmetros de consulta
  const params = new URLSearchParams(window.location.search);
  const disciplineId = params.get('disciplineId');

  // Mock data para a disciplina
  const disciplineData = {
    id: disciplineId ? parseInt(disciplineId) : 1,
    name: "Fundamentos da Psicopedagogia Clínica",
    description: "Esta disciplina aborda os princípios fundamentais da psicopedagogia clínica, explorando teorias, métodos e técnicas de avaliação e intervenção psicopedagógica.",
    courseName: "Pós-Graduação em Psicopedagogia Clínica e Institucional",
    courseId: 101,
    professorName: "Dra. Ana Silva",
    professorAvatar: "https://placehold.co/300x300/e2e8f0/475569?text=AS",
    progress: 45,
    totalHours: 60,
    completedHours: 27,
    startDate: "2025-03-15",
    endDate: "2025-05-15",
    status: "in_progress", // in_progress, completed, not_started
    nextLesson: {
      id: 5,
      title: "Avaliação Psicopedagógica em Contextos Clínicos",
      type: "video",
      duration: 45,
      progress: 0
    },
    modules: [
      {
        id: 1,
        title: "Introdução à Psicopedagogia Clínica",
        progress: 100,
        isUnlocked: true,
        items: [
          {
            id: 101,
            title: "O Papel do Psicopedagogo Clínico",
            type: "video",
            duration: 30,
            progress: 100,
            isCompleted: true
          },
          {
            id: 102,
            title: "História e Evolução da Psicopedagogia",
            type: "pdf",
            duration: 20,
            progress: 100,
            isCompleted: true
          },
          {
            id: 103,
            title: "Fundamentos Teóricos da Psicopedagogia",
            type: "ebook",
            duration: 60,
            progress: 100,
            isCompleted: true
          }
        ]
      },
      {
        id: 2,
        title: "Diagnóstico Psicopedagógico",
        progress: 66,
        isUnlocked: true,
        items: [
          {
            id: 201,
            title: "Instrumentos de Avaliação Psicopedagógica",
            type: "video",
            duration: 45,
            progress: 100,
            isCompleted: true
          },
          {
            id: 202,
            title: "Estudo de Caso: Diagnóstico Psicopedagógico",
            type: "pdf",
            duration: 30,
            progress: 100,
            isCompleted: true
          },
          {
            id: 203,
            title: "Avaliação Psicopedagógica em Contextos Clínicos",
            type: "video",
            duration: 45,
            progress: 0,
            isCompleted: false
          }
        ]
      },
      {
        id: 3,
        title: "Intervenção Psicopedagógica",
        progress: 0,
        isUnlocked: false,
        items: [
          {
            id: 301,
            title: "Estratégias de Intervenção Psicopedagógica",
            type: "video",
            duration: 60,
            progress: 0,
            isCompleted: false
          },
          {
            id: 302,
            title: "Jogos e Materiais para Intervenção",
            type: "pdf",
            duration: 25,
            progress: 0,
            isCompleted: false
          },
          {
            id: 303,
            title: "Intervenção na Dislexia e Discalculia",
            type: "simulado",
            duration: 40,
            progress: 0,
            isCompleted: false
          }
        ]
      },
      {
        id: 4,
        title: "Avaliação e Encerramento",
        progress: 0,
        isUnlocked: false,
        items: [
          {
            id: 401,
            title: "Estudo de Caso Integrador",
            type: "pdf",
            duration: 45,
            progress: 0,
            isCompleted: false
          },
          {
            id: 402,
            title: "Avaliação Final",
            type: "avaliacao",
            duration: 120,
            progress: 0,
            isCompleted: false
          }
        ]
      }
    ],
    forum: {
      totalTopics: 12,
      recentTopics: [
        {
          id: 1,
          title: "Dificuldades na aplicação de testes psicopedagógicos em crianças com TDAH",
          author: "Maria Oliveira",
          date: "2025-04-20T14:30:00",
          replies: 8
        },
        {
          id: 2,
          title: "Como adaptar a intervenção psicopedagógica para adultos?",
          author: "João Silva",
          date: "2025-04-18T10:15:00",
          replies: 5
        },
        {
          id: 3,
          title: "Compartilhando experiência com intervenção na dislexia",
          author: "Carla Santos",
          date: "2025-04-15T16:45:00",
          replies: 12
        }
      ]
    },
    materials: [
      {
        id: 501,
        title: "Manual de Diagnóstico Psicopedagógico",
        type: "pdf",
        size: "2.4 MB",
        date: "2025-03-20"
      },
      {
        id: 502,
        title: "Slides das Aulas - Fundamentos Teóricos",
        type: "pdf",
        size: "1.8 MB",
        date: "2025-03-22"
      },
      {
        id: 503,
        title: "Bibliografia Complementar",
        type: "pdf",
        size: "1.2 MB",
        date: "2025-03-25"
      },
      {
        id: 504,
        title: "Modelos de Relatórios Psicopedagógicos",
        type: "doc",
        size: "850 KB",
        date: "2025-04-10"
      }
    ],
    achievements: [
      {
        id: 601,
        title: "Explorador Iniciante",
        description: "Completou o primeiro módulo da disciplina",
        icon: "Trophy",
        isEarned: true,
        date: "2025-03-30"
      },
      {
        id: 602,
        title: "Leitor Dedicado",
        description: "Acessou todos os materiais de leitura do módulo",
        icon: "BookOpen",
        isEarned: true,
        date: "2025-04-02"
      },
      {
        id: 603,
        title: "Participante Ativo",
        description: "Fez 5 postagens no fórum da disciplina",
        icon: "MessageSquare",
        isEarned: false
      },
      {
        id: 604,
        title: "Especialista em Diagnóstico",
        description: "Completou o módulo de Diagnóstico Psicopedagógico",
        icon: "FileSearch",
        isEarned: false
      }
    ]
  };

  // Consulta para obter os detalhes da disciplina
  const { data: discipline, isLoading, error } = useQuery({
    queryKey: ['/api-json/student/disciplines', disciplineId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api-json/student/disciplines/${disciplineId}`);
        if (!response.ok) {
          // No ambiente de desenvolvimento, retornar dados fictícios
          return disciplineData;
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching discipline details:", error);
        // No ambiente de desenvolvimento, retornar dados fictícios
        return disciplineData;
      }
    }
  });

  // Formatação de data
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  // Formatação de duração
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  // Navegar para o conteúdo específico
  const navigateToContent = (item: any) => {
    if (!item.isCompleted && !discipline?.modules.find(m => m.id === Math.floor(item.id / 100))?.isUnlocked) {
      return; // Não navegar se o módulo estiver bloqueado
    }

    const contentTypeMap = {
      video: `/student/discipline-video/${item.id}`,
      pdf: `/student/discipline-pdf/${item.id}`,
      ebook: `/student/discipline-ebook/${item.id}`,
      simulado: `/student/discipline-simulado/${item.id}`,
      avaliacao: `/student/discipline-avaliacao/${item.id}`
    };

    const route = contentTypeMap[item.type as keyof typeof contentTypeMap];
    if (route) {
      navigate(route);
    }
  };

  // Ícone por tipo de conteúdo
  const getItemIcon = (type: string) => {
    const iconMap = {
      video: <Film className="h-5 w-5" />,
      pdf: <FileText className="h-5 w-5" />,
      ebook: <BookOpen className="h-5 w-5" />,
      simulado: <Book className="h-5 w-5" />,
      avaliacao: <GraduationCap className="h-5 w-5" />
    };

    return iconMap[type as keyof typeof iconMap] || <FileText className="h-5 w-5" />;
  };

  // Retornar a cor do status do item
  const getItemStatusColor = (item: any) => {
    if (item.isCompleted) return "bg-green-100 text-green-800";
    if (item.progress > 0) return "bg-amber-100 text-amber-800";
    return "bg-blue-100 text-blue-800";
  };

  // Retornar o texto do status do item
  const getItemStatusText = (item: any) => {
    if (item.isCompleted) return "Concluído";
    if (item.progress > 0) return "Em progresso";
    return "Não iniciado";
  };

  return (
    <StudentLayout
      title={discipline?.name || "Carregando..."}
      subtitle={discipline?.courseName || "Curso"}
      breadcrumbs={[
        { title: "Home", href: "/student" },
        { title: "Meus Cursos", href: "/student/courses" },
        { title: discipline?.courseName || "Curso", href: `/student/courses/${discipline?.courseId}` },
        { title: discipline?.name || "Disciplina", href: `/student/learning?disciplineId=${disciplineId}` }
      ]}
    >
      {isLoading ? (
        <div className="space-y-6">
          <div className="flex justify-between">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96 mb-8" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
          
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-medium text-red-800 mb-2">Erro ao carregar disciplina</h3>
          <p className="text-red-600">
            Não foi possível carregar os detalhes da disciplina. Por favor, tente novamente mais tarde.
          </p>
          <Button 
            variant="secondary" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Card de progresso */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Progresso da Disciplina</CardTitle>
                <CardDescription>
                  {discipline.completedHours} de {discipline.totalHours} horas concluídas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Progress value={discipline.progress} className="h-2" />
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Status</p>
                      <Badge 
                        variant="outline" 
                        className={
                          discipline.status === "completed" ? "bg-green-50 text-green-700 border-green-200" :
                          discipline.status === "in_progress" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          "bg-gray-50 text-gray-700 border-gray-200"
                        }
                      >
                        {discipline.status === "completed" ? "Concluído" :
                         discipline.status === "in_progress" ? "Em andamento" :
                         "Não iniciado"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-gray-500">Prazo</p>
                      <p className="font-medium">{formatDate(discipline.endDate)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigateToContent(discipline.nextLesson)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Continuar de onde parou
                </Button>
              </CardFooter>
            </Card>
            
            {/* Card de conquistas */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Conquistas</CardTitle>
                <CardDescription>
                  {discipline.achievements.filter(a => a.isEarned).length} de {discipline.achievements.length} conquistas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {discipline.achievements.slice(0, 4).map((achievement) => (
                    <div 
                      key={achievement.id} 
                      className={`flex flex-col items-center p-2 rounded-lg border text-center ${
                        achievement.isEarned 
                          ? 'border-amber-200 bg-amber-50' 
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      {achievement.isEarned ? (
                        <Trophy className="h-8 w-8 text-amber-500 mb-2" />
                      ) : (
                        <Lock className="h-8 w-8 text-gray-400 mb-2" />
                      )}
                      <span className="text-xs font-medium">{achievement.title}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => setActiveTab("conquistas")}
                >
                  Ver todas as conquistas
                </Button>
              </CardFooter>
            </Card>
            
            {/* Card do professor */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Professor</CardTitle>
                <CardDescription>
                  Informações e contato
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={discipline.professorAvatar} alt={discipline.professorName} />
                    <AvatarFallback>{discipline.professorName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{discipline.professorName}</p>
                    <p className="text-sm text-gray-500">Professor(a) da disciplina</p>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fórum da disciplina:</span>
                    <span className="font-medium">{discipline.forum.totalTopics} tópicos</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Materiais disponíveis:</span>
                    <span className="font-medium">{discipline.materials.length} arquivos</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={() => setActiveTab("forum")}
                >
                  Acessar fórum da disciplina
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* Abas de conteúdo */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
              <TabsTrigger value="materiais">Materiais</TabsTrigger>
              <TabsTrigger value="forum">Fórum</TabsTrigger>
              <TabsTrigger value="conquistas">Conquistas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="conteudo" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Conteúdo da Disciplina</CardTitle>
                  <CardDescription>
                    Organize seu aprendizado seguindo a sequência de módulos abaixo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {discipline.modules.map((module, moduleIndex) => (
                      <div key={module.id} className="border rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
                          <div className="flex items-center space-x-2">
                            {module.isUnlocked ? (
                              <CheckCircle className={`h-5 w-5 ${module.progress === 100 ? 'text-green-500' : 'text-blue-500'}`} />
                            ) : (
                              <Lock className="h-5 w-5 text-gray-400" />
                            )}
                            <h3 className="font-medium text-gray-800">
                              Módulo {moduleIndex + 1}: {module.title}
                            </h3>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-2">{module.progress}% concluído</span>
                            <Progress value={module.progress} className="w-24 h-2" />
                          </div>
                        </div>
                        
                        <div className="divide-y">
                          {module.items.map((item) => (
                            <div 
                              key={item.id}
                              className={`flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!module.isUnlocked ? 'opacity-60' : ''}`}
                              onClick={() => module.isUnlocked && navigateToContent(item)}
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-full ${
                                  item.isCompleted 
                                    ? 'bg-green-100' 
                                    : module.isUnlocked ? 'bg-blue-100' : 'bg-gray-100'
                                }`}>
                                  {getItemIcon(item.type)}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800">{item.title}</p>
                                  <div className="flex items-center text-xs text-gray-500 mt-1">
                                    <Clock className="h-3 w-3 mr-1" />
                                    <span>{formatDuration(item.duration)}</span>
                                    <div className="w-1 h-1 rounded-full bg-gray-300 mx-2"></div>
                                    <span className="capitalize">{item.type}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center">
                                <Badge variant="outline" className={getItemStatusColor(item)}>
                                  {getItemStatusText(item)}
                                </Badge>
                                
                                {!module.isUnlocked && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="ml-3">
                                          <Lock className="h-4 w-4 text-gray-400" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Complete o módulo anterior para desbloquear</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="materiais" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Materiais Complementares</CardTitle>
                  <CardDescription>
                    Acesse e baixe os materiais disponibilizados pelo professor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {discipline.materials.map((material) => (
                      <div 
                        key={material.id}
                        className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/student/discipline-pdf/${material.id}`)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full bg-blue-100">
                            {material.type === "pdf" ? (
                              <FileText className="h-5 w-5 text-blue-600" />
                            ) : (
                              <BookOpen className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{material.title}</p>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <span>{material.size}</span>
                              <div className="w-1 h-1 rounded-full bg-gray-300 mx-2"></div>
                              <span>Adicionado em {formatDate(material.date)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Download className="h-4 w-4" />
                          <span className="hidden sm:inline">Baixar</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="forum" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Fórum da Disciplina</CardTitle>
                  <CardDescription>
                    Participe das discussões com colegas e professores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-500">
                      {discipline.forum.totalTopics} tópicos encontrados
                    </p>
                    <Button>Novo Tópico</Button>
                  </div>
                  
                  <div className="space-y-4">
                    {discipline.forum.recentTopics.map((topic) => (
                      <div 
                        key={topic.id}
                        className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex justify-between">
                          <h3 className="font-medium">{topic.title}</h3>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {topic.replies} respostas
                          </Badge>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-2">
                          <span>Por {topic.author}</span>
                          <div className="w-1 h-1 rounded-full bg-gray-300 mx-2"></div>
                          <span>{formatDate(topic.date)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 text-center">
                    <Button variant="link">Ver todos os tópicos</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="conquistas" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Conquistas da Disciplina</CardTitle>
                  <CardDescription>
                    Acompanhe suas conquistas e desbloqueie novas habilidades
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {discipline.achievements.map((achievement) => (
                      <div 
                        key={achievement.id}
                        className={`flex items-center p-4 border rounded-lg ${
                          achievement.isEarned ? 'border-amber-200 bg-amber-50' : 'border-gray-200 opacity-75'
                        }`}
                      >
                        <div className={`p-3 rounded-full ${
                          achievement.isEarned ? 'bg-amber-200' : 'bg-gray-200'
                        } mr-4`}>
                          {achievement.isEarned ? (
                            <Trophy className="h-6 w-6 text-amber-600" />
                          ) : (
                            <Lock className="h-6 w-6 text-gray-500" />
                          )}
                        </div>
                        
                        <div>
                          <h3 className="font-medium">{achievement.title}</h3>
                          <p className="text-sm text-gray-600">{achievement.description}</p>
                          
                          {achievement.isEarned && (
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <BadgeCheck className="h-3 w-3 mr-1 text-green-500" />
                              <span>Conquistado em {formatDate(achievement.date)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </StudentLayout>
  );
}