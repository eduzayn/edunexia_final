import { Button } from "@/components/ui/button";
import { AccessibleDialog } from "@/components/ui/accessible-dialog";

/**
 * Exemplo de uso do componente AccessibleDialog
 * Este componente demonstra como utilizar o diálogo acessível que resolve os warnings do Radix UI
 */
export function DialogExample() {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">Exemplos de Diálogos Acessíveis</h2>
      
      {/* Exemplo 1: Diálogo com título visível */}
      <div className="border p-4 rounded-md">
        <h3 className="text-lg font-semibold mb-2">Exemplo 1: Título visível</h3>
        <AccessibleDialog
          title="Configurações da conta"
          description="Gerencie as configurações da sua conta"
          showTitle={true}
          showDescription={true}
          trigger={<Button variant="default">Abrir diálogo com título visível</Button>}
        >
          <div className="py-4">
            <p>Este é um exemplo de diálogo com título e descrição visíveis.</p>
            <p className="mt-2">O componente AccessibleDialog garante que o diálogo seja acessível para tecnologias assistivas.</p>
          </div>
        </AccessibleDialog>
      </div>
      
      {/* Exemplo 2: Diálogo com título invisível (apenas para leitores de tela) */}
      <div className="border p-4 rounded-md">
        <h3 className="text-lg font-semibold mb-2">Exemplo 2: Título invisível</h3>
        <AccessibleDialog
          title="Upload de imagem"
          description="Faça upload de uma imagem do seu dispositivo"
          showTitle={false}
          showDescription={false}
          trigger={<Button variant="outline">Abrir diálogo com título invisível</Button>}
        >
          <div className="py-4">
            <h3 className="text-xl font-bold">Envie sua imagem</h3>
            <p className="mt-2">
              Este diálogo tem um título visualmente oculto, mas acessível 
              para leitores de tela, resolvendo o warning do Radix UI.
            </p>
          </div>
        </AccessibleDialog>
      </div>
    </div>
  );
}