import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

interface BackButtonProps {
  to: string;
  label?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
}

/**
 * Componente de botão de retorno reutilizável
 * @param to - Rota para onde voltar
 * @param label - Texto exibido no botão (opcional, padrão: "Voltar")
 * @param variant - Variante visual do botão (opcional, padrão: "outline")
 * @param className - Classes CSS adicionais (opcional, padrão: "mb-4")
 */
const BackButton: React.FC<BackButtonProps> = ({ 
  to, 
  label = "Voltar", 
  variant = "outline",
  className = "mb-4"
}) => {
  return (
    <Button 
      variant={variant} 
      size="sm" 
      className={className} 
      asChild
    >
      <Link href={to}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        {label}
      </Link>
    </Button>
  );
};

export default BackButton;