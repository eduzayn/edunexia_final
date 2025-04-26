import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, CheckCircle, AlertCircle } from 'lucide-react';
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

// Interface para simulado
interface Simulado {
  id: number;
  title: string;
  description?: string;
  questions: Question[];
  passingScore: number;
  minQuestions: number;
  isComplete: boolean;
}

// Interface para as props do componente
interface SimuladoPreviewProps {
  simulado: Simulado;
  onEdit?: () => void;
  onView?: () => void;
}

export function SimuladoPreview({ simulado, onEdit, onView }: SimuladoPreviewProps) {
  const { id, title, description, questions, passingScore, minQuestions, isComplete } = simulado;
  
  // Verificar se o simulado tem o número mínimo de questões
  const hasMinQuestions = questions.length >= minQuestions;
  
  // Calcular a porcentagem de completude
  const completionPercentage = minQuestions > 0 
    ? Math.min(100, (questions.length / minQuestions) * 100) 
    : 100;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              {title}
            </CardTitle>
            <CardDescription>
              {questions.length} {questions.length === 1 ? 'questão cadastrada' : 'questões cadastradas'} • 
              Nota mínima: {passingScore.toFixed(1)}
            </CardDescription>
          </div>
          <Badge variant={isComplete ? "success" : "warning"}>
            {isComplete ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" /> Completo
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 mr-1" /> Incompleto
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {!hasMinQuestions && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Progresso</span>
              <span className="text-sm font-medium">{completionPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {minQuestions - questions.length} {minQuestions - questions.length === 1 ? 'questão restante' : 'questões restantes'} para completar o requisito mínimo.
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
              <li>Mínimo de {minQuestions} questões</li>
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

export default SimuladoPreview;