import { ReactNode, useState } from "react";
import { useLocation, Link } from "wouter";
import { getStudentSidebarItems } from "./student-sidebar-items";
import { Sidebar } from "./sidebar";
import { useAuth } from "@/hooks/use-auth";
import { PageTransition } from "@/components/ui/page-transition";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  title: string;
  href: string;
}

export interface StudentLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
}

export default function StudentLayout({ children, title, subtitle, breadcrumbs }: StudentLayoutProps) {
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
          {/* Breadcrumbs, se fornecidos */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex mb-4 text-sm" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-2">
                {breadcrumbs.map((item, index) => (
                  <li key={index} className="inline-flex items-center">
                    {index > 0 && <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />}
                    {index === breadcrumbs.length - 1 ? (
                      <span className="text-gray-600">{item.title}</span>
                    ) : (
                      <Link href={item.href} className="text-primary hover:text-primary/80">
                        {item.title}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}

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