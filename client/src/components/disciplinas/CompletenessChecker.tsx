
import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface CompletionItem {
  id: string;
  label: string;
  status: 'completed' | 'pending' | 'missing';
  description?: string;
}

interface CompletenessCheckerProps {
  disciplineId: string | number;
  className?: string;
}

export default function CompletenessChecker({ disciplineId, className = '' }: CompletenessCheckerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completionItems, setCompletionItems] = useState<CompletionItem[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    async function fetchCompletenessData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/disciplines/${disciplineId}/completeness`);
        if (!response.ok) {
          throw new Error('Falha ao carregar dados de completude');
        }
        const data = await response.json();
        
        // Se a API retornar diretamente os itens de completude
        if (Array.isArray(data)) {
          setCompletionItems(data);
          
          // Calcular percentual de completude
          const completedCount = data.filter(item => item.status === 'completed').length;
          const percentage = (completedCount / data.length) * 100;
          setCompletionPercentage(percentage);
        } 
        // Se a API retornar um objeto com itens e percentual
        else if (data && typeof data === 'object') {
          if (Array.isArray(data.items)) {
            setCompletionItems(data.items);
          }
          if (typeof data.percentage === 'number') {
            setCompletionPercentage(data.percentage);
          }
        }
        // Fallback para quando a API ainda não está disponível
        else {
          // Dados simulados para desenvolvimento
          const mockItems: CompletionItem[] = [
            { id: 'videos', label: 'Vídeos', status: 'pending' },
            { id: 'ebook', label: 'E-book', status: 'pending' },
            { id: 'interactive-ebook', label: 'E-book Interativo', status: 'pending' },
            { id: 'simulado', label: 'Simulado', status: 'pending' },
            { id: 'avaliacao-final', label: 'Avaliação Final', status: 'pending' },
          ];
          setCompletionItems(mockItems);
          setCompletionPercentage(0);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados de completude');
        console.error('Erro ao carregar dados de completude:', err);
        
        // Dados simulados para desenvolvimento
        const mockItems: CompletionItem[] = [
          { id: 'videos', label: 'Vídeos', status: 'pending' },
          { id: 'ebook', label: 'E-book', status: 'pending' },
          { id: 'interactive-ebook', label: 'E-book Interativo', status: 'pending' },
          { id: 'simulado', label: 'Simulado', status: 'pending' },
          { id: 'avaliacao-final', label: 'Avaliação Final', status: 'pending' },
        ];
        setCompletionItems(mockItems);
        setCompletionPercentage(0);
      } finally {
        setLoading(false);
      }
    }

    if (disciplineId) {
      fetchCompletenessData();
    }
  }, [disciplineId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'missing':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'pending':
        return 'Pendente';
      case 'missing':
        return 'Não configurado';
      default:
        return 'Desconhecido';
    }
  };

  if (loading) {
    return (
      <Card className={`p-4 ${className}`}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Carregando status de completude...</h3>
          </div>
          <Progress value={0} className="h-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Status de Completude da Disciplina</h3>
          <span className="text-sm font-medium">{Math.round(completionPercentage)}%</span>
        </div>
        
        <Progress value={completionPercentage} className="h-2 mb-5" />
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {completionItems.map((item) => (
            <div key={item.id} className="flex flex-col items-center text-center space-y-2">
              {getStatusIcon(item.status)}
              <span className="text-sm font-medium">{item.label}</span>
              <span className="text-xs text-gray-500">{getStatusText(item.status)}</span>
            </div>
          ))}
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, FileText, Video, Layers, ClipboardList, FileSpreadsheet } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface CompletionItem {
  id: string;
  name: string;
  isCompleted: boolean;
  icon: React.ReactNode;
}

interface CompletenessCheckerProps {
  disciplineId?: string;
}

export default function CompletenessChecker({ disciplineId }: CompletenessCheckerProps) {
  const [completionItems, setCompletionItems] = useState<CompletionItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (disciplineId) {
      // Aqui seria a chamada para a API para buscar o estado de completude da disciplina
      // Por enquanto, vamos simular com dados fictícios
      setTimeout(() => {
        const items: CompletionItem[] = [
          {
            id: 'videos',
            name: 'Videoaulas',
            isCompleted: true,
            icon: <Video className="h-5 w-5" />
          },
          {
            id: 'ebook',
            name: 'E-book Estático',
            isCompleted: true,
            icon: <FileText className="h-5 w-5" />
          },
          {
            id: 'interactive',
            name: 'E-book Interativo',
            isCompleted: false,
            icon: <Layers className="h-5 w-5" />
          },
          {
            id: 'simulados',
            name: 'Simulados',
            isCompleted: true,
            icon: <ClipboardList className="h-5 w-5" />
          },
          {
            id: 'avaliacao',
            name: 'Avaliação Final',
            isCompleted: false,
            icon: <FileSpreadsheet className="h-5 w-5" />
          }
        ];
        
        setCompletionItems(items);
        const completedCount = items.filter(item => item.isCompleted).length;
        const percentage = (completedCount / items.length) * 100;
        setProgress(percentage);
        setIsLoading(false);
      }, 1000);
    }
  }, [disciplineId]);

  if (isLoading) {
    return <div className="text-center py-4">Carregando...</div>;
  }

  return (
    <div>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium">Completude da Disciplina</span>
          <span className="text-sm font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      <div className="space-y-3">
        {completionItems.map(item => (
          <div 
            key={item.id} 
            className={`flex items-center p-2.5 rounded-md ${item.isCompleted ? 'bg-green-50' : 'bg-amber-50'}`}
          >
            <div className={`p-1.5 rounded-full mr-3 ${item.isCompleted ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
              {item.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{item.name}</p>
            </div>
            <div>
              {item.isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              )}
            </div>
          </div>
        ))}
      </div>
      
      {progress < 100 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
          <p className="text-sm text-blue-700">
            A disciplina estará pronta para publicação quando todos os itens estiverem completos.
          </p>
        </div>
      )}
      
      {progress === 100 && (
        <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-100">
          <p className="text-sm text-green-700 font-medium">
            A disciplina está completa e pronta para ser publicada!
          </p>
        </div>
      )}
    </div>
  );
}
