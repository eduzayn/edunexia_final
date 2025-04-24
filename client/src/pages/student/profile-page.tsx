import React, { useState } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from 'wouter';
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
  Mail,
  Phone,
  MapPin,
  BadgeCheck,
  Edit
} from 'lucide-react';
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function StudentProfilePage() {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Definir itens da sidebar diretamente (sem depender do componente obsoleto)
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

  // Dados de exemplo para o perfil
  const userProfile = {
    fullName: user?.fullName || "Administrador",
    email: user?.email || "admin@edunexa.com",
    phone: "(11) 98765-4321",
    address: "Rua das Flores, 123",
    city: "São Paulo",
    state: "SP",
    zipCode: "01234-567",
    enrollmentDate: "10/01/2023",
    status: "Ativo",
    institution: "Edunexa",
    tags: ["Aluno", "Graduação", "EAD"]
  };

  // Obter iniciais para o avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
            <p className="text-gray-600">Visualize e gerencie suas informações pessoais</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Coluna da esquerda - Informações básicas */}
            <Card className="md:col-span-1">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4">
                  <Avatar className="h-24 w-24 mx-auto">
                    <AvatarFallback className="bg-primary text-white text-xl">
                      {getInitials(userProfile.fullName)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle>{userProfile.fullName}</CardTitle>
                <CardDescription>
                  <Badge variant="outline" className="mt-1">
                    {user?.portalType === 'admin' ? 'Administrador' : 'Aluno'}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail size={16} className="text-gray-500" />
                    <span>{userProfile.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone size={16} className="text-gray-500" />
                    <span>{userProfile.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin size={16} className="text-gray-500" />
                    <span>{`${userProfile.address}, ${userProfile.city}/${userProfile.state}`}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <BadgeCheck size={16} className="text-gray-500" />
                    <span>Matrícula desde {userProfile.enrollmentDate}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <Edit size={16} className="mr-2" /> Editar Perfil
                </Button>
              </CardFooter>
            </Card>
            
            {/* Coluna da direita - Informações adicionais */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Informações Acadêmicas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Instituição</h3>
                    <p>{userProfile.institution}</p>
                    <Separator className="my-3" />
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
                    <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                      {userProfile.status}
                    </Badge>
                    <Separator className="my-3" />
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Categorias</h3>
                    <div className="flex flex-wrap gap-2">
                      {userProfile.tags.map(tag => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Separator className="my-3" />
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Segurança</h3>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm">
                        Alterar Senha
                      </Button>
                      <p className="text-xs text-gray-500 mt-1">
                        Sua senha foi atualizada pela última vez há 30 dias
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}