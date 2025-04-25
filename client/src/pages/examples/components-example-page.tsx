import { DialogExample } from "@/components/examples/dialog-example";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

/**
 * Página de exemplo para demonstrar os componentes criados
 * Esta página permite testar tanto o AuthErrorHandler quanto o AccessibleDialog
 */
export default function ComponentsExamplePage() {
  const { logoutMutation } = useAuth();
  
  const simulateAuthError = () => {
    // Fazer logout para simular um erro de autenticação
    logoutMutation.mutate();
  };
  
  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Página de Exemplos de Componentes</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="border rounded-lg p-6 bg-white shadow-md dark:bg-gray-800">
          <h2 className="text-2xl font-bold mb-4">Teste de Erros de Autenticação</h2>
          <p className="mb-4">
            Clique no botão abaixo para simular um erro de autenticação.
            O componente AuthErrorHandler vai interceptar o erro e mostrar
            uma mensagem amigável, redirecionando para a página de login.
          </p>
          <Button 
            variant="destructive" 
            onClick={simulateAuthError}
            className="mt-4"
          >
            Simular Erro de Autenticação
          </Button>
        </div>
        
        <div className="border rounded-lg p-6 bg-white shadow-md dark:bg-gray-800">
          <h2 className="text-2xl font-bold mb-4">Teste de Diálogos Acessíveis</h2>
          <p className="mb-4">
            Os exemplos abaixo demonstram como utilizar o componente AccessibleDialog 
            para criar diálogos que são acessíveis e não geram avisos no console.
          </p>
          <DialogExample />
        </div>
      </div>
    </div>
  );
}