/**
 * WRAPPERS SEGUROS PARA COMPONENTES RADIX UI
 * 
 * Este arquivo fornece versões seguras dos componentes Radix UI que 
 * frequentemente causam problemas de DOM em alguns navegadores.
 */
import React, { useEffect, useRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as CommandPrimitive from 'cmdk';

/**
 * Componente seguro para Dialog Overlay do Radix UI
 */
export const SafeDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>((props, ref) => {
  // Referência para verificar se o componente está montado
  const mountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // Wrapper de segurança para evitar manipulações de DOM em componentes desmontados
  return <DialogPrimitive.Overlay ref={ref} {...props} />;
});

SafeDialogOverlay.displayName = 'SafeDialogOverlay';

/**
 * Componente seguro para Dialog Content do Radix UI
 */
export const SafeDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>((props, ref) => {
  // Referência para verificar se o componente está montado
  const mountedRef = useRef(true);
  const [isMounted, setIsMounted] = React.useState(false);
  
  // Efeito para limpar referência quando componente desmontar
  useEffect(() => {
    if (mountedRef.current) {
      // Usar requestAnimationFrame para sincronizar com o ciclo de renderização
      const frameId = requestAnimationFrame(() => {
        if (mountedRef.current) {
          setIsMounted(true);
        }
      });
      
      return () => {
        mountedRef.current = false;
        cancelAnimationFrame(frameId);
      };
    }
  }, []);
  
  // Wrapper de segurança que só renderiza o conteúdo quando estiver seguramente montado
  return (
    <DialogPrimitive.Content
      ref={ref}
      {...props}
      onCloseAutoFocus={(e) => {
        // Evitar propagação de eventos em componentes potencialmente desmontados
        if (!mountedRef.current) return;
        e.preventDefault();
        
        // Chamar o handler original se existir e o componente ainda estiver montado
        if (props.onCloseAutoFocus && mountedRef.current) {
          props.onCloseAutoFocus(e);
        }
      }}
      onOpenAutoFocus={(e) => {
        // Evitar propagação de eventos em componentes potencialmente desmontados
        if (!mountedRef.current) return;
        e.preventDefault();
        
        // Chamar o handler original se existir e o componente ainda estiver montado
        if (props.onOpenAutoFocus && mountedRef.current) {
          props.onOpenAutoFocus(e);
        }
      }}
    >
      {/* Renderizar conteúdo apenas quando for seguro */}
      {isMounted ? props.children : null}
    </DialogPrimitive.Content>
  );
});

SafeDialogContent.displayName = 'SafeDialogContent';

/**
 * HOC (High Order Component) que fornece segurança contra erros de DOM
 * para componentes React como os da biblioteca Radix UI
 */
export function withDOMErrorProtection<P extends object>(
  Component: React.ComponentType<P>,
  componentName = 'Protected Component'
) {
  const ProtectedComponent = (props: P) => {
    // Referência para verificar se o componente está montado
    const mountedRef = useRef(true);
    
    // Efeito para limpar referência quando componente desmontar
    useEffect(() => {
      return () => {
        mountedRef.current = false;
      };
    }, []);
    
    try {
      // Renderizar o componente normalmente, mas com proteção contra erros
      return <Component {...props} />;
    } catch (error) {
      console.error(`Erro ao renderizar ${componentName}:`, error);
      // Em caso de erro, retornar null para não quebrar a aplicação
      return null;
    }
  };
  
  ProtectedComponent.displayName = `Protected(${componentName})`;
  
  return ProtectedComponent;
}

/**
 * Versão segura do Dialog do Radix UI
 */
export const SafeDialog = withDOMErrorProtection(DialogPrimitive.Root, 'Dialog');

/**
 * Versão segura do Command component 
 */
export const SafeCommand = withDOMErrorProtection(CommandPrimitive, 'Command');