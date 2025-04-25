import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2Icon, AlertTriangleIcon, CheckCircleIcon } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

/**
 * Ferramenta para recuperação de matrículas com problemas de conversão
 * Permite que administradores executem o processo de recuperação automaticamente
 */
export function EnrollmentRecoveryTool() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<{
    recovered: number;
    failed: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Função para recuperar matrículas com problemas
  const handleRecoverEnrollments = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProcessingResult(null);

      const response = await apiRequest(
        'POST',
        '/api/enrollment-integration/recover-incomplete'
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao recuperar matrículas');
      }

      const result = await response.json();
      setProcessingResult(result.data);

      if (result.data.recovered > 0 || result.data.failed > 0) {
        toast({
          title: 'Processo de recuperação concluído',
          description: `${result.data.recovered} matrículas recuperadas, ${result.data.failed} falhas`,
          variant: 'default'
        });
      } else {
        toast({
          title: 'Nenhuma matrícula para recuperar',
          description: 'Não foram encontradas matrículas com problemas de conversão',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Erro ao recuperar matrículas:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido');
      toast({
        title: 'Erro no processo de recuperação',
        description: 'Não foi possível completar o processo de recuperação de matrículas',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Recuperação de Matrículas</CardTitle>
        <CardDescription>
          Esta ferramenta identifica e recupera matrículas que deveriam ter sido convertidas
          mas apresentaram problemas durante o processo
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle>Erro no processo</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {processingResult && (
          <Alert variant={processingResult.recovered > 0 ? 'default' : 'warning'} className="mb-4">
            <CheckCircleIcon className="h-4 w-4" />
            <AlertTitle>Processo concluído</AlertTitle>
            <AlertDescription>
              {processingResult.recovered > 0 ? (
                <span>
                  <strong>{processingResult.recovered}</strong> matrícula(s) recuperada(s) com sucesso.
                  {processingResult.failed > 0 && (
                    <span> <strong>{processingResult.failed}</strong> matrícula(s) com falha na recuperação.</span>
                  )}
                </span>
              ) : (
                <span>
                  Nenhuma matrícula foi recuperada.
                  {processingResult.failed > 0 && (
                    <span> <strong>{processingResult.failed}</strong> matrícula(s) com falha na recuperação.</span>
                  )}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Esta operação busca matrículas simplificadas antigas (mais de 1 dia) que estão com status de pagamento 
            confirmado ou aguardando pagamento, mas que ainda não foram convertidas para matrículas formais.
          </p>
          
          <div className="bg-muted rounded-md p-3">
            <p className="text-sm font-medium">Quando usar esta ferramenta?</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
              <li>Após identificar alunos que não conseguem acessar seus cursos</li>
              <li>Quando houver falhas no processo automático de conversão</li>
              <li>Como parte da manutenção periódica do sistema</li>
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleRecoverEnrollments} 
          disabled={isProcessing}
          variant="default"
        >
          {isProcessing ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            'Iniciar Recuperação'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}