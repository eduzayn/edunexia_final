import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// Interface para questão
interface Question {
  id: number;
  statement: string;
  options: string[];
  correctOption: number;
  explanation?: string;
}

// Interface para avaliação final
interface AvaliacaoFinal {
  id: number;
  title: string;
  description?: string;
  questions: Question[];
  passingScore: number;
  requiredQuestions: number;
  isComplete: boolean;
}

// Interface para as props do componente
interface AvaliacaoFinalPreviewProps {
  avaliacao: AvaliacaoFinal;
  onEdit?: () => void;
  onView?: () => void;
}

export function AvaliacaoFinalPreview({ avaliacao, onEdit, onView }: AvaliacaoFinalPreviewProps) {
  const { id, title, description, questions, passingScore, requiredQuestions, isComplete } = avaliacao;
  
  // Verificar se a avaliação tem o número exato de questões
  const hasExactQuestions = questions.length === requiredQuestions;
  const hasTooManyQuestions = questions.length > requiredQuestions;
  
  // Calcular a porcentagem de completude
  const completionPercentage = requiredQuestions > 0 
    ? Math.min(100, (questions.length / requiredQuestions) * 100) 
    : 100;
  
  // Determinar o status visual
  let statusVariant: 'success' | 'warning' | 'destructive' = 'warning';
  let statusIcon = <AlertCircle className="h-3 w-3 mr-1" />;
  let statusText = 'Incompleta';
  
  if (isComplete) {
    statusVariant = 'success';
    statusIcon = <CheckCircle className="h-3 w-3 mr-1" />;
    statusText = 'Completa';
  } else if (hasTooManyQuestions) {
    statusVariant = 'destructive';
    statusIcon = <AlertTriangle className="h-3 w-3 mr-1" />;
    statusText = 'Excesso';
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              {title}
            </CardTitle>
            <CardDescription>
              {questions.length} {questions.length === 1 ? 'questão cadastrada' : 'questões cadastradas'} • 
              Nota mínima: {passingScore.toFixed(1)}
            </CardDescription>
          </div>
          <Badge variant={statusVariant}>
            {statusIcon} {statusText}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {!hasExactQuestions && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Progresso</span>
              <span className="text-sm font-medium">{completionPercentage > 100 ? '100+' : completionPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={Math.min(100, completionPercentage)} className="h-2" variant={hasTooManyQuestions ? 'destructive' : 'default'} />
            <p className="text-sm text-muted-foreground mt-2">
              {hasTooManyQuestions ? (
                <>Remova {questions.length - requiredQuestions} {questions.length - requiredQuestions === 1 ? 'questão' : 'questões'} para atender ao requisito exato.</>
              ) : (
                <>Adicione {requiredQuestions - questions.length} {requiredQuestions - questions.length === 1 ? 'questão' : 'questões'} para completar o requisito.</>
              )}
            </p>
          </div>
        )}
        
        <div className="space-y-2">
          {description && (
            <div>
              <h3 className="text-sm font-medium">Descrição:</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          )}
          
          <div>
            <h3 className="text-sm font-medium">Requisitos:</h3>
            <ul className="list-disc pl-5 text-sm text-muted-foreground mt-1">
              <li>Exatamente {requiredQuestions} questões</li>
              <li>Nota mínima para aprovação: {passingScore.toFixed(1)}</li>
            </ul>
          </div>
          
          {questions.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mt-3 mb-1">Questões cadastradas:</h3>
              <div className="text-sm text-muted-foreground">
                {questions.slice(0, 3).map((question, index) => (
                  <div key={question.id} className="py-1 border-b last:border-0">
                    <p className="line-clamp-1">{index + 1}. {question.statement}</p>
                  </div>
                ))}
                {questions.length > 3 && (
                  <div className="py-1 text-primary text-center">
                    + {questions.length - 3} {questions.length - 3 === 1 ? 'questão' : 'questões'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2">
        {onView && (
          <Button variant="outline" className="flex-1" onClick={onView}>
            Visualizar
          </Button>
        )}
        {onEdit && (
          <Button className="flex-1" onClick={onEdit}>
            {questions.length === 0 ? 'Cadastrar questões' : 'Gerenciar questões'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default AvaliacaoFinalPreview;