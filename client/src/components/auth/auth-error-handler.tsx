import { useAuth } from "@/hooks/use-auth";
import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

/**
 * Componente que trata erros de autenticação e redireciona o usuário quando necessário
 * Usado para mostrar uma mensagem amigável quando ocorrem erros 401 (Unauthorized)
 */
export function AuthErrorHandler({ children }: { children: ReactNode }) {
  const { user, isLoading, error } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Se estamos em uma página pública ou de autenticação, não precisamos fazer verificações adicionais
  const isAuthPage = location === "/auth" || location.startsWith("/auth/");
  const isAdminPage = location === "/admin"; // Adicionando /admin como página pública
  const isPortalSelectionPage = location === "/portal-selection"; // Adicionando seletor de portais como página pública
  const isHomePage = location === "/" || location === "";

  useEffect(() => {
    // Se houve um erro de autenticação e não estamos em uma página pública
    if (error && !isAuthPage && !isHomePage && !isAdminPage && !isPortalSelectionPage) {
      toast({
        title: "Sessão expirada",
        description: "Por favor, faça login novamente para continuar.",
        variant: "destructive",
      });
      
      // Redirecionar para página de auth
      setLocation("/auth");
    }
  }, [error, isAuthPage, isHomePage, isAdminPage, isPortalSelectionPage, setLocation, toast]);

  // Caso o usuário esteja tentando acessar uma página protegida sem estar autenticado
  // e não seja uma página pública ou de autenticação
  if (!isLoading && !user && !isAuthPage && !isHomePage && !isAdminPage && !isPortalSelectionPage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-6 space-y-4 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white">
            Acesso restrito
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300">
            Você precisa estar autenticado para acessar esta página.
          </p>
          <div className="flex justify-center space-x-3">
            <Button
              variant="default"
              onClick={() => setLocation("/auth")}
              className="w-full"
            >
              Fazer login
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/")}
              className="w-full"
            >
              Voltar para início
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Durante o carregamento, mostramos um indicador
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600 dark:text-gray-300">Verificando autenticação...</span>
      </div>
    );
  }

  // Se tudo estiver ok, renderizamos os filhos normalmente
  return <>{children}</>;
}