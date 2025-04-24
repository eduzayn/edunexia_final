import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
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

export default function StudentCoursesPage() {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Definir itens da sidebar diretamente
  const sidebarItems = [
    { name: "Dashboard", icon: <DashboardIcon size={18} />, href: "/student/dashboard", active: false },
    { name: "Meus Cursos", icon: <BookOpen size={18} />, href: "/student/courses", active: true },
    { name: "Biblioteca", icon: <BookMarked size={18} />, href: "/student/library", active: false },
    { name: "Credencial", icon: <GraduationCap size={18} />, href: "/student/credencial", active: false },
    { name: "Avaliações", icon: <FileQuestion size={18} />, href: "/student/assessments", active: false },
    { name: "Estágios", icon: <BriefcaseBusiness size={18} />, href: "/student/internships", active: false },
    { name: "Contratos", icon: <Handshake size={18} />, href: "/student/contracts", active: false },
    { name: "Financeiro", icon: <Banknote size={18} />, href: "/student/financial", active: false },
    { name: "Calendário", icon: <Calendar size={18} />, href: "/student/calendar", active: false },
    { name: "Mensagens", icon: <MessagesSquare size={18} />, href: "/student/messages", active: false },
    { name: "Meu Perfil", icon: <User size={18} />, href: "/student/profile", active: false },
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

      {/* Conteúdo principal - será preenchido conforme suas orientações */}
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-4">Meus Cursos</h1>
        <p>Esta página foi redefinida e aguarda novas orientações para implementação.</p>
      </div>
    </div>
  );
}