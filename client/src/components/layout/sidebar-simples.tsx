import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { SchoolIcon } from "@/components/ui/icons";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";
import { Menu, X, LogOut, Home, BookOpen, Badge, Calendar, FileText, BookMarked, Mail, DollarSign, HelpCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarItem, SidebarItemOrCategory, isCategory } from "./admin-sidebar-items";

// Interface para as propriedades do componente Sidebar
interface SidebarProps {
  items: SidebarItemOrCategory[];
  user: User | null;
  portalType: string;
  portalColor: string;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

// Mapeamento de rótulos para os diferentes tipos de portal
const portalTypeLabels = {
  student: "Portal do Aluno",
  partner: "Portal do Parceiro",
  polo: "Portal do Polo",
  admin: "Portal Administrativo",
};

export function Sidebar({
  items,
  user,
  portalType,
  portalColor,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: SidebarProps) {
  const { logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const [currentPath, setCurrentPath] = useState("");

  // Atualizar o caminho atual quando a página mudar
  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  // Função para lidar com o logout
  const handleLogout = async () => {
    try {
      console.log("Iniciando logout do sidebar");
      await logoutMutation.mutateAsync();
      
      console.log("Logout bem-sucedido, redirecionando para seleção de portal");
      
      // Adicionamos um pequeno atraso para garantir que o logout seja processado
      setTimeout(() => {
        navigate("/portal-selection");
        window.location.href = "/portal-selection"; // Fallback
      }, 300);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };
  
  // Função para obter as iniciais do usuário para exibir no avatar
  const getUserInitials = (fullName: string | undefined): string => {
    if (!fullName) return "U";
    
    const names = fullName.split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Obter o rótulo correspondente ao tipo de portal
  const portalLabel = (portalType && portalTypeLabels[portalType as keyof typeof portalTypeLabels]) || "Portal";
  
  // Ícones para cada item do menu (baseado na imagem fornecida)
  const getIconForItem = (name: string) => {
    const icons = {
      "Dashboard": <Home className="h-5 w-5" />,
      "Meus Cursos": <BookOpen className="h-5 w-5" />,
      "Credencial": <Badge className="h-5 w-5" />,
      "Calendário": <Calendar className="h-5 w-5" />,
      "Documentos": <FileText className="h-5 w-5" />,
      "Biblioteca": <BookMarked className="h-5 w-5" />,
      "Secretaria": <Mail className="h-5 w-5" />,
      "Financeiro": <DollarSign className="h-5 w-5" />,
      "Suporte": <HelpCircle className="h-5 w-5" />
    };
    
    return icons[name as keyof typeof icons] || <Home className="h-5 w-5" />;
  };

  // Renderização de um item do menu
  const renderMenuItem = (item: SidebarItem, closeOnClick = false) => {
    const isActive = item.active || currentPath === item.href;
    return (
      <Link 
        key={item.name} 
        href={item.href}
        className={`flex items-center px-6 py-3 transition-all duration-150 ${
          isActive
            ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-500 font-medium'
            : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600 border-l-4 border-transparent'
        }`}
        onClick={closeOnClick ? () => setIsMobileMenuOpen(false) : undefined}
      >
        <span className="mr-3">
          {getIconForItem(item.name)}
        </span>
        {item.name}
      </Link>
    );
  };

  return (
    <>
      {/* Desktop Sidebar - Estilo simplificado conforme imagem */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-100 hidden md:block">
        <div className="p-5 border-b border-gray-100">
          <Link href="/" className="flex items-center">
            <SchoolIcon className="h-6 w-6 mr-2 text-blue-600" />
            <span className="text-xl font-bold text-gray-800">EdunexIA</span>
          </Link>
        </div>
        
        <div className="py-4">
          <div className="flex items-center px-6 py-3 border-b border-gray-100 mb-4">
            <Avatar className="w-10 h-10 mr-3 bg-blue-100 text-blue-600">
              <AvatarFallback>{getUserInitials(user?.fullName)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-gray-800">{user?.fullName || "Usuário"}</h3>
              <p className="text-xs text-gray-500">{portalLabel}</p>
            </div>
          </div>
          
          <nav className="space-y-1">
            {items.map((item, index) => {
              // Ignoramos categorias e renderizamos apenas itens simples
              if (!isCategory(item)) {
                return renderMenuItem(item);
              }
              return null;
            })}
          </nav>
        </div>
        
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-100">
          <Button
            variant="ghost"
            className="flex items-center w-full justify-start text-gray-500 hover:text-blue-600"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="mr-3 h-5 w-5" />
            {logoutMutation.isPending ? "Saindo..." : "Sair"}
          </Button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white z-10 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5 text-blue-600" />
          </Button>
          
          <Link href="/" className="flex items-center">
            <SchoolIcon className="h-5 w-5 mr-2 text-blue-600" />
            <span className="text-lg font-bold text-gray-800">EdunexIA</span>
          </Link>
          
          <Avatar className="w-8 h-8 bg-blue-100 text-blue-600">
            <AvatarFallback>{getUserInitials(user?.fullName)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      
      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className="w-64 h-full bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <Link href="/" className="flex items-center">
                <SchoolIcon className="h-6 w-6 mr-2 text-blue-600" />
                <span className="text-xl font-bold text-gray-800">EdunexIA</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-blue-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex items-center px-4 py-3 border-b border-gray-100 mb-4">
              <Avatar className="w-10 h-10 mr-3 bg-blue-100 text-blue-600">
                <AvatarFallback>{getUserInitials(user?.fullName)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-gray-800">{user?.fullName || "Usuário"}</h3>
                <p className="text-xs text-gray-500">{portalLabel}</p>
              </div>
            </div>
            
            <nav className="space-y-1">
              {items.map((item, index) => {
                if (!isCategory(item)) {
                  return renderMenuItem(item, true);
                }
                return null;
              })}
            </nav>
            
            <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-gray-100">
              <Button
                variant="ghost"
                className="flex w-full items-center justify-start text-gray-500 hover:text-blue-600"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="mr-3 h-5 w-5" />
                {logoutMutation.isPending ? "Saindo..." : "Sair"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}