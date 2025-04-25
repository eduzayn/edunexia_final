import { useState } from 'react';
import axios from 'axios';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCcw, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface RecoveryStatus {
  running: boolean;
  completed: boolean;
  error: string | null;
  totalProcessed: number;
  totalRecovered: number;
  recoveredEnrollments: Array<{
    id: number;
    studentName: string;
    courseName: string;
    enrollmentId?: number;
  }>;
}

/**
 * Ferramenta para recuperação de matrículas com problemas de conversão
 * Permite que administradores executem o processo de recuperação automaticamente
 */
export function EnrollmentRecoveryTool() {
  const { toast } = useToast();
  const [status, setStatus] = useState<RecoveryStatus>({
    running: false,
    completed: false,
    error: null,
    totalProcessed: 0,
    totalRecovered: 0,
    recoveredEnrollments: []
  });

  // Função para iniciar o processo de recuperação
  const startRecovery = async () => {
    try {
      setStatus({
        running: true,
        completed: false,
        error: null,
        totalProcessed: 0,
        totalRecovered: 0,
        recoveredEnrollments: []
      });

      const response = await axios.post('/api/enrollment-integration/recover-incomplete');
      
      if (response.data.success) {
        setStatus({
          running: false,
          completed: true,
          error: null,
          totalProcessed: response.data.processed || 0,
          totalRecovered: response.data.recovered.length || 0,
          recoveredEnrollments: response.data.recovered || []
        });

        toast({
          title: "Recuperação concluída",
          description: `${response.data.recovered.length} matrículas foram recuperadas com sucesso.`,
          variant: "default"
        });
      } else {
        throw new Error(response.data.message || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao recuperar matrículas:', error);
      setStatus({
        ...status,
        running: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao processar a recuperação',
      });

      toast({
        title: "Erro na recuperação",
        description: "Ocorreu um erro ao tentar recuperar matrículas.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <RefreshCcw className="h-5 w-5 mr-2 text-primary" />
          Recuperação de Matrículas
        </CardTitle>
        <CardDescription>
          Esta ferramenta identifica e corrige matrículas que não foram convertidas corretamente
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {status.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro no processo</AlertTitle>
            <AlertDescription>
              {status.error}
            </AlertDescription>
          </Alert>
        )}

        {status.completed && status.totalRecovered > 0 && (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Recuperação concluída</AlertTitle>
            <AlertDescription>
              {status.totalRecovered} matrículas foram recuperadas com sucesso.
            </AlertDescription>
          </Alert>
        )}
        
        {status.completed && status.totalRecovered === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Nenhuma matrícula para recuperar</AlertTitle>
            <AlertDescription>
              Não foram encontradas matrículas que necessitem de recuperação.
            </AlertDescription>
          </Alert>
        )}

        {status.running && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Processando recuperação...</p>
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            <Progress value={50} className="h-2" />
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm">
            Esta ferramenta verifica matrículas simplificadas que deveriam ter sido convertidas em matrículas formais
            mas que, por algum motivo, não completaram esse processo. O sistema irá:
          </p>
          <ul className="text-sm list-disc pl-5 space-y-1">
            <li>Identificar matrículas com pagamento confirmado mas sem conversão</li>
            <li>Verificar dados necessários para conversão</li>
            <li>Criar matrículas formais automaticamente</li>
            <li>Atualizar os registros de matrículas simplificadas</li>
          </ul>
        </div>

        {status.completed && status.recoveredEnrollments.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Matrículas recuperadas:</h3>
            <div className="bg-muted p-3 rounded-md max-h-40 overflow-y-auto">
              <ul className="text-sm space-y-1">
                {status.recoveredEnrollments.map((enrollment) => (
                  <li key={enrollment.id} className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                    <span>
                      {enrollment.studentName} - {enrollment.courseName} 
                      {enrollment.enrollmentId && <span className="text-muted-foreground ml-1">
                        (ID: {enrollment.enrollmentId})
                      </span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            setStatus({
              running: false,
              completed: false,
              error: null,
              totalProcessed: 0,
              totalRecovered: 0,
              recoveredEnrollments: []
            });
          }}
          disabled={status.running}
        >
          Limpar resultados
        </Button>
        <Button 
          onClick={startRecovery} 
          disabled={status.running}
        >
          {status.running ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Iniciar Recuperação
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}