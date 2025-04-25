import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CalendarIcon,
  ClockIcon,
  MenuBookIcon,
  WavingHandIcon,
  TrendingUpIcon,
  AssignmentIcon,
  GroupIcon,
  SchoolIcon,
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sidebar } from "@/components/layout/sidebar";
import { Link } from "wouter";
import {
  LayoutDashboard as DashboardIcon,
  BookOpen,
  GraduationCap,
  FileQuestion,
  BriefcaseBusiness,
  Handshake,
  Banknote,
  Calendar,
  MessagesSquare,
  User,
  BookMarked
} from "lucide-react";

// Interface para os cursos no dashboard
interface DashboardCourse {
  id: number;
  code: string;
  name: string;
  description: string;
  status: string;
  workload: number;
  thumbnail?: string;
  progress: number;
  enrolledAt: string;
  updatedAt: string;
}

// Interface para o dashboard
interface StudentDashboardData {
  studentInfo: {
    totalCourses: number;
    coursesInProgress: number;
    coursesNotStarted: number;
    pendingActivities: number;
  };
  courses: DashboardCourse[];
  upcomingEvents: {
    title: string;
    date: string;
    time: string;
  }[];
  announcements: {
    title: string;
    content: string;
    date: string;
  }[];
}

// Função auxiliar para calcular o progresso médio de todos os cursos
const calculateOverallProgress = (courses: DashboardCourse[]): number => {
  if (!courses || courses.length === 0) return 0;
  
  const totalProgress = courses.reduce((sum: number, course: DashboardCourse) => sum + (course.progress || 0), 0);
  return Math.round(totalProgress / courses.length);
};

// Função para gerar cores com base no nome do curso
const getColorForCourse = (courseName: string): string => {
  if (!courseName) return "bg-primary-light";
  
  // Gerar um código de cor simples baseado no nome do curso
  const hash = courseName.split('').reduce((acc: number, char: string) => char.charCodeAt(0) + acc, 0);
  
  const colors = [
    "bg-primary-light", // Azul principal
    "bg-green-200",     // Verde
    "bg-orange-200",    // Laranja
    "bg-purple-200",    // Roxo
    "bg-red-200",       // Vermelho
    "bg-yellow-200",    // Amarelo
    "bg-blue-200",      // Azul claro
    "bg-indigo-200",    // Índigo
    "bg-pink-200"       // Rosa
  ];
  
  return colors[hash % colors.length];
};

