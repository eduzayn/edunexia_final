import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import StudentLayout from "@/components/layout/student-layout";
import { 
  ChevronLeft as ChevronLeftIcon,
  BookOpen,
  Play,
  FileText,
  FileQuestion,
  Video,
  Clock,
  BarChart,
  Download
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ChartIcon,
  SchoolIcon,
  MenuBookIcon,
  EventNoteIcon,
  DescriptionIcon,
  PaymentsIcon,
  HelpOutlineIcon,
  ClockIcon,
  CalendarIcon,
  BookmarkIcon,
  PlayCircleIcon,
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Consulta para obter os detalhes do curso
  const { data: course, isLoading, error } = useQuery({
    queryKey: ['/api-json/student/courses', id],
    queryFn: async () => {
      try {
        const response = await fetch(`/api-json/student/courses/${id}`);
        if (!response.ok) {
          // No ambiente de desenvolvimento, retornar dados fictícios
          return {
            id: parseInt(id || "1"),
            name: "Pós-Graduação em Psicopedagogia Clínica e Institucional",
            progress: 34,
            totalHours: 450,
            completedHours: 153,
            description: "O curso de Pós-Graduação em Psicopedagogia Clínica e Institucional visa formar profissionais capacitados para atuar na identificação, diagnóstico e intervenção em problemas de aprendizagem, tanto em contextos clínicos quanto institucionais.",
            startDate: "2023-02-15",
            endDate: "2024-07-10",
            status: "in_progress",
            coordinator: "Dra. Ana Maria Silva",
            disciplines: [
              {
                id: 1,
                name: "Fundamentos da Psicopedagogia",
                progress: 100,
                status: "completed",
                totalHours: 45,
                resourceCount: {
                  videos: 12,
                  pdfs: 8,
                  ebooks: 2,
                  assessments: 2,
                }
              },
              {
                id: 2,
                name: "Bases Neurobiológicas da Aprendizagem",
                progress: 75,
                status: "in_progress",
                totalHours: 45,
                resourceCount: {
                  videos: 15,
                  pdfs: 10,
                  ebooks: 1,
                  assessments: 2,
                }
              },
              {
                id: 3,
                name: "Avaliação Psicopedagógica",
                progress: 50,
                status: "in_progress",
                totalHours: 60,
                resourceCount: {
                  videos: 18,
                  pdfs: 12,
                  ebooks: 3,
                  assessments: 3,
                }
              },
              {
                id: 4,
                name: "Intervenção Psicopedagógica Clínica",
                progress: 10,
                status: "in_progress",
                totalHours: 60,
                resourceCount: {
                  videos: 20,
                  pdfs: 15,
                  ebooks: 2,
                  assessments: 3,
                }
              },
              {
                id: 5,
                name: "Psicopedagogia Institucional",
                progress: 0,
                status: "not_started",
                totalHours: 45,
                resourceCount: {
                  videos: 14,
                  pdfs: 10,
                  ebooks: 1,
                  assessments: 2,
                }
              },
              {
                id: 6,
                name: "Dificuldades e Transtornos de Aprendizagem",
                progress: 0,
                status: "not_started",
                totalHours: 60,
                resourceCount: {
                  videos: 18,
                  pdfs: 12,
                  ebooks: 2,
                  assessments: 3,
                }
              },
              {
                id: 7,
                name: "Práticas Inclusivas em Educação",
                progress: 0,
                status: "not_started",
                totalHours: 45,
                resourceCount: {
                  videos: 12,
                  pdfs: 8,
                  ebooks: 1,
                  assessments: 2,
                }
              },
              {
                id: 8,
                name: "Ética e Legislação na Atuação Psicopedagógica",
                progress: 0,
                status: "not_started",
                totalHours: 30,
                resourceCount: {
                  videos: 8,
                  pdfs: 6,
                  ebooks: 1,
                  assessments: 1,
                }
              },
              {
                id: 9,
                name: "Trabalho de Conclusão de Curso",
                progress: 0,
                status: "not_started",
                totalHours: 60,
                resourceCount: {
                  videos: 5,
                  pdfs: 10,
                  ebooks: 3,
                  assessments: 1,
                }
              }
            ]
          };
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching course details:", error);
        throw error;
      }
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Concluído</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Em Andamento</Badge>;
      case "not_started":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Não Iniciado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <StudentLayout
      title={course?.name || "Detalhes do Curso"}
      subtitle="Acesse todas as disciplinas e conteúdos do seu curso"
      breadcrumbs={[
        { title: "Home", href: "/student" },
        { title: "Meus Cursos", href: "/student/courses" },
        { title: course?.name || "Detalhes do Curso", href: `/student/courses/${id}` }
      ]}
      backButton={{
        label: "Voltar para Meus Cursos",
        href: "/student/courses"
      }}
    >
      {isLoading ? (
        <>
          <Skeleton className="h-8 w-2/3 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
        </>
      ) : error ? (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Erro ao carregar curso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              Não foi possível carregar os detalhes do curso. Por favor, tente novamente mais tarde.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <>
          {/* Cards de informações rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Progresso do Curso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-bold">{course.progress}%</div>
                  <div className="text-sm text-gray-500">{course.completedHours}/{course.totalHours} horas</div>
                </div>
                <Progress value={course.progress} className="h-2 mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-500">Início:</span>
                    <span className="text-sm font-medium">{formatDate(course.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Término:</span>
                    <span className="text-sm font-medium">{formatDate(course.endDate)}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm">Carga horária: {course.totalHours}h</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col">
                  <div className="mb-2">
                    {getStatusBadge(course.status)}
                  </div>
                  
                  <div className="mt-1">
                    <div className="text-sm text-gray-600 mb-1">Coordenador(a)</div>
                    <div className="font-medium">{course.coordinator}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Seção: Sobre o Curso */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Sobre o Curso</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-600">
                  {course.description}
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Seção: Disciplinas */}
          <div>
            <h2 className="text-xl font-bold mb-4">Disciplinas</h2>
            <div className="space-y-4">
              {course.disciplines.map((discipline) => (
                <Card
                  key={discipline.id}
                  className={`overflow-hidden transition-shadow hover:shadow-md ${
                    discipline.status === 'completed' 
                      ? 'border-green-100' 
                      : discipline.status === 'in_progress' 
                        ? 'border-blue-100' 
                        : ''
                  }`}
                >
                  <div className={`h-1 w-full ${
                    discipline.status === 'completed' 
                      ? 'bg-green-500' 
                      : discipline.status === 'in_progress' 
                        ? 'bg-blue-500' 
                        : 'bg-gray-200'
                  }`}></div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{discipline.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{discipline.totalHours}h</span>
                        {getStatusBadge(discipline.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm text-gray-600">Progresso: {discipline.progress}%</span>
                      <span className="text-xs text-gray-500">
                        {discipline.status === "completed" 
                          ? "Concluído" 
                          : discipline.status === "in_progress" 
                            ? "Em andamento" 
                            : "Não iniciado"}
                      </span>
                    </div>
                    <Progress value={discipline.progress} className="h-1.5" />
                    
                    <div className="mt-3 flex flex-wrap gap-2">
                      <div className="flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        <Video className="h-3.5 w-3.5 mr-1 text-gray-500" />
                        <span>{discipline.resourceCount.videos} vídeos</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        <FileText className="h-3.5 w-3.5 mr-1 text-gray-500" />
                        <span>{discipline.resourceCount.pdfs} PDFs</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        <BookOpen className="h-3.5 w-3.5 mr-1 text-gray-500" />
                        <span>{discipline.resourceCount.ebooks} e-books</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        <FileQuestion className="h-3.5 w-3.5 mr-1 text-gray-500" />
                        <span>{discipline.resourceCount.assessments} avaliações</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 pb-4">
                    <div className="w-full">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setLocation(`/student/learning?disciplineId=${discipline.id}`)}
                      >
                        {discipline.status === "completed" 
                          ? "Revisar Conteúdo" 
                          : discipline.status === "in_progress" 
                            ? "Continuar Estudando" 
                            : "Começar Agora"}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </StudentLayout>
  );
}