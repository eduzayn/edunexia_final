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
  User
} from 'lucide-react';
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudentMessagesPage() {
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
            <h1 className="text-2xl font-bold text-gray-900">Mensagens</h1>
            <p className="text-gray-600">Gerencie suas mensagens e comunicações</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Central de Mensagens</CardTitle>
              <CardDescription>
                Gerencie suas mensagens e comunicações.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Nenhuma mensagem disponível no momento.</p>
              <p className="text-sm text-muted-foreground mt-4">
                Esta página está em desenvolvimento. Em breve você poderá acessar suas mensagens aqui.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}