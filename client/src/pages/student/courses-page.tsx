import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentLayout } from "@/components/layout";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  FileQuestion,
  BriefcaseBusiness,
  Handshake,
  Banknote,
  Calendar,
  MessagesSquare,
  User,
  BookMarked,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Clock,
  BookText,
  CheckCircle2,
  PauseCircle,
  AlertCircle,
  Hourglass,
  ChevronRight,
  Bookmark,
  ThumbsUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// Interface dos cursos do estudante
interface StudentCourse {
  id: number;
  name: string;
  code: string;
  description: string;
  status: string;
  workload: number;
  progress: number;
  enrolledAt: string;
  updatedAt: string;
  imageUrl?: string;
  category?: string;
  instructor?: string;
  nextClass?: string;
  nextDeadline?: string;
}

export default function StudentCoursesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [location] = useLocation();

  // Cursos de exemplo para visualização da interface
  const exampleCourses: StudentCourse[] = [
    {
      id: 1,
      name: "Pedagogia - Segunda Licenciatura",
      code: "PED-2023",
      description: "Curso de Pedagogia para graduados em outras licenciaturas",
      status: "active",
      workload: 1400,
      progress: 65,
      enrolledAt: "2023-10-15T10:00:00",
      updatedAt: "2024-04-10T15:30:00",
      category: "graduation",
      instructor: "Dra. Maria Silva",
      nextDeadline: "30/04/2025"
    },
    {
      id: 2,
      name: "MBA em Gestão Empresarial",
      code: "MBA-2023",
      description: "Pós-graduação em Gestão Empresarial com ênfase em liderança",
      status: "active",
      workload: 420,
      progress: 100,
      enrolledAt: "2023-08-20T10:00:00",
      updatedAt: "2024-03-20T14:20:00",
      category: "postgraduate",
      instructor: "Dr. Carlos Mendes"
    },
    {
      id: 3,
      name: "Inovação e Transformação Digital",
      code: "ITD-2024",
      description: "Curso sobre tecnologias emergentes e transformação de negócios",
      status: "active",
      workload: 80,
      progress: 0,
      enrolledAt: "2024-04-02T10:00:00",
      updatedAt: "2024-04-02T10:00:00",
      category: "extension",
      instructor: "Dr. Roberto Alves",
      nextDeadline: "15/05/2025"
    },
    {
      id: 4,
      name: "Especialização em Educação Inclusiva",
      code: "EEI-2023",
      description: "Curso de especialização para educadores que trabalham com inclusão",
      status: "active",
      workload: 360,
      progress: 42,
      enrolledAt: "2023-09-05T10:00:00",
      updatedAt: "2024-04-05T11:15:00",
      category: "postgraduate",
      instructor: "Dra. Ana Lucia Costa",
      nextDeadline: "10/05/2025"
    },
    {
      id: 5,
      name: "Técnico em Análise de Dados",
      code: "TAD-2024",
      description: "Curso técnico para formação de analistas de dados",
      status: "active",
      workload: 240,
      progress: 22,
      enrolledAt: "2024-02-10T10:00:00",
      updatedAt: "2024-04-08T09:30:00",
      category: "technical",
      instructor: "Me. Paulo Rodrigues"
    },
    {
      id: 6,
      name: "Design Thinking e Metodologias Ágeis",
      code: "DTMA-2023",
      description: "Curso prático sobre metodologias inovadoras para resolução de problemas",
      status: "active",
      workload: 60,
      progress: 100,
      enrolledAt: "2023-11-10T10:00:00",
      updatedAt: "2024-01-15T16:45:00",
      category: "extension",
      instructor: "Me. Juliana Ferraz"
    }
  ];

  // Usar os cursos de exemplo em vez de buscar da API
  const { data: courses = exampleCourses, isLoading } = useQuery<StudentCourse[]>({
    queryKey: ["/api-json/student/courses"],
    staleTime: 1000 * 60 * 5, // 5 minutos
    initialData: exampleCourses, // Usar os dados de exemplo como dados iniciais
    gcTime: 1000 * 60 * 60, // 1 hora
  });

  // Definir itens da sidebar usando o padrão das outras páginas
  const sidebarItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={18} />, href: "/student/dashboard", active: location === "/student/dashboard" },
    { name: "Meus Cursos", icon: <BookOpen size={18} />, href: "/student/courses", active: location === "/student/courses" || location.startsWith("/student/courses/") },
    { name: "Biblioteca", icon: <BookMarked size={18} />, href: "/student/library", active: location === "/student/library" },
    { name: "Credencial", icon: <GraduationCap size={18} />, href: "/student/credencial", active: location === "/student/credencial" },
    { name: "Avaliações", icon: <FileQuestion size={18} />, href: "/student/assessments", active: location === "/student/assessments" },
    { name: "Estágios", icon: <BriefcaseBusiness size={18} />, href: "/student/internships", active: location === "/student/internships" },
    { name: "Contratos", icon: <Handshake size={18} />, href: "/student/contracts", active: location === "/student/contracts" },
    { name: "Financeiro", icon: <Banknote size={18} />, href: "/student/financial", active: location === "/student/financial" },
    { name: "Calendário", icon: <Calendar size={18} />, href: "/student/calendar", active: location === "/student/calendar" },
    { name: "Mensagens", icon: <MessagesSquare size={18} />, href: "/student/messages", active: location === "/student/messages" },
    { name: "Meu Perfil", icon: <User size={18} />, href: "/student/profile", active: location === "/student/profile" },
  ];

  // Filtrar e ordenar os cursos
  const filteredCourses = Array.isArray(courses) 
    ? courses
        .filter((course: StudentCourse) => {
          // Filtrar por texto de busca
          if (searchTerm && !course.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
              !course.code.toLowerCase().includes(searchTerm.toLowerCase()) &&
              !course.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
          }
          
          // Filtrar por status de progresso
          if (activeTab === "in-progress" && (course.progress >= 100 || course.progress === 0)) return false;
          if (activeTab === "completed" && course.progress < 100) return false;
          if (activeTab === "not-started" && course.progress > 0) return false;
          
          // Filtrar por categoria se não for "all"
          if (filterCategory !== "all" && course.category !== filterCategory) return false;
          
          // Filtrar por status do curso
          if (filterStatus !== "all" && course.status !== filterStatus) return false;
          
          return true;
        })
        .sort((a: StudentCourse, b: StudentCourse) => {
          // Aplicar ordenação
          if (sortBy === "name") return a.name.localeCompare(b.name);
          if (sortBy === "progress") return b.progress - a.progress;
          if (sortBy === "recent") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          if (sortBy === "workload") return b.workload - a.workload;
          return 0;
        })
    : [];

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Badge de status para cada curso
  const getStatusBadge = (progress: number) => {
    if (progress === 0) return (
      <Badge variant="outline" className="flex items-center gap-1">
        <PauseCircle size={14} /> Não iniciado
      </Badge>
    );
    if (progress < 100) return (
      <Badge variant="secondary" className="bg-amber-100 text-amber-700 flex items-center gap-1">
        <Hourglass size={14} /> Em andamento
      </Badge>
    );
    return (
      <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
        <CheckCircle2 size={14} /> Concluído
      </Badge>
    );
  };

  // Texto do botão com base no progresso
  const getButtonText = (progress: number) => {
    if (progress === 0) return "Começar";
    if (progress < 100) return "Continuar";
    return "Revisar";
  };

  // Cores para placeholder dos cards
  const getCardColor = (index: number) => {
    const colors = [
      "bg-primary-50 border-primary-200",
      "bg-green-50 border-green-200",
      "bg-purple-50 border-purple-200",
      "bg-amber-50 border-amber-200",
      "bg-blue-50 border-blue-200",
      "bg-pink-50 border-pink-200",
    ];
    return colors[index % colors.length];
  };

  // Marcar curso como favorito
  const handleFavorite = (courseId: number) => {
    toast({
      title: "Curso marcado como favorito",
      description: "Este curso foi adicionado aos seus favoritos.",
    });
  };

  return (
    <StudentLayout title="Meus Cursos" subtitle="Acesse e gerencie todos os seus cursos">
      {/* Tabs de navegação principal */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="all" className="gap-2">
            <BookText size={16} /> Todos
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="gap-2">
            <Hourglass size={16} /> Em andamento
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle2 size={16} /> Concluídos
          </TabsTrigger>
          <TabsTrigger value="not-started" className="gap-2">
            <PauseCircle size={16} /> Não iniciados
          </TabsTrigger>
        </TabsList>

        {/* Filtros e busca */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative md:w-1/3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-3 flex-1 flex-wrap">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-40">
                <div className="flex items-center gap-2">
                  <ArrowUpDown size={16} />
                  <SelectValue placeholder="Ordenar por" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="name">Nome (A-Z)</SelectItem>
                <SelectItem value="progress">Progresso</SelectItem>
                <SelectItem value="workload">Carga horária</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-40">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={16} />
                  <SelectValue placeholder="Categorias" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                <SelectItem value="graduation">Graduação</SelectItem>
                <SelectItem value="postgraduate">Pós-Graduação</SelectItem>
                <SelectItem value="extension">Extensão</SelectItem>
                <SelectItem value="technical">Técnico</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Conteúdo das tabs - Cursos */}
        <TabsContent value={activeTab} className="mt-0">
          {isLoading ? (
            // Skeletons de carregamento
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <Card key={i} className="overflow-hidden border border-gray-200">
                  <div className="h-36 bg-gray-200 animate-pulse" />
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-3 w-full mb-3" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-9 w-24 rounded-md" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            // Estado vazio
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum curso encontrado</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm || filterCategory !== "all" || filterStatus !== "all"
                  ? "Tente ajustar seus filtros de busca para encontrar o curso que procura."
                  : "Você ainda não tem cursos disponíveis nesta categoria."}
              </p>
              {(searchTerm || filterCategory !== "all" || filterStatus !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterCategory("all");
                    setFilterStatus("all");
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            // Grid de cursos
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course: StudentCourse, index: number) => (
                <Card key={course.id} className="overflow-hidden border border-gray-200 transition-all hover:shadow-md">
                  <div className={`h-36 ${getCardColor(index)} relative flex items-center justify-center p-4`}>
                    {course.imageUrl ? (
                      <img 
                        src={course.imageUrl} 
                        alt={course.name} 
                        className="h-full w-full object-cover absolute inset-0" 
                      />
                    ) : (
                      <BookText className="h-16 w-16 text-gray-400" />
                    )}
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="absolute top-2 right-2 bg-white bg-opacity-70 hover:bg-opacity-100"
                      onClick={() => handleFavorite(course.id)}
                    >
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 line-clamp-1">{course.name}</h3>
                    </div>
                    
                    <div className="flex items-center text-gray-500 text-sm mb-1">
                      <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span>Carga horária: {course.workload || 0}h</span>
                    </div>
                    
                    {course.instructor && (
                      <div className="flex items-center text-gray-500 text-sm mb-3">
                        <User className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="line-clamp-1">{course.instructor}</span>
                      </div>
                    )}
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progresso</span>
                        <span className="font-medium">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      {getStatusBadge(course.progress)}
                      <Button
                        size="sm"
                        className="gap-1"
                        asChild
                      >
                        <Link to={`/student/courses/${course.id}`}>
                          {getButtonText(course.progress)}
                          <ChevronRight size={16} />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                  
                  {course.nextDeadline && (
                    <CardFooter className="px-4 py-3 bg-amber-50 border-t border-amber-100">
                      <div className="flex items-center text-amber-700 text-xs w-full">
                        <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span>
                          Próximo prazo: <strong>{course.nextDeadline}</strong>
                        </span>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </StudentLayout>
  );
}