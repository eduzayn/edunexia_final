import React, { ReactNode } from 'react';
import AdminLayout from './admin-layout';
import StudentLayout from './student-layout';
import { useAuth } from '@/hooks/use-auth';

// Exportando os layouts para uso em outros arquivos
export { AdminLayout, StudentLayout };

interface LayoutProps {
  children: ReactNode;
}

/**
 * Componente de layout que direciona para o layout apropriado
 * com base no tipo de usuário logado
 */
export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();

  // Direciona para o layout apropriado com base no tipo de usuário
  if (user?.portalType === 'admin') {
    return <AdminLayout>{children}</AdminLayout>;
  } else if (user?.portalType === 'student') {
    return <StudentLayout>{children}</StudentLayout>;
  }

  // Layout padrão para quando não tiver um layout específico
  return (
    <div className="min-h-screen bg-background">
      <main className="flex-1">{children}</main>
    </div>
  );
}