import * as React from "react"
import { type DialogProps } from "@radix-ui/react-dialog"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"

/**
 * Wrapper para lidar com erros de manipulação do DOM no Chrome
 * Especificamente o erro "Failed to execute 'removeChild' on 'Node'"
 */
class ChromeErrorBoundary extends React.Component<
  { 
    children: React.ReactNode,
    fallback?: React.ReactNode
  }, 
  { 
    hasError: boolean,
    retry: number
  }
> {
  constructor(props: { children: React.ReactNode, fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, retry: 0 };
  }

  static getDerivedStateFromError() {
    // Atualiza o estado para que a próxima renderização mostre a UI alternativa
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Registra o erro
    console.warn("ChromeErrorBoundary capturou um erro:", error);
    
    // Se for o erro específico de removeChild do Chrome, tenta novamente
    if (error instanceof Error && 
        error.message.includes("removeChild") && 
        this.state.retry < 3) {
      setTimeout(() => {
        this.setState(prevState => ({ 
          hasError: false,
          retry: prevState.retry + 1
        }));
      }, 50 * (this.state.retry + 1)); // Aumenta o tempo de espera a cada retry
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <ChromeErrorBoundary>
    <CommandPrimitive
      ref={ref}
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
        className
      )}
      {...props}
    />
  </ChromeErrorBoundary>
))
Command.displayName = CommandPrimitive.displayName

interface CommandDialogProps extends DialogProps {}

// Função para retornar um componente com um delay de montagem/desmontagem
function withDelayedRender<T extends object>(
  Component: React.ComponentType<T>, 
  mountDelay = 10, 
  unmountDelay = 100
) {
  return (props: T & { open?: boolean, children?: React.ReactNode }) => {
    const [isMounted, setIsMounted] = React.useState(false);
    const [shouldRender, setShouldRender] = React.useState(false);
    const [isClosing, setIsClosing] = React.useState(false);
    
    React.useEffect(() => {
      let mountTimer: NodeJS.Timeout;
      let unmountTimer: NodeJS.Timeout;
      
      if (props.open) {
        setIsClosing(false);
        // Primeiro detecta que deve renderizar
        setShouldRender(true);
        
        // Depois aguarda um pouco para montar o conteúdo
        mountTimer = setTimeout(() => {
          setIsMounted(true);
        }, mountDelay);
        
        return () => clearTimeout(mountTimer);
      } else if (shouldRender) {
        // Ao fechar, primeiro marca como fechando
        setIsClosing(true);
        setIsMounted(false);
        
        // Depois de um tempo, remove completamente do DOM
        unmountTimer = setTimeout(() => {
          setShouldRender(false);
          setIsClosing(false);
        }, unmountDelay);
        
        return () => clearTimeout(unmountTimer);
      }
      
      return undefined;
    }, [props.open, shouldRender]);
    
    // Não renderiza nada se não deve renderizar
    if (!shouldRender) {
      return null;
    }
    
    // Clone as props para adicionar classes condicionais
    const componentProps = {
      ...props,
      className: cn(
        props.className,
        isClosing ? "safely-closing" : "", // Uma classe que pode ser usada para CSS
      ),
    };
    
    // Renderize com o ErrorBoundary
    return (
      <ChromeErrorBoundary>
        <Component {...componentProps as any}>
          {isMounted ? props.children : null}
        </Component>
      </ChromeErrorBoundary>
    );
  };
}

// Aplica o HOC ao diálogo
const SafeDialog = withDelayedRender(Dialog, 20, 150);

const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
  return (
    <SafeDialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <ChromeErrorBoundary>
          <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
            {children}
          </Command>
        </ChromeErrorBoundary>
      </DialogContent>
    </SafeDialog>
  );
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  </div>
))

CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
))

CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm"
    {...props}
  />
))

CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className
    )}
    {...props}
  />
))

CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 h-px bg-border", className)}
    {...props}
  />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected='true']:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50",
      className
    )}
    {...props}
  />
))

CommandItem.displayName = CommandPrimitive.Item.displayName

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
CommandShortcut.displayName = "CommandShortcut"

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
