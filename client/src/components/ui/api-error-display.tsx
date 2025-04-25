import React from 'react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw, Server, Wifi, AlertTriangle } from 'lucide-react';

interface ApiErrorDisplayProps {
  error: Error | null;
  refetch?: () => void;
}

/**
 * Componente para exibir erros de API de forma amigável
 */
export function ApiErrorDisplay({ error, refetch }: ApiErrorDisplayProps) {
  if (!error) return null;

  const isNetworkError = error.message.includes('Failed to fetch') || 
                         error.message.includes('NetworkError') ||
                         error.message.includes('network');
  
  const is404Error = error.message.includes('404') || 
                    error.message.includes('Not Found');
  
  const is401Error = error.message.includes('401') || 
                     error.message.includes('Unauthorized') ||
                     error.message.includes('não autenticado');

  return (
    <Alert variant="destructive" className="my-4">
      <AlertTitle className="flex items-center">
        {isNetworkError ? (
          <>
            <Wifi className="h-4 w-4 mr-2" />
            Erro de Conexão
          </>
        ) : is404Error ? (
          <>
            <Server className="h-4 w-4 mr-2" />
            Endpoint não encontrado
          </>
        ) : is401Error ? (
          <>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Acesso não autorizado
          </>
        ) : (
          <>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Erro na requisição
          </>
        )}
      </AlertTitle>
      
      <AlertDescription className="mt-2">
        {isNetworkError ? (
          <div>
            <p>Não foi possível conectar ao servidor. Verifique:</p>
            <ul className="list-disc pl-5 mt-2">
              <li>Se o servidor está em execução</li>
              <li>Se a URL está correta ({window.location.origin})</li>
              <li>Sua conexão com a internet</li>
            </ul>
          </div>
        ) : is404Error ? (
          <div>
            <p>O endpoint solicitado não foi encontrado no servidor. Isso pode ocorrer por:</p>
            <ul className="list-disc pl-5 mt-2">
              <li>URL incorreta ou mal formatada</li>
              <li>Rota não implementada no backend</li>
              <li>Prefixo de API incorreto (api/ vs api-json/)</li>
            </ul>
          </div>
        ) : is401Error ? (
          <p>Você não está autenticado ou sua sessão expirou. Faça login novamente para continuar.</p>
        ) : (
          <p>{error.message}</p>
        )}
        
        {refetch && (
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            className="mt-3 flex items-center"
            size="sm"
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            Tentar novamente
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}