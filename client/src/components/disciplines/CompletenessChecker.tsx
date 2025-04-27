import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { disciplinesService } from "@/services/disciplinesService";

// Interface para os resultados da verificação de completude
interface CompletenessResult {
  isComplete: boolean;
  components: {
    videos: ComponentStatus;
    ebooks: ComponentStatus;
    simulado: ComponentStatus;
    avaliacao: ComponentStatus;
  };
}

// Interface para o status de cada componente
interface ComponentStatus {
  status: boolean;
  count: number;
  required: number;
  message: string;
}

// Props do componente
interface CompletenessCheckerProps {
  disciplineId: number;
  onStatusChange?: (isComplete: boolean) => void;
  collapsed?: boolean;
}

// Componente principal
export function CompletenessChecker({ disciplineId, onStatusChange, collapsed = false }: CompletenessCheckerProps) {
  const [completeness, setCompleteness] = useState<CompletenessResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(!collapsed);
  const { toast } = useToast();

  // Função para verificar a completude
  const checkCompleteness = async () => {
    if (!disciplineId) return;
    
    setLoading(true);
    setError(null);

    try {
      const data = await disciplinesService.checkCompleteness(disciplineId);
      setCompleteness(data);
      if (onStatusChange) {
        onStatusChange(data.isComplete);
      }
    } catch (err) {
      console.error("Erro ao verificar completude:", err);
      setError("Erro ao verificar completude da disciplina. Tente novamente mais tarde.");
      toast({
        title: "Erro",
        description: "Não foi possível verificar a completude da disciplina",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados ao montar o componente
  useEffect(() => {
    if (disciplineId) {
      checkCompleteness();
    }
  }, [disciplineId]);

  // Calcular a porcentagem de completude
  const calculateProgress = (): number => {
    if (!completeness) return 0;
    
    const components = [
      completeness.components.videos.status,
      completeness.components.ebooks.status,
      completeness.components.simulado.status,
      completeness.components.avaliacao.status
    ];
    
    const completedCount = components.filter(Boolean).length;
    return (completedCount / components.length) * 100;
  };

  // Renderizar badge de status para cada componente
  const renderStatusBadge = (status: boolean) => {
    return status ? (
      <Badge className="ml-2 bg-green-500 hover:bg-green-600">
        <CheckCircle className="h-3 w-3 mr-1" /> Completo
      </Badge>
    ) : (
      <Badge variant="outline" className="ml-2 text-amber-600 border-amber-300">
        <AlertCircle className="h-3 w-3 mr-1" /> Pendente
      </Badge>
    );
  };

  // Renderizar o toggle do acordeão
  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  // Calcular o progresso
  const progress = calculateProgress();

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Status de Completude</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleAccordion}
            className="h-8 w-8 p-0"
            disabled={loading}
          >
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        <CardDescription>
          Verifica se a disciplina possui todos os conteúdos obrigatórios
        </CardDescription>
      </CardHeader>

      {isOpen && (
        <>
          <CardContent className="pb-3">
            {loading ? (
              <div className="flex justify-center items-center py-4">
                <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                <span>Verificando...</span>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : completeness ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Progresso</span>
                    <span className="text-sm font-medium">{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <Accordion type="single" collapsible className="w-full" defaultValue="components">
                  <AccordionItem value="components">
                    <AccordionTrigger className="py-2">
                      Componentes Obrigatórios
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Vídeos (mín. 1)</span>
                          {renderStatusBadge(completeness.components.videos.status)}
                        </div>
                        <div className="text-xs text-muted-foreground pl-2">
                          {completeness.components.videos.message}
                          <span className="font-semibold ml-1">
                            ({completeness.components.videos.count}/{completeness.components.videos.required})
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm">E-books (mín. 1)</span>
                          {renderStatusBadge(completeness.components.ebooks.status)}
                        </div>
                        <div className="text-xs text-muted-foreground pl-2">
                          {completeness.components.ebooks.message}
                          <span className="font-semibold ml-1">
                            ({completeness.components.ebooks.count}/{completeness.components.ebooks.required})
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm">Simulado (mín. 5 questões)</span>
                          {renderStatusBadge(completeness.components.simulado.status)}
                        </div>
                        <div className="text-xs text-muted-foreground pl-2">
                          {completeness.components.simulado.message}
                          <span className="font-semibold ml-1">
                            ({completeness.components.simulado.count}/{completeness.components.simulado.required})
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm">Avaliação Final (10 questões)</span>
                          {renderStatusBadge(completeness.components.avaliacao.status)}
                        </div>
                        <div className="text-xs text-muted-foreground pl-2">
                          {completeness.components.avaliacao.message}
                          <span className="font-semibold ml-1">
                            ({completeness.components.avaliacao.count}/{completeness.components.avaliacao.required})
                          </span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Nenhuma informação disponível
              </div>
            )}
          </CardContent>

          <CardFooter>
            <Button
              onClick={checkCompleteness}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Verificar novamente
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
}

export default CompletenessChecker;