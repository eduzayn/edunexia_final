import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  FileText as FileTextIcon, 
  Download as DownloadIcon,
  Eye as EyeIcon,
  AlertTriangle as AlertTriangleIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  Search as SearchIcon,
  LayoutDashboard as DashboardIcon,
  BookOpen,
  GraduationCap,
  FileQuestion as FileQuestionIcon,
  BriefcaseBusiness,
  Handshake,
  Banknote,
  Calendar,
  MessagesSquare,
  User,
  Printer as PrinterIcon,
  Copy as CopyIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Sidebar } from "@/components/layout/sidebar";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";

// Definição do tipo de contrato
interface Contract {
  id: string;
  enrollmentId: string;
  studentId: number;
  studentName: string;
  courseId: number;
  courseName: string;
  contractNumber: string;
  createdAt: string;
  signedAt: string | null;
  status: 'PENDING' | 'SIGNED' | 'EXPIRED' | 'CANCELED';
  contractType: string;
  contractUrl: string | null;
  expiresAt: string | null;
  paymentInfo: {
    totalValue: number;
    installments: number;
    installmentValue: number;
    paymentMethod: string;
    discount?: number;
  };
  metadata?: {
    enrollmentDate?: string;
    startDate?: string;
    endDate?: string;
    campus?: string;
    modality?: string;
  };
}

