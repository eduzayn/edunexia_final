import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, FileText, Download, PenLine, Search, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Interface para representar o contrato
interface Contract {
  id: number;
  enrollmentId: number;
  studentId: number;
  courseId: number;
  contractType: string;
  contractNumber: string;
  status: 'pending' | 'signed' | 'cancelled';
  totalValue: number;
  installments: number;
  installmentValue: number;
  paymentMethod: string;
  discount: number;
  createdAt: string;
  signatureDate: string | null;
  signatureData: string | null;
  additionalTerms: string | null;
  startDate: string;
  endDate: string;
  campus: string;
}

// Interface para representar os dados de assinatura
interface ContractSignatureData {
  signatureData: string;
}

// Interface para representar o curso
interface Course {
  id: number;
  name: string;
  code: string;
}

// Componente para assinatura digital simples
const SignatureCanvas = ({ onSign }: { onSign: (signature: string) => void }) => {
  const [signature, setSignature] = useState("");
  
  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignature(e.target.value);
  };
  
  const handleSubmit = () => {
    if (signature.trim()) {
      onSign(signature);
    }
  };
  
  return (
    <div className="space-y-4">
      <p className="text-sm">Digite seu nome completo abaixo para assinar digitalmente:</p>
      <Input 
        type="text" 
        placeholder="Digite seu nome completo" 
        value={signature} 
        onChange={handleSignatureChange}
      />
      <Button 
        onClick={handleSubmit} 
        disabled={!signature.trim()}
        className="w-full"
      >
        Assinar Contrato
      </Button>
    </div>
  );
};

