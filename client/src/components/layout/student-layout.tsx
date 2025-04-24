import { ReactNode, useState } from "react";
import { useLocation } from "wouter";
import { getStudentSidebarItems } from "./student-sidebar-items";
import { Sidebar } from "./sidebar";
import { useAuth } from "@/hooks/use-auth";
import { PageTransition } from "@/components/ui/page-transition";

export interface StudentLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function StudentLayout({ children, title, subtitle }: StudentLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Verificar se o usuário tem permissão para acessar o portal do aluno
  if (!user || user.portalType !== "student") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-4">
            Você não tem permissão para acessar esta área.
          </p>
        </div>
      </div>
    );
  }

  const sidebarItems = getStudentSidebarItems(location);

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

      <div className="flex-1 overflow-auto">
        <div className="px-4 py-20 md:py-6 md:px-8">
          {/* Header com título e subtítulo, se fornecidos */}
          {(title || subtitle) && (
            <div className="mb-6">
              {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
              {subtitle && <p className="text-gray-600">{subtitle}</p>}
            </div>
          )}

          {/* Conteúdo principal */}
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </div>
    </div>
  );
}