export function StudentDashboard() {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: dashboardData, isLoading } = useQuery<StudentDashboardData>({
    queryKey: ["/api-json/dashboard/student"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Definir itens da sidebar igual ao modelo do portal do polo
  const sidebarItems = [
    { name: "Dashboard", icon: <DashboardIcon size={18} />, href: "/student/dashboard", active: true },
    { name: "Meus Cursos", icon: <BookOpen size={18} />, href: "/student/courses" },
    { name: "Biblioteca", icon: <BookMarked size={18} />, href: "/student/library" },
    { name: "Credencial", icon: <GraduationCap size={18} />, href: "/student/credencial" },
    { name: "Avaliações", icon: <FileQuestion size={18} />, href: "/student/assessments" },
    { name: "Estágios", icon: <BriefcaseBusiness size={18} />, href: "/student/internships" },
    { name: "Contratos", icon: <Handshake size={18} />, href: "/student/contracts" },
    { name: "Financeiro", icon: <Banknote size={18} />, href: "/student/financial" },
    { name: "Calendário", icon: <Calendar size={18} />, href: "/student/calendar" },
    { name: "Mensagens", icon: <MessagesSquare size={18} />, href: "/student/messages" },
    { name: "Meu Perfil", icon: <User size={18} />, href: "/student/profile" },
  ];

  // Calcular dados derivados
  const courses: DashboardCourse[] = dashboardData?.courses || [];
  const courseCount = courses.length;
  const coursesInProgress = dashboardData?.studentInfo?.coursesInProgress || 0;
  const coursesNotStarted = dashboardData?.studentInfo?.coursesNotStarted || 0;
  const pendingActivities = dashboardData?.studentInfo?.pendingActivities || 0;
  const overallProgress = calculateOverallProgress(courses);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        items={sidebarItems}
        user={user}
        portalType="student"
        portalColor="#0891B2"
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="flex-1 overflow-auto">
        <div className="px-4 py-20 md:py-6 md:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard do Aluno</h1>
            <p className="text-gray-600">Bem-vindo(a) de volta{user ? `, ${user.fullName}` : ''}! Aqui está um resumo da sua conta.</p>
          </div>
          
          {/* Welcome Card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="hidden sm:flex w-12 h-12 rounded-full bg-green-100 items-center justify-center mr-4">
                  <WavingHandIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Olá, {user?.fullName?.split(' ')[0] || 'Aluno'}!</h2>
                  {isLoading ? (
                    <div className="text-gray-600">
                      <Skeleton className="h-4 w-52 mt-1" />
                    </div>
                  ) : (
                    <div className="text-gray-600">
                      {pendingActivities > 0 
                        ? `Você tem ${pendingActivities} atividade${pendingActivities > 1 ? 's' : ''} pendente${pendingActivities > 1 ? 's' : ''} essa semana.`
                        : 'Não há atividades pendentes para essa semana.'}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-500 text-sm font-medium">Progresso Geral</h3>
                  <TrendingUpIcon className="text-primary h-5 w-5" />
                </div>
                {isLoading ? (
                  <div className="loading-content">
                    <Skeleton className="h-6 w-16 mb-2" />
                    <Skeleton className="h-2.5 w-full rounded-full" />
                  </div>
                ) : (
                  <div className="loaded-content">
                    <p className="text-2xl font-bold text-gray-900">{overallProgress}%</p>
                    <Progress value={overallProgress} className="h-2.5 mt-2" />
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-500 text-sm font-medium">Cursos Ativos</h3>
                  <SchoolIcon className="text-green-600 h-5 w-5" />
                </div>
                {isLoading ? (
                  <div className="loading-content">
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-4 w-48 mt-2" />
                  </div>
                ) : (
                  <div className="loaded-content">
                    <p className="text-2xl font-bold text-gray-900">{courseCount} curso{courseCount !== 1 ? 's' : ''}</p>
                    <p className="text-gray-600 text-sm mt-2">
                      {coursesInProgress > 0 ? `${coursesInProgress} em andamento` : ''} 
                      {coursesInProgress > 0 && coursesNotStarted > 0 ? ', ' : ''}
                      {coursesNotStarted > 0 ? `${coursesNotStarted} não iniciado${coursesNotStarted > 1 ? 's' : ''}` : ''}
                      {coursesInProgress === 0 && coursesNotStarted === 0 ? 'Nenhum curso ativo' : ''}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-500 text-sm font-medium">Próximo Vencimento</h3>
                  <CalendarIcon className="text-orange-500 h-5 w-5" />
                </div>
                {isLoading ? (
                  <div className="loading-content">
                    <Skeleton className="h-6 w-28 mb-2" />
                    <Skeleton className="h-4 w-32 mt-2" />
                  </div>
                ) : (
                  <div className="loaded-content">
                    <p className="text-2xl font-bold text-gray-900">-</p>
                    <p className="text-gray-600 text-sm mt-2">Sem vencimentos próximos</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Courses Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Meus Cursos</h2>
              <Link href="/student/courses">
                <Button variant="link" className="text-sm text-primary">Ver todos</Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <Card key={i}>
                    <div className="h-36 bg-gray-200 animate-pulse" />
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-40 mb-1" />
                      <Skeleton className="h-4 w-32 mb-3" />
                      <Skeleton className="h-2 w-full mb-3" />
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : courses.length > 0 ? (
                courses.map((course) => (
                  <Card key={course.id} className="overflow-hidden">
                    <div className={`h-36 ${getColorForCourse(course.name)} flex items-center justify-center`}>
                      <MenuBookIcon className="h-16 w-16 text-white" />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium text-gray-900 mb-1">{course.name}</h3>
                      <div className="flex items-center text-gray-500 text-sm mb-3">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>Carga: {course.workload || 0} horas</span>
                      </div>
                      <Progress value={course.progress || 0} className="h-2 mb-3" />
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {course.progress === 0
                            ? "Não iniciado"
                            : course.progress === 100
                            ? "Concluído"
                            : `Progresso: ${course.progress}%`}
                        </span>
                        <Link href={`/student/courses/${course.id}`}>
                          <Button variant="link" className="p-0 h-auto text-primary">
                            {course.progress === 0 ? "Começar" : "Continuar"}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-3 text-center py-10">
                  <p className="text-gray-500">Você ainda não está matriculado em nenhum curso.</p>
                  <Link href="/cursos">
                    <Button variant="outline" className="mt-4">Ver cursos disponíveis</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Calendar & Announcements */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>Próximos Eventos</CardTitle>
                  <Link href="/student/calendar">
                    <Button variant="link" className="text-sm text-primary p-0">Ver calendário</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex items-start mb-4">
                      <Skeleton className="h-10 w-10 rounded flex-shrink-0 mr-4" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-48 mb-1" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  ))
                ) : dashboardData?.upcomingEvents?.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.upcomingEvents.map((event, index) => (
                      <div key={index} className="flex items-start border-l-4 border-primary pl-4 py-1">
                        <div className="w-10 h-10 rounded bg-primary-light/20 flex items-center justify-center mr-4 flex-shrink-0">
                          <CalendarIcon className="text-primary h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{event.title}</h3>
                          <p className="text-gray-500 text-sm">{event.date}, {event.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Não há eventos agendados para os próximos dias.</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Avisos</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="mb-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0 last:mb-0">
                      <Skeleton className="h-5 w-48 mb-1" />
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  ))
                ) : dashboardData?.announcements?.length > 0 ? (
                  <div className="notification-container">
                    <ScrollArea className="h-[240px] pr-4">
                      <div className="space-y-4">
                        {dashboardData.announcements.map((announcement, index) => (
                          <div key={index} className="pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                            <h3 className="font-medium text-gray-900 mb-1">{announcement.title}</h3>
                            <p className="text-gray-600 text-sm mb-1">{announcement.content}</p>
                            <p className="text-gray-500 text-xs">{announcement.date}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Não há avisos no momento.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}