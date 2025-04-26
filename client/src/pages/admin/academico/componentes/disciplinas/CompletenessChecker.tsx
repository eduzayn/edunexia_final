import { useState, useEffect } from 'react';
import { Progress } from "@/components/ui/progress";
import { Discipline } from "@shared/schema";
import { 
  CheckCircleIcon, 
  AlertCircleIcon,
  AlertTriangleIcon,
  VideoIcon,
  BookIcon,
  FileTextIcon
} from "@/components/ui/icons";
import { List as ListIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CompletenessCheckerProps {
  discipline: Discipline;
}

export function CompletenessChecker({ discipline }: CompletenessCheckerProps) {
  const [completionStatus, setCompletionStatus] = useState({
    videos: false,
    ebook: false,
    interactiveEbook: false,
    simulado: false,
    avaliacaoFinal: false
  });

  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [status, setStatus] = useState<'incomplete' | 'complete' | 'pending'>('incomplete');

  // Verifica se a disciplina tem vídeos configurados
  function hasVideos(discipline: Discipline): boolean {
    return Boolean(
      discipline.videoAula1Url || 
      discipline.videoAula2Url || 
      discipline.videoAula3Url || 
      discipline.videoAula4Url || 
      discipline.videoAula5Url ||
      discipline.videoAula6Url ||
      discipline.videoAula7Url ||
      discipline.videoAula8Url ||
      discipline.videoAula9Url ||
      discipline.videoAula10Url
    );
  }

  // Verifica se a disciplina tem e-book estático
  function hasEbook(discipline: Discipline): boolean {
    return Boolean(discipline.apostilaPdfUrl);
  }

  // Verifica se a disciplina tem e-book interativo
  function hasInteractiveEbook(discipline: Discipline): boolean {
    return Boolean(discipline.ebookInterativoUrl);
  }

  // Verifica se a disciplina tem simulado
  // Nota: Esta é uma verificação simulada, será necessário adaptar às suas APIs reais
  function hasSimulado(discipline: Discipline): boolean {
    // Implementação fictícia - substitua pela lógica real baseada na sua estrutura de dados
    return discipline.contentStatus === 'complete';
  }

  // Verifica se a disciplina tem avaliação final
  // Nota: Esta é uma verificação simulada, será necessário adaptar às suas APIs reais
  function hasAvaliacaoFinal(discipline: Discipline): boolean {
    // Implementação fictícia - substitua pela lógica real baseada na sua estrutura de dados
    return discipline.contentStatus === 'complete';
  }

  useEffect(() => {
    if (discipline) {
      // Atualiza o status de cada componente
      const newStatus = {
        videos: hasVideos(discipline),
        ebook: hasEbook(discipline),
        interactiveEbook: hasInteractiveEbook(discipline),
        simulado: hasSimulado(discipline),
        avaliacaoFinal: hasAvaliacaoFinal(discipline)
      };
      
      setCompletionStatus(newStatus);
      
      // Calcula o percentual de conclusão
      const completedItems = Object.values(newStatus).filter(Boolean).length;
      const totalItems = Object.values(newStatus).length;
      const percentage = Math.round((completedItems / totalItems) * 100);
      
      setCompletionPercentage(percentage);
      
      // Determina o status geral da disciplina
      if (percentage === 100) {
        setStatus('complete');
      } else if (percentage >= 60) {
        setStatus('pending');
      } else {
        setStatus('incomplete');
      }
    }
  }, [discipline]);

  return (
    <div className={`p-4 rounded-lg ${
      status === 'complete' 
        ? 'bg-green-50 border border-green-200' 
        : status === 'pending'
          ? 'bg-amber-50 border border-amber-200'
          : 'bg-red-50 border border-red-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          {status === 'complete' && (
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
          )}
          {status === 'pending' && (
            <AlertTriangleIcon className="h-5 w-5 text-amber-500 mr-2" />
          )}
          {status === 'incomplete' && (
            <AlertCircleIcon className="h-5 w-5 text-red-500 mr-2" />
          )}
          <h2 className="text-sm font-medium">
            {status === 'complete' 
              ? 'Disciplina completa e pronta para uso em cursos' 
              : status === 'pending'
                ? 'Disciplina parcialmente completa'
                : 'Disciplina incompleta - preencha os componentes obrigatórios'
            }
          </h2>
        </div>
        <span className="text-sm font-semibold">
          {completionPercentage}% concluído
        </span>
      </div>
      
      <Progress value={completionPercentage} className="h-2 mb-3" />
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
        <div className={`flex items-center p-2 rounded ${completionStatus.videos ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          <VideoIcon className={`h-3 w-3 mr-1 ${completionStatus.videos ? 'text-green-600' : 'text-gray-500'}`} />
          <span>Vídeo-aulas</span>
          {completionStatus.videos && <CheckCircleIcon className="h-3 w-3 ml-auto text-green-600" />}
        </div>
        
        <div className={`flex items-center p-2 rounded ${completionStatus.ebook ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          <FileTextIcon className={`h-3 w-3 mr-1 ${completionStatus.ebook ? 'text-green-600' : 'text-gray-500'}`} />
          <span>E-book</span>
          {completionStatus.ebook && <CheckCircleIcon className="h-3 w-3 ml-auto text-green-600" />}
        </div>
        
        <div className={`flex items-center p-2 rounded ${completionStatus.interactiveEbook ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          <BookIcon className={`h-3 w-3 mr-1 ${completionStatus.interactiveEbook ? 'text-green-600' : 'text-gray-500'}`} />
          <span>E-book interativo</span>
          {completionStatus.interactiveEbook && <CheckCircleIcon className="h-3 w-3 ml-auto text-green-600" />}
        </div>
        
        <div className={`flex items-center p-2 rounded ${completionStatus.simulado ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          <ListIcon className={`h-3 w-3 mr-1 ${completionStatus.simulado ? 'text-green-600' : 'text-gray-500'}`} />
          <span>Simulado</span>
          {completionStatus.simulado && <CheckCircleIcon className="h-3 w-3 ml-auto text-green-600" />}
        </div>
        
        <div className={`flex items-center p-2 rounded ${completionStatus.avaliacaoFinal ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          <ListIcon className={`h-3 w-3 mr-1 ${completionStatus.avaliacaoFinal ? 'text-green-600' : 'text-gray-500'}`} />
          <span>Avaliação Final</span>
          {completionStatus.avaliacaoFinal && <CheckCircleIcon className="h-3 w-3 ml-auto text-green-600" />}
        </div>
      </div>
    </div>
  );
}