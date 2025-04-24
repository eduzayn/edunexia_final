import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, FileText, Download, PenLine, AlertTriangle, CheckCircle, Search, Clock, X, Filter } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

// Tipos para os contratos
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

interface ContractSignatureData {
  signatureData: string;
}

interface Course {
  id: number;
  name: string;
  code: string;
}

// Componente para formatação de valor em reais
const FormatCurrency = ({ value }: { value: number }) => {
  return (
    <span>
      {new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value)}
    </span>
  );
};

// Componente para mostrar o status do contrato
const ContractStatus = ({ status }: { status: string }) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-amber-100"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
    case 'signed':
      return <Badge variant="outline" className="bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Assinado</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="bg-red-100"><X className="h-3 w-3 mr-1" />Cancelado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Componente para formatação de método de pagamento
const FormatPaymentMethod = ({ method }: { method: string }) => {
  const methods: Record<string, string> = {
    'credit_card': 'Cartão de Crédito',
    'debit_card': 'Cartão de Débito',
    'bank_slip': 'Boleto Bancário',
    'bank_transfer': 'Transferência Bancária',
    'pix': 'PIX',
    'cash': 'Dinheiro',
    'other': 'Outro'
  };
  
  return <span>{methods[method] || method}</span>;
};

// Componente para formatação de tipo de contrato
const FormatContractType = ({ type }: { type: string }) => {
  const types: Record<string, string> = {
    'default': 'Padrão',
    'pos-graduacao': 'Pós-Graduação',
    'mba': 'MBA',
    'graduacao': 'Graduação',
  };
  
  return <span>{types[type] || type}</span>;
};

// Componente principal
const ContractsPage = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false);
  const [isSignatureLoading, setIsSignatureLoading] = useState(false);
  const [signatureData, setSignatureData] = useState<string>('');
  const [courses, setCourses] = useState<Record<number, Course>>({});
  
  // Buscar contratos do estudante
  const { 
    data: contracts, 
    isLoading, 
    error, 
    refetch
  } = useQuery({
    queryKey: ['/api/student/contracts'],
    enabled: isAuthenticated,
  });
  
  // Função para buscar informações do curso
  const fetchCourseInfo = async (courseId: number) => {
    try {
      const response = await apiRequest('GET', `/api/courses/${courseId}`);
      const courseData = await response.json();
      
      if (courseData && courseData.success) {
        setCourses(prev => ({
          ...prev,
          [courseId]: courseData.data
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar informações do curso:', error);
    }
  };
  
  // Buscar informações dos cursos quando os contratos forem carregados
  useEffect(() => {
    if (contracts && contracts.data) {
      const uniqueCourseIds = [...new Set(contracts.data.map((contract: Contract) => contract.courseId))];
      
      uniqueCourseIds.forEach(courseId => {
        if (!courses[courseId]) {
          fetchCourseInfo(courseId);
        }
      });
    }
  }, [contracts]);
  
  // Função para baixar contrato
  const handleDownloadContract = (contractId: number) => {
    try {
      // Criar um link para download do PDF
      const link = document.createElement('a');
      link.href = `/api/contracts/${contractId}/download`;
      link.target = '_blank';
      link.download = `contrato-${contractId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar contrato:', error);
      toast({
        title: 'Erro ao baixar contrato',
        description: 'Ocorreu um erro ao tentar baixar o contrato. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    }
  };
  
  // Função para assinar contrato
  const handleSignContract = async (contractId: number) => {
    if (!signatureData) {
      toast({
        title: 'Dados de assinatura incompletos',
        description: 'Por favor, forneça sua assinatura digital para continuar.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSignatureLoading(true);
    
    try {
      const payload: ContractSignatureData = {
        signatureData: signatureData
      };
      
      const response = await apiRequest('POST', `/api/contracts/${contractId}/sign`, payload);
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Contrato assinado com sucesso!',
          description: 'Seu contrato foi assinado e está disponível para download.',
          variant: 'default',
        });
        
        setIsSignDialogOpen(false);
        refetch(); // Atualizar a lista de contratos
      } else {
        throw new Error(result.message || 'Erro ao assinar contrato');
      }
    } catch (error) {
      console.error('Erro ao assinar contrato:', error);
      toast({
        title: 'Erro ao assinar contrato',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao tentar assinar o contrato. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsSignatureLoading(false);
    }
  };
  
  // Filtrar contratos com base na busca e filtros
  const filteredContracts = contracts?.data ? contracts.data.filter((contract: Contract) => {
    const matchesSearch = 
      searchTerm === '' || 
      contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (courses[contract.courseId]?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === '' || contract.status === filterStatus;
    const matchesType = filterType === '' || contract.contractType === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  }) : [];
  
  // Agrupar contratos por status
  const pendingContracts = filteredContracts.filter((contract: Contract) => contract.status === 'pending');
  const signedContracts = filteredContracts.filter((contract: Contract) => contract.status === 'signed');
  const allContracts = filteredContracts;
  
  // Função para formatar data
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: pt });
    } catch (error) {
      return 'Data inválida';
    }
  };
  
  // Se o usuário não estiver autenticado, redirecionar para a página de login
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Meus Contratos</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie seus contratos educacionais
          </p>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar contratos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="signed">Assinados</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="default">Padrão</SelectItem>
              <SelectItem value="pos-graduacao">Pós-Graduação</SelectItem>
              <SelectItem value="mba">MBA</SelectItem>
              <SelectItem value="graduacao">Graduação</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando contratos...</span>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <AlertTriangle className="h-8 w-8 text-amber-500 mr-2" />
            <div>
              <h3 className="font-semibold">Erro ao carregar contratos</h3>
              <p className="text-sm text-muted-foreground">Ocorreu um erro ao buscar seus contratos. Tente novamente.</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              Todos ({allContracts.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pendentes ({pendingContracts.length})
            </TabsTrigger>
            <TabsTrigger value="signed">
              Assinados ({signedContracts.length})
            </TabsTrigger>
          </TabsList>
          
          {/* Tabela de todos os contratos */}
          <TabsContent value="all">
            {allContracts.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Contrato</TableHead>
                          <TableHead>Curso</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allContracts.map((contract: Contract) => (
                          <TableRow key={contract.id}>
                            <TableCell>{contract.contractNumber}</TableCell>
                            <TableCell>{courses[contract.courseId]?.name || 'Carregando...'}</TableCell>
                            <TableCell><FormatContractType type={contract.contractType} /></TableCell>
                            <TableCell><FormatCurrency value={contract.totalValue} /></TableCell>
                            <TableCell><ContractStatus status={contract.status} /></TableCell>
                            <TableCell>{formatDate(contract.createdAt)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  title="Baixar contrato"
                                  onClick={() => handleDownloadContract(contract.id)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                
                                {contract.status === 'pending' && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    title="Assinar contrato"
                                    onClick={() => {
                                      setSelectedContract(contract);
                                      setIsSignDialogOpen(true);
                                    }}
                                  >
                                    <PenLine className="h-4 w-4" />
                                  </Button>
                                )}
                                
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  title="Ver detalhes"
                                  onClick={() => setSelectedContract(contract)}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
                  <p className="text-center">Nenhum contrato encontrado.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Tabela de contratos pendentes */}
          <TabsContent value="pending">
            {pendingContracts.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Contrato</TableHead>
                          <TableHead>Curso</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingContracts.map((contract: Contract) => (
                          <TableRow key={contract.id}>
                            <TableCell>{contract.contractNumber}</TableCell>
                            <TableCell>{courses[contract.courseId]?.name || 'Carregando...'}</TableCell>
                            <TableCell><FormatContractType type={contract.contractType} /></TableCell>
                            <TableCell><FormatCurrency value={contract.totalValue} /></TableCell>
                            <TableCell>{formatDate(contract.createdAt)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  title="Baixar contrato"
                                  onClick={() => handleDownloadContract(contract.id)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  title="Assinar contrato"
                                  onClick={() => {
                                    setSelectedContract(contract);
                                    setIsSignDialogOpen(true);
                                  }}
                                >
                                  <PenLine className="h-4 w-4" />
                                </Button>
                                
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  title="Ver detalhes"
                                  onClick={() => setSelectedContract(contract)}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                  <p className="text-center">Você não possui contratos pendentes de assinatura.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Tabela de contratos assinados */}
          <TabsContent value="signed">
            {signedContracts.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Contrato</TableHead>
                          <TableHead>Curso</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Data Assinatura</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {signedContracts.map((contract: Contract) => (
                          <TableRow key={contract.id}>
                            <TableCell>{contract.contractNumber}</TableCell>
                            <TableCell>{courses[contract.courseId]?.name || 'Carregando...'}</TableCell>
                            <TableCell><FormatContractType type={contract.contractType} /></TableCell>
                            <TableCell><FormatCurrency value={contract.totalValue} /></TableCell>
                            <TableCell>{contract.signatureDate ? formatDate(contract.signatureDate) : 'N/A'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  title="Baixar contrato"
                                  onClick={() => handleDownloadContract(contract.id)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  title="Ver detalhes"
                                  onClick={() => setSelectedContract(contract)}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
                  <p className="text-center">Você ainda não possui contratos assinados.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
      
      {/* Dialog para detalhes do contrato */}
      {selectedContract && (
        <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Contrato</DialogTitle>
              <DialogDescription>
                Contrato nº {selectedContract.contractNumber}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h3 className="font-medium">Informações Gerais</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <div className="mt-1"><ContractStatus status={selectedContract.status} /></div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>
                    <div className="mt-1"><FormatContractType type={selectedContract.contractType} /></div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data de Criação:</span>
                    <div>{formatDate(selectedContract.createdAt)}</div>
                  </div>
                  {selectedContract.signatureDate && (
                    <div>
                      <span className="text-muted-foreground">Data de Assinatura:</span>
                      <div>{formatDate(selectedContract.signatureDate)}</div>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="font-medium">Curso</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Nome do Curso:</span>
                    <div>{courses[selectedContract.courseId]?.name || 'Carregando...'}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Código do Curso:</span>
                    <div>{courses[selectedContract.courseId]?.code || 'Carregando...'}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Campus:</span>
                    <div>{selectedContract.campus}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data de Início:</span>
                    <div>{formatDate(selectedContract.startDate)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data de Término:</span>
                    <div>{formatDate(selectedContract.endDate)}</div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="font-medium">Informações Financeiras</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Valor Total:</span>
                    <div className="font-semibold"><FormatCurrency value={selectedContract.totalValue} /></div>
                  </div>
                  {selectedContract.discount > 0 && (
                    <div>
                      <span className="text-muted-foreground">Desconto:</span>
                      <div className="text-green-600"><FormatCurrency value={selectedContract.discount} /></div>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Número de Parcelas:</span>
                    <div>{selectedContract.installments}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valor da Parcela:</span>
                    <div><FormatCurrency value={selectedContract.installmentValue} /></div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Método de Pagamento:</span>
                    <div><FormatPaymentMethod method={selectedContract.paymentMethod} /></div>
                  </div>
                </div>
              </div>
              
              {selectedContract.additionalTerms && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="font-medium">Termos Adicionais</h3>
                    <div className="text-sm bg-muted p-2 rounded">
                      {selectedContract.additionalTerms}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <DialogFooter className="flex sm:justify-between">
              <Button variant="outline" onClick={() => setSelectedContract(null)}>
                Fechar
              </Button>
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => handleDownloadContract(selectedContract.id)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
                
                {selectedContract.status === 'pending' && (
                  <Button 
                    variant="default"
                    onClick={() => {
                      setIsSignDialogOpen(true);
                    }}
                  >
                    <PenLine className="h-4 w-4 mr-2" />
                    Assinar
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Dialog para assinar contrato */}
      <Dialog open={isSignDialogOpen} onOpenChange={setIsSignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assinar Contrato</DialogTitle>
            <DialogDescription>
              Assine digitalmente seu contrato educacional
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Ao assinar este contrato, você confirma que leu e concorda com todos os termos e condições estabelecidos.
            </p>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Assinatura Digital</label>
              <div className="border border-input rounded-md p-2 h-32">
                {/* Implementação básica de assinatura */}
                <Input
                  type="text"
                  placeholder="Digite seu nome completo para assinatura digital"
                  className="h-full"
                  value={signatureData}
                  onChange={(e) => setSignatureData(e.target.value)}
                />
                {/* Em uma implementação real, você poderia usar uma biblioteca de assinatura digital */}
              </div>
              <p className="text-xs text-muted-foreground">
                Digite seu nome completo acima para assinar o contrato digitalmente.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="default" 
              onClick={() => selectedContract && handleSignContract(selectedContract.id)}
              disabled={isSignatureLoading || !signatureData}
            >
              {isSignatureLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Assinatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </div>
  );
};

export default ContractsPage;