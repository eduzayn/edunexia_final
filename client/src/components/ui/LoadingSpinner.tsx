import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  text?: string;
}

/**
 * Componente para exibir um indicador de carregamento
 * Útil para mostrar durante operações assíncronas
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  className = '',
  text
}) => {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} border-t-primary border-primary/30 rounded-full animate-spin`}
        role="status"
        aria-label="Carregando"
      />
      {text && (
        <span className="mt-2 text-sm text-muted-foreground">{text}</span>
      )}
    </div>
  );
};

/**
 * Componente que ocupa a tela inteira com um spinner centralizado
 */
export const FullPageSpinner: React.FC<{ text?: string }> = ({ text }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <LoadingSpinner size="large" text={text} />
    </div>
  );
};

export default LoadingSpinner; 