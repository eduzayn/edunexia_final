import React, { useState, useEffect } from 'react';
import StudentLayout from '@/components/layout/student-layout';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Button 
} from '@/components/ui/button';
import { 
  InputOTP, 
  InputOTPGroup, 
  InputOTPSeparator, 
  InputOTPSlot 
} from "@/components/ui/input-otp";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Badge 
} from '@/components/ui/badge';
import { 
  Input 
} from '@/components/ui/input';
import { 
  Separator 
} from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Download, Search, FileText, Clock, Check, AlertTriangle } from 'lucide-react';

// Usando as variantes de badge diretamente do componente, sem tipo customizado

// Interface para representar um contrato
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

// Interface para dados de assinatura
interface ContractSignatureData {
  signatureData: string;
}

// Interface para representar um curso
interface Course {
  id: number;
  name: string;
  code: string;
}

// Componente para mostrar detalhes do contrato
const ContractDetails = ({ contract }: { contract: Contract }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium">Número do Contrato</h3>
          <p className="text-sm">{contract.contractNumber}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium">Tipo de Contrato</h3>
          <p className="text-sm">{contract.contractType}</p>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="text-sm font-medium">Valores</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
          <div>
            <p className="text-xs text-muted-foreground">Valor Total</p>
            <p className="text-sm">R$ {contract.totalValue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Parcelas</p>
            <p className="text-sm">{contract.installments}x de R$ {contract.installmentValue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Forma de Pagamento</p>
            <p className="text-sm">{contract.paymentMethod}</p>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="text-sm font-medium">Datas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
          <div>
            <p className="text-xs text-muted-foreground">Data de Criação</p>
            <p className="text-sm">{new Date(contract.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Início</p>
            <p className="text-sm">{new Date(contract.startDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Término</p>
            <p className="text-sm">{new Date(contract.endDate).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
      
      {contract.signatureDate && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-medium">Assinatura</h3>
            <div className="grid grid-cols-1 gap-2 mt-2">
              <div>
                <p className="text-xs text-muted-foreground">Data de Assinatura</p>
                <p className="text-sm">{new Date(contract.signatureDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </>
      )}
      
      {contract.additionalTerms && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-medium">Termos Adicionais</h3>
            <p className="text-sm mt-2">{contract.additionalTerms}</p>
          </div>
        </>
      )}
    </div>
  );
};

// Componente principal
export default function ContractsPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [contracts, setContracts] = useState<{data: Contract[]}>({data: []});
  const [courses, setCourses] = useState<Record<number, Course>>({});
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signature, setSignature] = useState('');
  const [contractToSign, setContractToSign] = useState<number | null>(null);
  const [courseFilter, setCourseFilter] = useState<number | null>(null);

  // Dados de exemplo para demonstração (usado quando a API falha)
  const demoContracts = {
    data: [
      {
        id: 1,
        enrollmentId: 101,
        studentId: 1,
        courseId: 1,
        contractType: "Prestação de Serviços Educacionais",
        contractNumber: "CTR-2025-0001",
        status: 'pending' as const,
        totalValue: 12900.00,
        installments: 12,
        installmentValue: 1075.00,
        paymentMethod: "Cartão de Crédito",
        discount: 0,
        createdAt: "2025-04-01T10:00:00Z",
        signatureDate: null,
        signatureData: null,
        additionalTerms: "Contrato de prestação de serviços para o curso de MBA em Gestão Empresarial.",
        startDate: "2025-04-15T00:00:00Z",
        endDate: "2026-04-15T00:00:00Z",
        campus: "Online"
      },
      {
        id: 2,
        enrollmentId: 102,
        studentId: 1,
        courseId: 2,
        contractType: "Prestação de Serviços Educacionais",
        contractNumber: "CTR-2025-0002",
        status: 'signed' as const,
        totalValue: 9800.00,
        installments: 10,
        installmentValue: 980.00,
        paymentMethod: "Boleto Bancário",
        discount: 200,
        createdAt: "2025-03-15T14:30:00Z",
        signatureDate: "2025-03-16T09:15:00Z",
        signatureData: "123456",
        additionalTerms: null,
        startDate: "2025-04-01T00:00:00Z",
        endDate: "2026-10-01T00:00:00Z",
        campus: "São Paulo"
      },
      {
        id: 3,
        enrollmentId: 103,
        studentId: 1,
        courseId: 3,
        contractType: "Matrícula Simplificada",
        contractNumber: "CTR-2025-0003",
        status: 'pending' as const,
        totalValue: 7500.00,
        installments: 6,
        installmentValue: 1250.00,
        paymentMethod: "Pix",
        discount: 0,
        createdAt: "2025-04-10T16:45:00Z",
        signatureDate: null,
        signatureData: null,
        additionalTerms: "Termos específicos para matrícula simplificada, incluindo acesso ao material digital.",
        startDate: "2025-05-01T00:00:00Z",
        endDate: "2025-11-01T00:00:00Z",
        campus: "Online"
      }
    ]
  };

  // Dados de exemplo para cursos
  const demoCourses: Record<number, Course> = {
    1: { id: 1, name: "MBA em Gestão Empresarial", code: "MBA-GE-2025" },
    2: { id: 2, name: "Segunda Graduação em Pedagogia", code: "GRAD-PED-2025" },
    3: { id: 3, name: "Pós-Graduação em Marketing Digital", code: "POS-MKT-2025" }
  };

  // Buscar usuário logado e contratos
  useEffect(() => {
    // Verificar se o usuário está logado
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Usuário não autenticado');
      setLoading(false);
      
      // Carregar dados de demonstração quando não há autenticação
      setContracts(demoContracts);
      setCourses(demoCourses);
      
      // Selecionar o primeiro contrato por padrão
      if (demoContracts.data.length > 0) {
        setSelectedContractId(demoContracts.data[0].id);
      }
      
      return;
    }

    // Buscar dados do usuário
    fetch('/api-json/user', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Erro ao buscar usuário');
        }
        
        // Verificar o tipo de conteúdo antes de tentar parsear como JSON
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Resposta do servidor não está no formato JSON');
        }
        
        return res.json().catch(error => {
          console.error('Erro ao parsear resposta como JSON:', error);
          throw new Error('Formato de resposta inválido');
        });
      })
      .then(userData => {
        setUser(userData);

        // Buscar contratos do aluno
        return fetch('/api-json/student/contracts', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      })
      .then(res => {
        if (!res.ok) {
          throw new Error('Erro ao buscar contratos');
        }
        
        // Verificar o tipo de conteúdo antes de tentar parsear como JSON
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Resposta do servidor não está no formato JSON');
        }
        
        return res.json().catch(error => {
          console.error('Erro ao parsear resposta como JSON:', error);
          throw new Error('Formato de resposta inválido');
        });
      })
      .then(contractsData => {
        // Se não houver contratos ou a resposta for inválida, usar dados de demonstração
        if (!contractsData || !contractsData.data || contractsData.data.length === 0) {
          setContracts(demoContracts);
          setCourses(demoCourses);
          
          // Selecionar o primeiro contrato por padrão
          if (demoContracts.data.length > 0) {
            setSelectedContractId(demoContracts.data[0].id);
          }
          
          setLoading(false);
          return null;
        }
        
        setContracts(contractsData);
        
        // Extrair IDs de cursos únicos e buscar informações dos cursos
        const uniqueCourseIds = Array.from(new Set(contractsData.data.map((contract: Contract) => contract.courseId)));
        const coursePromises = uniqueCourseIds.map(courseId => 
          fetch(`/api-json/admin/courses/${courseId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          .then(res => {
            if (!res.ok) {
              throw new Error(`Erro ao buscar curso ${courseId}`);
            }
            
            // Verificar o tipo de conteúdo antes de tentar parsear como JSON
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              throw new Error('Resposta do servidor não está no formato JSON');
            }
            
            return res.json().catch(error => {
              console.error(`Erro ao parsear resposta do curso ${courseId} como JSON:`, error);
              throw new Error('Formato de resposta inválido');
            });
          })
          .then(data => ({ id: courseId, data }))
          .catch(err => {
            console.error(`Erro ao buscar curso ${courseId}:`, err);
            return { id: courseId, name: 'Curso não encontrado', code: '' };
          })
        );
        
        return Promise.all(coursePromises);
      })
      .then(coursesData => {
        // Se os dados de cursos forem nulos, significa que já carregamos os dados de demonstração
        if (!coursesData) return;
        
        // Criar mapa de IDs de cursos para informações de cursos
        const coursesMap = coursesData.reduce((acc, course) => {
          acc[course.id] = course.data || { 
            id: course.id, 
            name: course.name || 'Curso não encontrado', 
            code: course.code || '' 
          };
          return acc;
        }, {} as Record<number, Course>);
        
        setCourses(coursesMap);
        
        // Selecionar o primeiro contrato por padrão
        if (contracts.data.length > 0) {
          setSelectedContractId(contracts.data[0].id);
        }
        
        setLoading(false);
      })
      .catch(error => {
        console.error('Erro:', error);
        toast({
          title: "Erro ao carregar dados da API",
          description: "Carregando dados de demonstração",
          variant: "destructive"
        });
        
        // Carregar dados de demonstração em caso de erro
        setContracts(demoContracts);
        setCourses(demoCourses);
        
        // Selecionar o primeiro contrato por padrão
        if (demoContracts.data.length > 0) {
          setSelectedContractId(demoContracts.data[0].id);
        }
        
        setLoading(false);
      });
  }, [toast]);

  // Função para baixar contrato
  const handleDownloadContract = async (contractId: number) => {
    try {
      const token = localStorage.getItem('token');
      
      // Para os dados de demonstração, simplesmente simular o download
      if (!user || !token) {
        // Mostrar um alerta de demonstração
        toast({
          title: "Modo de demonstração",
          description: "Em um ambiente real, o contrato seria baixado como PDF.",
          variant: "default"
        });
        return;
      }

      // Redirecionamento para API de download com token no URL
      window.open(`/api-json/contracts/${contractId}/download?token=${token}`, '_blank');
      
      console.log(`Solicitação de download do contrato ${contractId} enviada`);
      
      toast({
        title: "Download iniciado",
        description: "Seu contrato está sendo preparado para download.",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Erro ao baixar contrato:', error);
      toast({
        title: "Erro ao baixar contrato",
        description: error.message || "Não foi possível baixar o contrato. Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };
  
  // Função para assinar contrato
  const handleSignContract = async (contractId: number, signatureData: string) => {
    try {
      const token = localStorage.getItem('token');
      
      // Para os dados de demonstração, simular a assinatura
      if (!user || !token) {
        // Atualizar o contrato na lista localmente em modo de demonstração
        setContracts(prevState => {
          const updatedContracts = prevState.data.map(contract => 
            contract.id === contractId ? {
              ...contract,
              status: 'signed',
              signatureDate: new Date().toISOString(),
              signatureData
            } : contract
          );
          return { data: updatedContracts };
        });
        
        // Fechar o diálogo de assinatura
        setSignatureOpen(false);
        setSignature('');
        setContractToSign(null);
        
        // Mostrar mensagem de demonstração
        toast({
          title: "Modo de demonstração",
          description: "Contrato assinado com sucesso (simulação).",
          variant: "default"
        });
        return;
      }
      
      const payload: ContractSignatureData = {
        signatureData
      };
      
      // Usar o formato api-json
      const response = await fetch(`/api-json/contracts/${contractId}/sign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      // Verificar resposta
      if (!response.ok) {
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao assinar contrato');
          } else {
            throw new Error('Erro ao assinar contrato: resposta do servidor inválida');
          }
        } catch (parseError) {
          throw new Error('Erro ao assinar contrato: resposta do servidor inválida');
        }
      }
      
      // Verificar o tipo de conteúdo antes de tentar parsear como JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Resposta do servidor não está no formato JSON');
      }
      
      let responseData;
      try {
        responseData = await response.json();
      } catch (error) {
        console.error('Erro ao parsear resposta como JSON:', error);
        throw new Error('Formato de resposta inválido ao assinar contrato');
      }
      
      // Atualizar o contrato na lista
      setContracts(prevState => {
        const updatedContracts = prevState.data.map(contract => 
          contract.id === contractId ? responseData.data : contract
        );
        return { data: updatedContracts };
      });
      
      // Fechar o diálogo de assinatura
      setSignatureOpen(false);
      setSignature('');
      setContractToSign(null);
      
      // Mostrar mensagem de sucesso
      toast({
        title: "Contrato assinado",
        description: "Seu contrato foi assinado com sucesso.",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Erro ao assinar contrato:', error);
      toast({
        title: "Erro ao assinar contrato",
        description: error.message || "Não foi possível assinar o contrato. Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };
  
  // Filtrar contratos pelo termo de busca e curso selecionado
  const filteredContracts = contracts?.data ? contracts.data.filter((contract: Contract) => {
    const contractType = contract.contractType?.toLowerCase() || '';
    const contractNumber = contract.contractNumber?.toLowerCase() || '';
    const courseName = courses[contract.courseId]?.name?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    // Filtrar por termo de busca
    const matchesSearch = 
      contractType.includes(search) || 
      contractNumber.includes(search) || 
      courseName.includes(search);
    
    // Filtrar por curso
    const matchesCourse = courseFilter === null || contract.courseId === courseFilter;
    
    return matchesSearch && matchesCourse;
  }) : [];
  
  // Separar contratos por status
  const pendingContracts = filteredContracts.filter((contract: Contract) => contract.status === 'pending');
  const signedContracts = filteredContracts.filter((contract: Contract) => contract.status === 'signed');
  
  // Obter contrato selecionado
  const selectedContract = selectedContractId !== null 
    ? filteredContracts.find((contract: Contract) => contract.id === selectedContractId) 
    : null;
  
  // Função para obter o status do contrato como badge
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, {text: string, variant: "default" | "destructive" | "outline" | "secondary", icon: React.ReactNode}> = {
      pending: {
        text: 'Pendente',
        variant: 'secondary',
        icon: <Clock className="h-3 w-3 mr-1" />
      },
      signed: {
        text: 'Assinado',
        variant: 'default',
        icon: <Check className="h-3 w-3 mr-1" />
      },
      cancelled: {
        text: 'Cancelado',
        variant: 'destructive',
        icon: <AlertTriangle className="h-3 w-3 mr-1" />
      }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} className="inline-flex items-center">
        {config.icon}
        {config.text}
      </Badge>
    );
  };
  
  // Renderizar página de contratos
  return (
    <StudentLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Meus Contratos</h1>
        
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
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
          
          <div className="w-full sm:w-64">
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
              value={courseFilter === null ? '' : courseFilter}
              onChange={(e) => setCourseFilter(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Todos os cursos</option>
              {Object.values(courses).map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="all" className="flex-1">Todos</TabsTrigger>
                <TabsTrigger value="pending" className="flex-1">Pendentes</TabsTrigger>
                <TabsTrigger value="signed" className="flex-1">Assinados</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-0">
                <div className="space-y-4">
                  {loading ? (
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">Carregando contratos...</p>
                      </CardContent>
                    </Card>
                  ) : filteredContracts.length === 0 ? (
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">Nenhum contrato encontrado</p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredContracts.map((contract: Contract) => (
                      <Card 
                        key={contract.id} 
                        className={`cursor-pointer hover:border-primary/50 transition-colors ${selectedContractId === contract.id ? 'border-primary' : ''}`}
                        onClick={() => setSelectedContractId(contract.id)}
                      >
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base">{courses[contract.courseId]?.name || 'Curso não identificado'}</CardTitle>
                            {getStatusBadge(contract.status)}
                          </div>
                          <CardDescription>
                            Contrato: {contract.contractNumber}
                          </CardDescription>
                        </CardHeader>
                        <CardFooter className="p-4 pt-2 flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            {new Date(contract.createdAt).toLocaleDateString()}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadContract(contract.id);
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="pending" className="mt-0">
                <div className="space-y-4">
                  {loading ? (
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">Carregando contratos...</p>
                      </CardContent>
                    </Card>
                  ) : pendingContracts.length === 0 ? (
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">Nenhum contrato pendente encontrado</p>
                      </CardContent>
                    </Card>
                  ) : (
                    pendingContracts.map((contract: Contract) => (
                      <Card 
                        key={contract.id} 
                        className={`cursor-pointer hover:border-primary/50 transition-colors ${selectedContractId === contract.id ? 'border-primary' : ''}`}
                        onClick={() => setSelectedContractId(contract.id)}
                      >
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base">{courses[contract.courseId]?.name || 'Curso não identificado'}</CardTitle>
                            {getStatusBadge(contract.status)}
                          </div>
                          <CardDescription>
                            Contrato: {contract.contractNumber}
                          </CardDescription>
                        </CardHeader>
                        <CardFooter className="p-4 pt-2 flex justify-between">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setContractToSign(contract.id);
                              setSignatureOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Assinar
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadContract(contract.id);
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="signed" className="mt-0">
                <div className="space-y-4">
                  {loading ? (
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">Carregando contratos...</p>
                      </CardContent>
                    </Card>
                  ) : signedContracts.length === 0 ? (
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">Nenhum contrato assinado encontrado</p>
                      </CardContent>
                    </Card>
                  ) : (
                    signedContracts.map((contract: Contract) => (
                      <Card 
                        key={contract.id} 
                        className={`cursor-pointer hover:border-primary/50 transition-colors ${selectedContractId === contract.id ? 'border-primary' : ''}`}
                        onClick={() => setSelectedContractId(contract.id)}
                      >
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base">{courses[contract.courseId]?.name || 'Curso não identificado'}</CardTitle>
                            {getStatusBadge(contract.status)}
                          </div>
                          <CardDescription>
                            Contrato: {contract.contractNumber}
                          </CardDescription>
                        </CardHeader>
                        <CardFooter className="p-4 pt-2 flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Assinado em: {contract.signatureDate ? new Date(contract.signatureDate).toLocaleDateString() : 'N/A'}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadContract(contract.id);
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="lg:col-span-2">
            {selectedContract ? (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{courses[selectedContract.courseId]?.name || 'Curso não identificado'}</CardTitle>
                      <CardDescription>
                        {selectedContract.contractType} | {selectedContract.contractNumber}
                      </CardDescription>
                    </div>
                    {getStatusBadge(selectedContract.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <ContractDetails contract={selectedContract} />
                </CardContent>
                <CardFooter className="flex justify-between">
                  {selectedContract.status === 'pending' && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setContractToSign(selectedContract.id);
                        setSignatureOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Assinar Contrato
                    </Button>
                  )}
                  <Button 
                    variant="default" 
                    onClick={() => handleDownloadContract(selectedContract.id)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Baixar Contrato
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <Card>
                <CardContent className="h-[400px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Selecione um contrato para visualizar os detalhes</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {/* Diálogo de assinatura */}
      <Dialog open={signatureOpen} onOpenChange={setSignatureOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assinar Contrato</DialogTitle>
            <DialogDescription>
              Digite seu código de assinatura para assinar o contrato digitalmente.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex justify-center my-4">
              <InputOTP 
                maxLength={6} 
                value={signature}
                onChange={setSignature}
                render={({ slots }) => (
                  <div className="flex gap-2">
                    {slots.map((slot, index) => (
                      <InputOTPSlot key={index} {...slot} />
                    ))}
                  </div>
                )}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Este código será registrado como sua assinatura eletrônica para este contrato.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setSignatureOpen(false);
                setSignature('');
                setContractToSign(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              disabled={signature.length < 6 || !contractToSign} 
              onClick={() => contractToSign && handleSignContract(contractToSign, signature)}
            >
              Assinar Contrato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StudentLayout>
  );
}