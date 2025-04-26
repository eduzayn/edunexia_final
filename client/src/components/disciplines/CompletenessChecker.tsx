import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { disciplinasService } from "@/services/disciplinasService";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  BookText,
  Video,
  FileQuestion,
  Clipboard,
  DownloadCloud
} from "lucide-react";

interface CompletenessCheckerProps {
  disciplineId: string;
  refreshOnUpdate?: boolean;
}

const CompletenessChecker: React.FC<CompletenessCheckerProps> = ({ 
  disciplineId,
  refreshOnUpdate = false 
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkCompleteness = async () => {
    if (!disciplineId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await disciplinasService.verificarCompletude(disciplineId);
      setResult(data);
    } catch (err) {
      setError("Erro ao verificar completude da disciplina");
      console.error("Erro ao verificar completude:", err);
      toast({
        title: "Erro",
        description: "Não foi possível verificar a completude da disciplina.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkCompleteness();
  }, [disciplineId]);

  // Calcula a porcentagem de completude
  const calculateProgress = () => {
    if (!result || !result.components) return 0;
    
    const componentsList = Object.values(result.components) as any[];
    const completedComponents = componentsList.filter(comp => comp.status).length;
    
    return Math.round((completedComponents / componentsList.length) * 100);
  };

  const progressValue = result ? calculateProgress() : 0;
  
  // Determina o status geral da disciplina
  const isComplete = result?.isComplete;

  const getComponentIcon = (key: string) => {
    switch (key) {
      case 'videos':
        return <Video className="h-5 w-5" />;
      case 'ebooks':
        return <BookText className="h-5 w-5" />;
      case 'simulado':
        return <FileQuestion className="h-5 w-5" />;
      case 'avaliacaoFinal':
        return <Clipboard className="h-5 w-5" />;
      default:
        return <BookText className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? 
      <CheckCircle2 className="h-5 w-5 text-green-500" /> : 
      <AlertCircle className="h-5 w-5 text-amber-500" />;
  };

  const getStatusBadge = (status: boolean) => {
    return status ? 
      <Badge variant="success">Concluído</Badge> : 
      <Badge variant="warning">Pendente</Badge>;
  };

  const getComponentLabel = (key: string) => {
    switch (key) {
      case 'videos':
        return 'Vídeo-aulas';
      case 'ebooks':
        return 'E-books';
      case 'simulado':
        return 'Simulado';
      case 'avaliacaoFinal':
        return 'Avaliação Final';
      default:
        return key;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Verificação de Completude</CardTitle>
            <CardDescription>
              Verifique se a disciplina possui todos os elementos necessários
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkCompleteness}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Verificar
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center p-6">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Verificando componentes...</p>
          </div>
        ) : result ? (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                  )}
                  <span className="font-medium">
                    Status da disciplina: {isComplete ? 'Completa' : 'Incompleta'}
                  </span>
                </div>
                <Badge 
                  variant={isComplete ? "success" : "warning"}
                  className="px-3 py-1"
                >
                  {progressValue}% Concluído
                </Badge>
              </div>
              <Progress value={progressValue} className="h-2" />
            </div>

            <div className="space-y-3">
              {result.components && Object.entries(result.components).map(([key, component]: [string, any]) => (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    {getComponentIcon(key)}
                    <div className="ml-3">
                      <div className="font-medium">{getComponentLabel(key)}</div>
                      <div className="text-sm text-muted-foreground">
                        {component.count} / {component.required} {key === 'avaliacaoFinal' ? 'questões (exato)' : 'mínimo'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(component.status)}
                    {getStatusIcon(component.status)}
                  </div>
                </div>
              ))}
            </div>

            {!isComplete && (
              <Alert variant="warning" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Atenção</AlertTitle>
                <AlertDescription>
                  Para que a disciplina esteja completa, é necessário:
                  <ul className="list-disc pl-5 mt-2 text-sm">
                    {result.components && Object.values(result.components)
                      .filter((c: any) => !c.status)
                      .map((c: any, index: number) => (
                        <li key={index}>{c.message}</li>
                      ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <DownloadCloud className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Não foi possível obter informações de completude.<br />
              Clique em "Verificar" para tentar novamente.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompletenessChecker;