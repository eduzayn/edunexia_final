
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
