import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ImagePlus, Trash, Copy, ExternalLink, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { PaymentLinkCreator } from './payment-link-creator';

// Interface para um link de pagamento
interface PaymentLink {
  paymentLinkId: string;
  paymentLinkUrl: string;
  paymentType: string;
  name: string;
  description: string;
  value: number;
  installments: number;
  installmentValue?: number;
  billingType: string;
  createdAt?: string;
  dueDate?: string;
  status?: string;
  hasImages?: boolean;
}

interface PaymentLinksManagerProps {
  courseId: number;
  courseName: string;
  coursePrice: number | null;
}

export function PaymentLinksManager({ courseId, courseName, coursePrice }: PaymentLinksManagerProps) {
  // Estados
  const [isCreatingPaymentLink, setIsCreatingPaymentLink] = useState(false);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('links');
  const [linkToDelete, setLinkToDelete] = useState<PaymentLink | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  
  const { toast } = useToast();

  // Buscar links de pagamento ao montar o componente
  useEffect(() => {
    fetchPaymentLinks();
  }, [courseId]);

  // Função para buscar links de pagamento
  const fetchPaymentLinks = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Verificar primeiro se o usuário está autenticado
      const userResponse = await fetch('/api/user');
      
      if (!userResponse.ok) {
        setError('Sessão expirada ou usuário não autenticado');
        setIsLoading(false);
        return;
      }
      
      console.log(`Tentando buscar links para o curso ID ${courseId}...`);
      
      try {
        // Buscar os links de pagamento
        const response = await fetch(`/api/course-payment-links/courses/${courseId}/payment-options`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        console.log(`Resposta da API para links de pagamento:`, {
          status: response.status,
          statusText: response.statusText
        });
        
        const data = await response.json();
        console.log(`Dados da resposta:`, data);
        
        if (response.ok && data.success) {
          setPaymentLinks(data.data || []);
        } else {
          setError(data.message || 'Erro ao buscar links de pagamento');
          toast({
            variant: 'destructive',
            title: 'Erro ao carregar links',
            description: data.message || 'Não foi possível carregar os links de pagamento'
          });
        }
      } catch (fetchError) {
        console.error('Erro específico na requisição:', fetchError);
        setError('Erro ao processar a resposta da API');
        toast({
          variant: 'destructive',
          title: 'Erro na API',
          description: 'Ocorreu um erro ao processar a resposta da API'
        });
      }
    } catch (error) {
      console.error('Erro ao buscar links de pagamento:', error);
      setError('Erro de conexão ao buscar links de pagamento');
      toast({
        variant: 'destructive',
        title: 'Erro de conexão',
        description: 'Não foi possível conectar ao servidor'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para criar links padrão
  const createStandardLinks = async () => {
    try {
      toast({
        title: 'Gerando links padrão',
        description: 'Aguarde enquanto criamos os links de pagamento...'
      });
      
      const response = await fetch(`/api/course-payment-links/courses/${courseId}/payment-options/standard`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({
          title: 'Links gerados com sucesso',
          description: 'Os links de pagamento padrão foram criados'
        });
        fetchPaymentLinks(); // Recarregar a lista
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao gerar links',
          description: data.message || 'Não foi possível gerar os links padrão'
        });
      }
    } catch (error) {
      console.error('Erro ao gerar links padrão:', error);
      toast({
        variant: 'destructive',
        title: 'Erro de conexão',
        description: 'Não foi possível conectar ao servidor'
      });
    }
  };

  // Função para excluir um link de pagamento
  const deletePaymentLink = async () => {
    if (!linkToDelete) return;
    
    try {
      const response = await fetch(`/api/course-payment-links/${linkToDelete.paymentLinkId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({
          title: 'Link excluído',
          description: 'O link de pagamento foi excluído com sucesso'
        });
        // Atualizar a lista local removendo o link excluído
        setPaymentLinks(currentLinks => 
          currentLinks.filter(link => link.paymentLinkId !== linkToDelete.paymentLinkId)
        );
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao excluir link',
          description: data.message || 'Não foi possível excluir o link'
        });
      }
    } catch (error) {
      console.error('Erro ao excluir link:', error);
      toast({
        variant: 'destructive',
        title: 'Erro de conexão',
        description: 'Não foi possível conectar ao servidor'
      });
    } finally {
      setLinkToDelete(null);
    }
  };

  // Função para copiar o link para a área de transferência
  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link copiado',
      description: 'O link foi copiado para a área de transferência'
    });
  };
  
  // Helper para formatar o tipo de pagamento
  const formatBillingType = (billingType: string) => {
    const types: Record<string, string> = {
      'UNDEFINED': 'Qualquer forma',
      'BOLETO': 'Boleto',
      'CREDIT_CARD': 'Cartão de Crédito',
      'PIX': 'PIX',
      'BOLETO,PIX': 'Boleto/PIX'
    };
    
    return types[billingType] || billingType;
  };

  // Renderizar tela de erro de autenticação
  if (error?.includes('Sessão expirada') || error?.includes('não autenticado')) {
    return (
      <Card className="p-6 text-center">
        <div className="mb-4 text-amber-500">
          <div className="mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 mx-auto">
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">Sessão expirada</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sua sessão expirou ou você não está autenticado. Por favor, faça login novamente para acessar os links de pagamento.
          </p>
        </div>
        <div className="flex justify-center">
          <Button onClick={() => window.location.href = '/admin/login'}>
            Fazer Login
          </Button>
        </div>
      </Card>
    );
  }

  // Renderizar tela de erro genérico
  if (error) {
    return (
      <Card className="p-6 text-center">
        <div className="mb-4 text-red-500">
          <div className="mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 mx-auto">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">Erro ao carregar</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {error}
          </p>
        </div>
        <div className="flex justify-center">
          <Button onClick={() => fetchPaymentLinks()}>
            Tentar Novamente
          </Button>
        </div>
      </Card>
    );
  }

  // Renderizar estado de carregamento
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  // Função para lidar com a criação bem-sucedida de um link
  const handlePaymentLinkCreated = (newPaymentLink: any) => {
    // Adicionar o novo link à lista existente
    setPaymentLinks((currentLinks) => [newPaymentLink, ...currentLinks]);
    setIsCreatingPaymentLink(false);
    toast({
      title: 'Link de pagamento criado',
      description: 'O novo link de pagamento foi criado com sucesso'
    });
  };

  // Página principal
  return (
    <div className="space-y-6">
      {isCreatingPaymentLink && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-4xl max-h-[90vh] overflow-auto rounded-lg shadow-lg">
            <div className="sticky top-0 flex justify-between items-center p-4 border-b bg-background">
              <h2 className="text-xl font-semibold">Criar Link de Pagamento</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsCreatingPaymentLink(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </div>
            <div className="p-4">
              <PaymentLinkCreator 
                courseId={courseId}
                courseName={courseName}
                coursePrice={coursePrice}
                onSuccess={handlePaymentLinkCreated}
                onCancel={() => setIsCreatingPaymentLink(false)}
              />
            </div>
          </div>
        </div>
      )}
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="links">Links de Pagamento</TabsTrigger>
            <TabsTrigger value="help">Ajuda</TabsTrigger>
          </TabsList>
          
          <div className="space-x-2">
            <Button 
              variant="outline" 
              onClick={createStandardLinks}
            >
              Gerar Links Padrão
            </Button>
            <Button onClick={() => setIsCreatingPaymentLink(true)}>
              <Plus className="mr-2 h-4 w-4" /> Novo Link
            </Button>
          </div>
        </div>
        
        <TabsContent value="links" className="space-y-4">
          {paymentLinks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentLinks.map((link) => (
                <Card key={link.paymentLinkId} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{link.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{link.description}</p>
                      </div>
                      <Badge variant={link.paymentType === 'Black Friday' ? 'destructive' : 'secondary'}>
                        {link.paymentType}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Valor:</span>
                        <span className="font-bold">{formatCurrency(link.value)}</span>
                      </div>
                      
                      {link.installments > 1 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Parcelas:</span>
                          <span>
                            {link.installments}x de {formatCurrency(link.value / link.installments)}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Forma de Pagamento:</span>
                        <span>{formatBillingType(link.billingType)}</span>
                      </div>
                      
                      <div className="pt-2 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(link.paymentLinkUrl)}
                        >
                          <Copy className="h-4 w-4 mr-1" /> Copiar
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(link.paymentLinkUrl, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" /> Abrir
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => setLinkToDelete(link)}
                        >
                          <Trash className="h-4 w-4 mr-1" /> Excluir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border rounded-lg">
              <p className="text-muted-foreground mb-4">
                Nenhum link de pagamento encontrado para este curso.
              </p>
              <div className="space-x-4">
                <Button variant="outline" onClick={createStandardLinks}>
                  Gerar Links Padrão
                </Button>
                <Button onClick={() => setIsCreatingPaymentLink(true)}>
                  Criar Link Personalizado
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="help">
          <Card>
            <CardHeader>
              <CardTitle>Como usar os links de pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Os links de pagamento podem ser compartilhados com alunos para que realizem o pagamento diretamente pelo Asaas. 
                Você pode criar links personalizados ou utilizar os links padrão pré-configurados.
              </p>
              
              <div className="space-y-2">
                <h3 className="font-medium">Tipos de links:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Links Padrão:</strong> Opções pré-configuradas para boleto, cartão de crédito e PIX.</li>
                  <li><strong>Links Personalizados:</strong> Configurações personalizadas de valor, parcelamento e forma de pagamento.</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Ações disponíveis:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Copiar:</strong> Copie o link para compartilhar com alunos.</li>
                  <li><strong>Abrir:</strong> Visualize como o link aparece para os alunos.</li>
                  <li><strong>Excluir:</strong> Remova links de pagamento desnecessários.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Modal de confirmação de exclusão */}
      <AlertDialog open={!!linkToDelete} onOpenChange={(open) => !open && setLinkToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir link de pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este link de pagamento? Esta ação não pode ser desfeita.
              <div className="mt-2 p-2 border rounded bg-slate-50">
                <p className="font-medium">{linkToDelete?.name}</p>
                <p className="text-sm text-muted-foreground">{linkToDelete?.description}</p>
                <p className="text-sm mt-1">
                  Valor: {linkToDelete && formatCurrency(linkToDelete.value)}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deletePaymentLink}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}