export default function ContractsPage() {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const { toast } = useToast();
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Filtro de status
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Itens da barra lateral
  const sidebarItems = [
    { name: "Dashboard", icon: <DashboardIcon size={18} />, href: "/student/dashboard" },
    { name: "Meus Cursos", icon: <BookOpen size={18} />, href: "/student/courses" },
    { name: "Biblioteca", icon: <GraduationCap size={18} />, href: "/student/library" },
    { name: "Credencial", icon: <GraduationCap size={18} />, href: "/student/credential" },
    { name: "Avaliações", icon: <FileQuestionIcon size={18} />, href: "/student/assessments" },
    { name: "Estágios", icon: <BriefcaseBusiness size={18} />, href: "/student/internships" },
    { name: "Contratos", icon: <Handshake size={18} />, href: "/student/contracts", active: true },
    { name: "Financeiro", icon: <Banknote size={18} />, href: "/student/financial" },
    { name: "Calendário", icon: <Calendar size={18} />, href: "/student/calendar" },
    { name: "Mensagens", icon: <MessagesSquare size={18} />, href: "/student/messages" },
    { name: "Meu Perfil", icon: <User size={18} />, href: "/student/profile" },
  ];

  // Consulta os contratos do aluno
  const {
    data: contracts,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<Contract[]>({
    queryKey: ["/api-json/student/contracts"],
    queryFn: async () => {
      try {
        console.log("Tentando carregar contratos do aluno...");
        
        // Recuperar o token de autenticação
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.warn("Token de autenticação não encontrado");
          throw new Error('Autenticação necessária');
        }
        
        // Fazer requisição à API com token de autenticação
        const response = await fetch('/api/student/contracts', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Se a resposta não for OK (2xx), lançamos um erro
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            console.warn(`Erro de autenticação: ${response.status}`);
            throw new Error('Autenticação necessária');
          } else {
            throw new Error(`Erro ao carregar contratos: ${response.statusText}`);
          }
        }
        
        const data = await response.json();
        console.log("Contratos carregados com sucesso:", data.length || 0);
        return data;
      } catch (err) {
        console.error("Erro ao carregar contratos:", err);
        
        // Em ambiente de desenvolvimento, podemos mostrar dados de exemplo
        if (process.env.NODE_ENV === 'development') {
          console.log("Usando dados de exemplo para visualização da interface");
          
          // Dados de exemplo apenas para desenvolvimento
          return [
            {
              id: "contract_001",
              enrollmentId: "enr_123",
              studentId: 18,
              studentName: "Aluno Exemplo",
              courseId: 1,
              courseName: "Pós-Graduação em Educação Especial",
              contractNumber: "CONT-2025-001",
              createdAt: new Date().toISOString(),
              signedAt: null,
              status: 'PENDING' as const,
              contractType: "PÓS-GRADUAÇÃO",
              contractUrl: null,
              expiresAt: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
              paymentInfo: {
                totalValue: 2990.00,
                installments: 12,
                installmentValue: 249.17,
                paymentMethod: "BOLETO",
                discount: 100
              },
              metadata: {
                enrollmentDate: new Date().toISOString(),
                startDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString(),
                endDate: new Date(new Date().setMonth(new Date().getMonth() + 18)).toISOString(),
                campus: "Campus Virtual",
                modality: "EAD"
              }
            }
          ];
        }
        
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
  
  // Função para filtrar contratos
  const filteredContracts = contracts?.filter(contract => {
    // Filtro por status
    if (filterStatus !== "all") {
      if (filterStatus === "pending" && contract.status !== "PENDING") return false;
      if (filterStatus === "signed" && contract.status !== "SIGNED") return false;
      if (filterStatus === "expired" && contract.status !== "EXPIRED") return false;
      if (filterStatus === "canceled" && contract.status !== "CANCELED") return false;
    }
    
    // Filtro por termo de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        contract.courseName.toLowerCase().includes(searchLower) ||
        contract.contractNumber.toLowerCase().includes(searchLower) ||
        contract.contractType.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  // Paginação dos contratos filtrados
  const paginatedContracts = filteredContracts?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Total de páginas
  const totalPages = filteredContracts
    ? Math.ceil(filteredContracts.length / itemsPerPage)
    : 1;
  
  // Função para mudar de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Função para visualizar contrato
  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract);
    
    // Se tiver URL do contrato, abrir em nova aba
    if (contract.contractUrl) {
      window.open(contract.contractUrl, "_blank");
    } else {
      generateContractPreview(contract.id);
    }
  };
  
  // Função para baixar contrato
  const handleDownloadContract = async (contractId: string) => {
    try {
      // Recuperar o token de autenticação
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar autenticado para baixar o contrato",
          variant: "destructive",
        });
        return;
      }
      
      // Fazer requisição para baixar o contrato
      const response = await fetch(`/api/student/contracts/${contractId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao baixar contrato");
      }
      
      // Obter o blob do arquivo
      const blob = await response.blob();
      
      // Criar URL para download
      const url = window.URL.createObjectURL(blob);
      
      // Criar elemento <a> para download
      const a = document.createElement('a');
      a.href = url;
      a.download = `contrato-${contractId}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Limpar
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Contrato baixado com sucesso",
        description: "O arquivo PDF do contrato foi baixado para o seu dispositivo",
      });
    } catch (error) {
      console.error("Erro ao baixar contrato:", error);
      toast({
        title: "Erro ao baixar contrato",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao baixar o contrato",
        variant: "destructive",
      });
    }
  };
  
  // Função para assinar contrato digitalmente
  const handleSignContract = async (contractId: string) => {
    try {
      // Recuperar o token de autenticação
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar autenticado para assinar o contrato",
          variant: "destructive",
        });
        return;
      }
      
      // Fazer requisição para assinar o contrato
      const response = await fetch(`/api/student/contracts/${contractId}/sign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao assinar contrato");
      }
      
      // Atualizar a lista de contratos
      refetch();
      
      toast({
        title: "Contrato assinado com sucesso",
        description: "O contrato foi assinado digitalmente e está disponível para download",
      });
    } catch (error) {
      console.error("Erro ao assinar contrato:", error);
      toast({
        title: "Erro ao assinar contrato",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao assinar o contrato",
        variant: "destructive",
      });
    }
  };
  
  // Função para gerar preview do contrato
  const generateContractPreview = async (contractId: string) => {
    try {
      // Recuperar o token de autenticação
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar autenticado para visualizar o contrato",
          variant: "destructive",
        });
        return;
      }
      
      // Fazer requisição para gerar preview do contrato
      const response = await fetch(`/api/student/contracts/${contractId}/preview`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao gerar preview do contrato");
      }
      
      const data = await response.json();
      
      // Abrir URL do preview em nova aba
      if (data.previewUrl) {
        window.open(data.previewUrl, "_blank");
      } else {
        throw new Error("URL de preview não disponível");
      }
    } catch (error) {
      console.error("Erro ao gerar preview do contrato:", error);
      toast({
        title: "Erro ao visualizar contrato",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao gerar o preview do contrato",
        variant: "destructive",
      });
    }
  };
  
  // Função para imprimir contrato
  const handlePrintContract = async (contractId: string) => {
    try {
      // Recuperar o token de autenticação
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar autenticado para imprimir o contrato",
          variant: "destructive",
        });
        return;
      }
      
      // Fazer requisição para gerar preview do contrato (para impressão)
      const response = await fetch(`/api/student/contracts/${contractId}/preview`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao gerar preview do contrato para impressão");
      }
      
      const data = await response.json();
      
      // Abrir URL do preview em nova aba e imprimir
      if (data.previewUrl) {
        const printWindow = window.open(data.previewUrl, "_blank");
        if (printWindow) {
          setTimeout(() => {
            printWindow.print();
          }, 1000);
        }
      } else {
        throw new Error("URL de preview não disponível para impressão");
      }
    } catch (error) {
      console.error("Erro ao imprimir contrato:", error);
      toast({
        title: "Erro ao imprimir contrato",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao preparar o contrato para impressão",
        variant: "destructive",
      });
    }
  };
  
  // Função para obter o badge de status do contrato
  const getContractStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "outline" | "secondary" | "destructive" | "success" }> = {
      PENDING: { label: "Pendente", variant: "secondary" },
      SIGNED: { label: "Assinado", variant: "success" },
      EXPIRED: { label: "Expirado", variant: "destructive" },
      CANCELED: { label: "Cancelado", variant: "outline" },
    };
    
    return statusMap[status] || { label: status, variant: "default" };
  };
  
  // Função para obter o valor formatado para moeda brasileira
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };
  
  // Função para alterar o filtro de status
  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
    setCurrentPage(1); // Volta para a primeira página ao mudar o filtro
  };
  
  // Função para limpar os filtros
  const handleClearFilters = () => {
    setFilterStatus("all");
    setSearchTerm("");
    setCurrentPage(1);
  };
  
  // Renderização condicional baseada no estado da consulta
  let content;
  
  if (isLoading) {
    content = (
      <div className="flex justify-center items-center p-12">
        <Spinner size="lg" />
      </div>
    );
  } else if (isError) {
    content = (
      <Alert variant="destructive" className="my-4">
        <AlertTriangleIcon className="h-4 w-4" />
        <AlertTitle>Erro ao carregar contratos</AlertTitle>
        <AlertDescription>
          {(error as Error)?.message || "Não foi possível obter os contratos. Tente novamente mais tarde."}
        </AlertDescription>
      </Alert>
    );
  } else if (!contracts || contracts.length === 0) {
    content = (
      <Alert className="my-4">
        <AlertTriangleIcon className="h-4 w-4" />
        <AlertTitle>Nenhum contrato disponível no momento</AlertTitle>
        <AlertDescription>
          Esta página está em desenvolvimento. Em breve você poderá acessar seus contratos aqui.
        </AlertDescription>
      </Alert>
    );
  } else {
    content = (
      <Card>
        <CardHeader>
          <CardTitle>Meus Contratos</CardTitle>
          <CardDescription>
            Visualize e gerencie seus contratos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Curso</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedContracts && paginatedContracts.length > 0 ? (
                  paginatedContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        {contract.courseName}
                        <div className="text-xs text-muted-foreground mt-1">
                          {contract.contractType}
                        </div>
                      </TableCell>
                      <TableCell>
                        {contract.contractNumber}
                        {contract.expiresAt && contract.status === 'PENDING' && (
                          <div className="text-xs text-amber-600 font-medium mt-1">
                            Expira em: {formatDate(new Date(contract.expiresAt))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(new Date(contract.createdAt))}
                        {contract.signedAt && (
                          <div className="text-xs text-green-600 font-medium mt-1">
                            Assinado em: {formatDate(new Date(contract.signedAt))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const status = getContractStatusBadge(contract.status);
                          return (
                            <Badge variant={status.variant as any}>{status.label}</Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* Botão para visualizar contrato */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewContract(contract)}
                            title="Visualizar Contrato"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          
                          {/* Botão para baixar contrato */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadContract(contract.id)}
                            title="Baixar Contrato"
                          >
                            <DownloadIcon className="h-4 w-4" />
                          </Button>
                          
                          {/* Botão para imprimir contrato */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintContract(contract.id)}
                            title="Imprimir Contrato"
                          >
                            <PrinterIcon className="h-4 w-4" />
                          </Button>
                          
                          {/* Botão para assinar contrato (apenas se pendente) */}
                          {contract.status === 'PENDING' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleSignContract(contract.id)}
                              title="Assinar Contrato"
                            >
                              <FileTextIcon className="h-4 w-4 mr-1" /> Assinar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      Nenhum contrato encontrado com os filtros selecionados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Informações de paginação e total */}
          {filteredContracts && filteredContracts.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground text-center">
              Mostrando {paginatedContracts?.length || 0} de {filteredContracts.length} contratos
              {searchTerm || filterStatus !== "all" ? " (filtrados)" : ""}
            </div>
          )}
        </CardContent>
        
        {/* Componente de paginação */}
        {filteredContracts && filteredContracts.length > itemsPerPage && (
          <CardFooter>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              className="mx-auto"
            />
          </CardFooter>
        )}
      </Card>
    );
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        items={sidebarItems}
        user={user}
        portalType="student"
        portalColor="#0891B2"
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="flex-1 overflow-auto">
        <div className="px-4 py-20 md:py-6 md:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Contratos</h1>
            <p className="text-gray-600">Visualize e gerencie seus contratos</p>
          </div>
          
          <div className="space-y-6">
            {/* Filtros e pesquisa */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex gap-2">
                <Button 
                  variant={filterStatus === "all" ? "default" : "outline"} 
                  onClick={() => handleFilterChange("all")}
                  size="sm"
                >
                  Todos
                </Button>
                <Button 
                  variant={filterStatus === "pending" ? "default" : "outline"} 
                  onClick={() => handleFilterChange("pending")}
                  size="sm"
                >
                  Pendentes
                </Button>
                <Button 
                  variant={filterStatus === "signed" ? "default" : "outline"} 
                  onClick={() => handleFilterChange("signed")}
                  size="sm"
                >
                  Assinados
                </Button>
                <Button 
                  variant={filterStatus === "expired" ? "default" : "outline"} 
                  onClick={() => handleFilterChange("expired")}
                  size="sm"
                >
                  Expirados
                </Button>
              </div>
              
              <div className="flex gap-2 w-full md:w-auto">
                <Input
                  placeholder="Pesquisar contratos..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="max-w-[300px]"
                />
                {(searchTerm || filterStatus !== "all") && (
                  <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                    <XCircleIcon className="h-4 w-4 mr-1" /> Limpar
                  </Button>
                )}
              </div>
            </div>
            
            {content}
            
            {/* Detalhes do contrato selecionado */}
            {selectedContract && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Detalhes do Contrato</CardTitle>
                  <CardDescription>
                    Informações detalhadas sobre o contrato selecionado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Número do Contrato</dt>
                      <dd className="mt-1 text-sm">{selectedContract.contractNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Curso</dt>
                      <dd className="mt-1 text-sm">{selectedContract.courseName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Tipo de Contrato</dt>
                      <dd className="mt-1 text-sm">{selectedContract.contractType}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Data de Criação</dt>
                      <dd className="mt-1 text-sm">{formatDate(new Date(selectedContract.createdAt))}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1 text-sm">
                        {(() => {
                          const status = getContractStatusBadge(selectedContract.status);
                          return (
                            <Badge variant={status.variant as any}>{status.label}</Badge>
                          );
                        })()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Data de Assinatura</dt>
                      <dd className="mt-1 text-sm">
                        {selectedContract.signedAt 
                          ? formatDate(new Date(selectedContract.signedAt))
                          : "Não assinado"}
                      </dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Valor Total</dt>
                      <dd className="mt-1 text-sm">{formatCurrency(selectedContract.paymentInfo.totalValue)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Parcelas</dt>
                      <dd className="mt-1 text-sm">
                        {selectedContract.paymentInfo.installments}x de {formatCurrency(selectedContract.paymentInfo.installmentValue)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Forma de Pagamento</dt>
                      <dd className="mt-1 text-sm">{selectedContract.paymentInfo.paymentMethod}</dd>
                    </div>
                    {selectedContract.paymentInfo.discount && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Desconto</dt>
                        <dd className="mt-1 text-sm">{formatCurrency(selectedContract.paymentInfo.discount)}</dd>
                      </div>
                    )}
                    
                    {selectedContract.metadata?.startDate && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Data de Início</dt>
                        <dd className="mt-1 text-sm">{formatDate(new Date(selectedContract.metadata.startDate))}</dd>
                      </div>
                    )}
                    {selectedContract.metadata?.endDate && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Data de Término</dt>
                        <dd className="mt-1 text-sm">{formatDate(new Date(selectedContract.metadata.endDate))}</dd>
                      </div>
                    )}
                    {selectedContract.metadata?.modality && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Modalidade</dt>
                        <dd className="mt-1 text-sm">{selectedContract.metadata.modality}</dd>
                      </div>
                    )}
                    {selectedContract.metadata?.campus && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Campus</dt>
                        <dd className="mt-1 text-sm">{selectedContract.metadata.campus}</dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedContract(null)}
                  >
                    Fechar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadContract(selectedContract.id)}
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" /> Baixar
                  </Button>
                  {selectedContract.status === 'PENDING' && (
                    <Button
                      variant="default"
                      onClick={() => handleSignContract(selectedContract.id)}
                    >
                      <FileTextIcon className="h-4 w-4 mr-2" /> Assinar
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}