// Componente para exibir informações detalhadas do contrato
const ContractDetails = ({ contract }: { contract: Contract }) => {
  // Função para formatar o método de pagamento
  const formatPaymentMethod = (method: string) => {
    const methods: Record<string, string> = {
      'boleto': 'Boleto Bancário',
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'pix': 'PIX',
      'bank_transfer': 'Transferência Bancária',
      'cash': 'Dinheiro',
      'installment': 'Parcelamento'
    };
    
    return methods[method] || method;
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-semibold">Número do Contrato</h4>
          <p className="text-sm">{contract.contractNumber}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Status</h4>
          <div>
            {contract.status === 'signed' ? (
              <Badge variant="success" className="bg-green-600">Assinado</Badge>
            ) : contract.status === 'pending' ? (
              <Badge variant="outline" className="border-yellow-500 text-yellow-500">Pendente</Badge>
            ) : (
              <Badge variant="destructive">Cancelado</Badge>
            )}
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-semibold">Informações Financeiras</h4>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <p className="text-xs text-muted-foreground">Valor Total</p>
            <p className="text-sm">{formatCurrency(contract.totalValue)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Parcelas</p>
            <p className="text-sm">{contract.installments}x de {formatCurrency(contract.installmentValue)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Forma de Pagamento</p>
            <p className="text-sm">{formatPaymentMethod(contract.paymentMethod)}</p>
          </div>
          {contract.discount > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">Desconto</p>
              <p className="text-sm">{contract.discount}%</p>
            </div>
          )}
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-semibold">Período do Curso</h4>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <p className="text-xs text-muted-foreground">Data de Início</p>
            <p className="text-sm">{formatDate(new Date(contract.startDate))}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Data de Término</p>
            <p className="text-sm">{formatDate(new Date(contract.endDate))}</p>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-semibold">Campus</h4>
        <p className="text-sm">{contract.campus}</p>
      </div>
      
      {contract.status === 'signed' && contract.signatureDate && (
        <div>
          <h4 className="text-sm font-semibold">Informações da Assinatura</h4>
          <div className="grid grid-cols-1 gap-2 mt-2">
            <div>
              <p className="text-xs text-muted-foreground">Data da Assinatura</p>
              <p className="text-sm">{formatDate(new Date(contract.signatureDate))}</p>
            </div>
            {contract.signatureData && (
              <div>
                <p className="text-xs text-muted-foreground">Assinatura</p>
                <p className="text-sm italic">{contract.signatureData}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Página principal de contratos
export default function ContractsPage() {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();
  
  // Buscar contratos do estudante
  const { data: contracts, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/student/contracts'],
    retry: false
  });
  
  // Obter cursos únicos para exibir nomes
  const [courses, setCourses] = useState<Record<number, Course>>({});
  
  useEffect(() => {
    if (contracts?.data) {
      const uniqueCourseIds = [...new Set(contracts.data.map((contract: Contract) => contract.courseId))];
      
      // Buscar informações dos cursos
      const fetchCourses = async () => {
        const courseMap: Record<number, Course> = {};
        
        // Em um sistema real, você buscaria os cursos da API
        // Aqui vamos simular com dados básicos
        for (const courseId of uniqueCourseIds) {
          courseMap[courseId] = {
            id: courseId,
            name: `Curso ID ${courseId}`,
            code: `C${courseId}`
          };
        }
        
        setCourses(courseMap);
      };
      
      fetchCourses();
    }
  }, [contracts]);
  
  // Função para baixar contrato
  const handleDownloadContract = async (contractId: number) => {
    try {
      // Redirecionamento para API de download
      window.open(`/api/contracts/${contractId}/download`, '_blank');
    } catch (error) {
      console.error('Erro ao baixar contrato:', error);
      toast({
        title: "Erro ao baixar contrato",
        description: "Não foi possível baixar o contrato. Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };
  
  // Função para assinar contrato
  const handleSignContract = async (contractId: number, signatureData: string) => {
    try {
      const payload: ContractSignatureData = {
        signatureData
      };
      
      const response = await apiRequest('POST', `/api/contracts/${contractId}/sign`, payload);
      
      if (response.ok) {
        toast({
          title: "Contrato assinado com sucesso",
          description: "Seu contrato foi assinado com sucesso.",
          variant: "default"
        });
        
        // Fechar o diálogo e atualizar os dados
        setIsSignatureDialogOpen(false);
        refetch();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao assinar contrato');
      }
    } catch (error: any) {
      console.error('Erro ao assinar contrato:', error);
      toast({
        title: "Erro ao assinar contrato",
        description: error.message || "Não foi possível assinar o contrato. Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };
  
  // Filtrar contratos com base na pesquisa
  const filteredContracts = contracts?.data ? contracts.data.filter((contract: Contract) => {
    return contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
           contract.contractType.toLowerCase().includes(searchTerm.toLowerCase()) ||
           courses[contract.courseId]?.name.toLowerCase().includes(searchTerm.toLowerCase());
  }) : [];
  
  // Separar contratos por status
  const pendingContracts = filteredContracts.filter((contract: Contract) => contract.status === 'pending');
  const signedContracts = filteredContracts.filter((contract: Contract) => contract.status === 'signed');
  
  // Contratos a serem exibidos com base na aba ativa
  const contractsToShow = activeTab === 'all' ? filteredContracts :
                          activeTab === 'pending' ? pendingContracts :
                          activeTab === 'signed' ? signedContracts : [];
  
  // Componente de carregamento
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando contratos...</span>
      </div>
    );
  }
  
  // Componente de erro
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Erro ao carregar contratos</h2>
        <p className="text-muted-foreground mb-4">Não foi possível carregar seus contratos. Por favor, tente novamente mais tarde.</p>
        <Button onClick={() => refetch()}>Tentar novamente</Button>
      </div>
    );
  }
  
  // Selecionar contrato para mostrar detalhes ou assinar
  const selectedContract = selectedContractId 
    ? filteredContracts.find((contract: Contract) => contract.id === selectedContractId) 
    : null;
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Meus Contratos</h1>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar contratos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="text-center">
            Todos
            <Badge variant="secondary" className="ml-2">{filteredContracts.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-center">
            Pendentes
            <Badge variant="secondary" className="ml-2">{pendingContracts.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="signed" className="text-center">
            Assinados
            <Badge variant="secondary" className="ml-2">{signedContracts.length}</Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {filteredContracts.length === 0 ? (
            <div className="text-center py-12 border rounded-md bg-muted/20">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum contrato encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Nenhum contrato corresponde à sua pesquisa." : "Você ainda não possui contratos."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredContracts.map((contract: Contract) => (
                <Card key={contract.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{courses[contract.courseId]?.name || `Curso ID ${contract.courseId}`}</CardTitle>
                      {contract.status === 'signed' ? (
                        <Badge variant="success" className="bg-green-600">Assinado</Badge>
                      ) : contract.status === 'pending' ? (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-500">Pendente</Badge>
                      ) : (
                        <Badge variant="destructive">Cancelado</Badge>
                      )}
                    </div>
                    <CardDescription>
                      Contrato: {contract.contractNumber}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-0">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Valor Total</p>
                        <p>{formatCurrency(contract.totalValue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Parcelas</p>
                        <p>{contract.installments}x de {formatCurrency(contract.installmentValue)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Período</p>
                        <p>{formatDate(new Date(contract.startDate))} a {formatDate(new Date(contract.endDate))}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-4 pb-4">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => { 
                              setSelectedContractId(contract.id);
                              setIsDetailDialogOpen(true);
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Detalhes
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ver detalhes do contrato</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <div className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDownloadContract(contract.id)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Baixar contrato (PDF)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {contract.status === 'pending' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => {
                                  setSelectedContractId(contract.id);
                                  setIsSignatureDialogOpen(true);
                                }}
                              >
                                <PenLine className="h-4 w-4 mr-1" />
                                Assinar
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Assinar contrato</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="pending" className="mt-6">
          {pendingContracts.length === 0 ? (
            <div className="text-center py-12 border rounded-md bg-muted/20">
              <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum contrato pendente</h3>
              <p className="text-muted-foreground">
                Todos os seus contratos já foram assinados.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingContracts.map((contract: Contract) => (
                <Card key={contract.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{courses[contract.courseId]?.name || `Curso ID ${contract.courseId}`}</CardTitle>
                      <Badge variant="outline" className="border-yellow-500 text-yellow-500">Pendente</Badge>
                    </div>
                    <CardDescription>
                      Contrato: {contract.contractNumber}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-0">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Valor Total</p>
                        <p>{formatCurrency(contract.totalValue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Parcelas</p>
                        <p>{contract.installments}x de {formatCurrency(contract.installmentValue)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Período</p>
                        <p>{formatDate(new Date(contract.startDate))} a {formatDate(new Date(contract.endDate))}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-4 pb-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => { 
                        setSelectedContractId(contract.id);
                        setIsDetailDialogOpen(true);
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Detalhes
                    </Button>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadContract(contract.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => {
                          setSelectedContractId(contract.id);
                          setIsSignatureDialogOpen(true);
                        }}
                      >
                        <PenLine className="h-4 w-4 mr-1" />
                        Assinar
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="signed" className="mt-6">
          {signedContracts.length === 0 ? (
            <div className="text-center py-12 border rounded-md bg-muted/20">
              <PenLine className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum contrato assinado</h3>
              <p className="text-muted-foreground">
                Você ainda não assinou nenhum contrato.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {signedContracts.map((contract: Contract) => (
                <Card key={contract.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{courses[contract.courseId]?.name || `Curso ID ${contract.courseId}`}</CardTitle>
                      <Badge variant="success" className="bg-green-600">Assinado</Badge>
                    </div>
                    <CardDescription>
                      Contrato: {contract.contractNumber}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-0">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Valor Total</p>
                        <p>{formatCurrency(contract.totalValue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Parcelas</p>
                        <p>{contract.installments}x de {formatCurrency(contract.installmentValue)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Assinado em</p>
                        <p>{contract.signatureDate ? formatDate(new Date(contract.signatureDate)) : 'Data não disponível'}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-4 pb-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => { 
                        setSelectedContractId(contract.id);
                        setIsDetailDialogOpen(true);
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Detalhes
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadContract(contract.id)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Baixar
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Diálogo para detalhes do contrato */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Contrato</DialogTitle>
            <DialogDescription>
              Informações detalhadas do contrato selecionado.
            </DialogDescription>
          </DialogHeader>
          
          {selectedContract && (
            <ContractDetails contract={selectedContract} />
          )}
          
          <DialogFooter className="sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => setIsDetailDialogOpen(false)}
            >
              Fechar
            </Button>
            
            <Button
              variant="outline"
              onClick={() => selectedContract && handleDownloadContract(selectedContract.id)}
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para assinar contrato */}
      <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assinar Contrato</DialogTitle>
            <DialogDescription>
              Ao assinar este contrato, você concorda com todos os termos e condições nele estabelecidos.
            </DialogDescription>
          </DialogHeader>
          
          {selectedContract && (
            <div className="py-4">
              <p className="mb-4 text-sm">
                Por favor, leia o contrato completo antes de assinar. Você pode baixar uma cópia para leitura clicando no botão abaixo.
              </p>
              
              <Button
                variant="outline"
                className="w-full mb-6"
                onClick={() => selectedContract && handleDownloadContract(selectedContract.id)}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar e Ler Contrato
              </Button>
              
              <SignatureCanvas 
                onSign={(signature) => selectedContract && handleSignContract(selectedContract.id, signature)} 
              />
            </div>
          )}
          
          <DialogFooter className="sm:justify-start">
            <Button
              variant="secondary"
              onClick={() => setIsSignatureDialogOpen(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}