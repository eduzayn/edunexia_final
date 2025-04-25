import { ReactNode } from "react";
import { useLocation } from "wouter";
import { getAdminSidebarItems, SidebarItemOrCategory } from "./admin-sidebar-items";
import { Sidebar } from "./sidebar";
import { useAuth } from "@/hooks/use-auth";
import { PageTransition } from "@/components/ui/page-transition";
import { useState } from "react";
import { ExtendedUser } from "@/types/user";

export interface AdminLayoutProps {
  children: ReactNode;
  sidebarItems?: SidebarItemOrCategory[];
  title?: string;
  subtitle?: string;
}

export default function AdminLayout({ children, sidebarItems, title, subtitle }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth() as { user: ExtendedUser | null };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Verificar se o usuário tem permissão para acessar o portal admin
  if (!user || user.portalType !== "admin") {
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

  // Usar os itens da barra lateral fornecidos ou gerar com base na rota atual
  const items = sidebarItems || getAdminSidebarItems(location);

  return (
    <div className="flex h-screen bg-background">
      {/* Barra lateral */}
      <Sidebar 
        items={items} 
        user={user}
        portalType="admin"
        portalColor="#4CAF50" 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      
      {/* Conteúdo principal */}
      <div className="flex-1 overflow-auto">
        <main>
          {title && (
            <div className="px-6 py-4 border-b">
              <h1 className="text-2xl font-bold">{title}</h1>
              {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
            </div>
          )}
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}