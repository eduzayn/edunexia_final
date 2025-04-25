import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ReactNode } from "react";

/**
 * Componente de Dialog acessível que resolve os warnings do Radix UI
 * - ✅ Corrige o warning "'DialogContent' requires a 'DialogTitle'"
 * - ✅ Corrige o warning "Missing `Description` or `aria-describedby={undefined}`"
 */
export function AccessibleDialog({
  children,
  title,
  description,
  showTitle = false,
  showDescription = false,
  trigger,
  open,
  onOpenChange,
}: {
  children: ReactNode;
  title: string;
  description?: string;
  showTitle?: boolean;
  showDescription?: boolean;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          {showTitle ? (
            <DialogTitle>{title}</DialogTitle>
          ) : (
            <VisuallyHidden>
              <DialogTitle>{title}</DialogTitle>
            </VisuallyHidden>
          )}
          {description && (
            showDescription ? (
              <DialogDescription>{description}</DialogDescription>
            ) : (
              <VisuallyHidden>
                <DialogDescription>{description}</DialogDescription>
              </VisuallyHidden>
            )
          )}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Componente Header para Dialog acessível
 * Ajuda a manter a semântica mesmo quando o title é visualmente oculto
 */
export function AccessibleDialogHeader({ children }: { children: ReactNode }) {
  return <div className="mb-4">{children}</div>;
}