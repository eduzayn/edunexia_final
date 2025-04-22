import { useState } from 'react';
import { useLocation } from 'wouter';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminEmergencyAccess() {
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessCode) {
      toast({
        title: 'Código obrigatório',
        description: 'Por favor, informe o código de acesso fornecido.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api-json/admin-direct-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessCode }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao acessar painel administrativo');
      }
      
      toast({
        title: 'Acesso concedido',
        description: 'Redirecionando para o painel administrativo...',
      });
      
      // Redirecionar para o dashboard administrativo
      setTimeout(() => {
        setLocation('/admin/dashboard');
      }, 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: 'Acesso negado',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Acesso de Emergência</CardTitle>
          <CardDescription className="text-center">
            Digite o código de acesso administrativo fornecido
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                id="accessCode"
                placeholder="Código de acesso"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="text-center text-xl tracking-widest"
                autoComplete="off"
                required
              />
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Verificando...' : 'Acessar Painel Administrativo'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}