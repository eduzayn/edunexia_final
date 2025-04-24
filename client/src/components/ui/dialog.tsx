import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
// Importar função de remoção segura
import { safeRemoveChild } from "../../dom-fixes"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  // Estado para controlar o tempo de montagem/desmontagem
  const [mounted, setMounted] = React.useState(false);
  // Referência para verificar se o componente está montado
  const mountedRef = React.useRef(true);
  
  // Referência para o nó do content para usar nossa função segura
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  
  // Efeito para corrigir problemas de montagem/desmontagem no Chrome
  React.useEffect(() => {
    // Obter referência para o elemento diretamente
    if (ref && typeof ref === 'object' && ref.current) {
      contentRef.current = ref.current;
    }
    
    // Usar requestAnimationFrame em vez de setTimeout para maior sincronização com o navegador
    const frameId = requestAnimationFrame(() => {
      if (mountedRef.current) {
        setMounted(true);
      }
    });
    
    // Função de limpeza para prevenir vazamentos de memória e erros de DOM
    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(frameId);
      
      // Usar safeRemoveChild para remover elementos com segurança
      if (contentRef.current && contentRef.current.parentNode) {
        // Usar nossa função segura em vez de removeChild diretamente
        safeRemoveChild(contentRef.current.parentNode, contentRef.current);
      }
    };
  }, []);
  
  // Função segura para lidar com fechamento de diálogo
  const handleCloseAutoFocus = React.useCallback((e: Event) => {
    // Prevenir problemas de foco que podem causar erros no Chrome
    e.preventDefault();
    
    // Usar requestAnimationFrame para garantir que a operação DOM ocorre no momento correto do ciclo de renderização
    requestAnimationFrame(() => {
      // Verificar se o componente ainda está montado
      if (mountedRef.current) {
        try {
          // Tentar focar em algum elemento seguro
          document.body.focus();
        } catch (err) {
          console.log("Erro ao mudar foco:", err);
        }
      }
    });
  }, []);
  
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className
        )}
        onCloseAutoFocus={handleCloseAutoFocus}
        onOpenAutoFocus={(e) => {
          // Prevenir problemas de foco que podem causar erros no Chrome
          e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          // Em alguns navegadores, clicar fora do diálogo pode causar problemas
          // Este tratamento adicional garante que o evento é tratado corretamente
          if (!mountedRef.current) {
            e.preventDefault();
          }
        }}
        {...props}
      >
        {/* Renderizar o conteúdo apenas quando o componente estiver montado para evitar erros de DOM */}
        {mounted && children}
        <DialogPrimitive.Close 
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          onClick={(e) => {
            // Tratamento adicional para evitar erros de DOM ao fechar
            if (!mountedRef.current) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
