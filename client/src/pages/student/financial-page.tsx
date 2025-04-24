import { useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CreditCardIcon, 
  FileTextIcon, 
  InfoIcon, 
  PrinterIcon,
  BanknoteIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  CircleAlert as CircleAlertIcon,
  X as XIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { queryClient } from "@/lib/queryClient";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import StudentLayout from "@/components/layout/student-layout";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Pagination } from "@/components/ui/pagination";

// Interface para os tipos de dados financeiros
interface Charge {
  id: string;
  dateCreated: string;
  customer: string;
  customerName?: string;
  value: number;
  netValue: number;
  description?: string;
  billingType: string;
  status: string;
  dueDate: string;
  originalDueDate?: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  invoiceNumber?: string;
  externalReference?: string;
  deleted: boolean;
  pixQrCode?: string;
  fine?: number;
  interest?: number;
  // Campos adicionais para facilitar a visualização no portal do aluno
  installment?: number;
  installmentCount?: number;
  courseName?: string;
  discount?: number;
}

export default function FinancialPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedBilling, setSelectedBilling] = useState<Charge | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Número de itens por página
  const [filterStatus, setFilterStatus] = useState<string>("all"); // Filtro por status: all, pending, paid, overdue
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Remover definição de itens da sidebar já que vamos usar o StudentLayout

  // Consulta as cobranças do aluno
  const {
    data: charges,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Charge[]>({
    queryKey: ["/api-json/student/charges"],
    queryFn: async () => {
      try {
        console.log("Tentando carregar cobranças do aluno...");
        
        if (!user) {
          console.warn("Usuário não autenticado");
          throw new Error('Autenticação necessária');
        }
        
        // Usar a API baseada em token
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.warn("Token de autenticação não encontrado");
          throw new Error('Autenticação necessária');
        }
        
        // Fazer requisição à API com token de autenticação - usando a nova rota api-json
        const response = await fetch('/api-json/student/charges', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Se a resposta não for OK (2xx), lançamos um erro
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            console.warn(`Erro de autenticação: ${response.status}`);
            throw new Error('Autenticação necessária');
          } else {
            throw new Error(`Erro ao carregar cobranças: ${response.statusText}`);
          }
        }
        
        const data = await response.json();
        console.log("Cobranças carregadas com sucesso:", data.length);
        return data;
      } catch (err) {
        console.error("Erro ao carregar cobranças:", err);
        throw err;
      }
    },
    enabled: !!user, // Só executa a query se o usuário estiver autenticado
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
  
  // Calcular as cobranças paginadas
  const paginatedCharges = useMemo(() => {
    if (!charges) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return charges.slice(startIndex, startIndex + itemsPerPage);
  }, [charges, currentPage, itemsPerPage]);
  
  // Calcular o número total de páginas
  const totalPages = useMemo(() => {
    if (!charges) return 1;
    return Math.ceil(charges.length / itemsPerPage);
  }, [charges, itemsPerPage]);
  
  // Função para mudar de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Função para filtrar as cobranças
  const filteredCharges = useMemo(() => {
    if (!charges) return [];
    
    return charges.filter(charge => {
      // Filtro por status
      if (filterStatus !== "all") {
        if (filterStatus === "pending" && charge.status !== "PENDING") return false;
        if (filterStatus === "paid" && !["RECEIVED", "CONFIRMED"].includes(charge.status)) return false;
        if (filterStatus === "overdue" && charge.status !== "OVERDUE") return false;
      }
      
      // Filtro por termo de busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const descriptionMatch = charge.description?.toLowerCase().includes(searchLower) || false;
        const invoiceMatch = charge.invoiceNumber?.toLowerCase().includes(searchLower) || false;
        const referenceMatch = charge.externalReference?.toLowerCase().includes(searchLower) || false;
        const courseMatch = charge.courseName?.toLowerCase().includes(searchLower) || false;
        
        return descriptionMatch || invoiceMatch || referenceMatch || courseMatch;
      }
      
      return true;
    });
  }, [charges, filterStatus, searchTerm]);
  
  // Calcular as cobranças filtradas e paginadas
  const paginatedFilteredCharges = useMemo(() => {
    if (!filteredCharges) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCharges.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCharges, currentPage, itemsPerPage]);

  // Função para baixar o boleto
  const handleDownloadBoleto = (boletoUrl: string | undefined) => {
    if (!boletoUrl) {
      toast({
        title: "Erro",
        description: "Boleto não disponível para esta cobrança",
        variant: "destructive",
      });
      return;
    }
    
    window.open(boletoUrl, "_blank");
  };

  // Função para imprimir o boleto
  const handlePrintBoleto = (boletoUrl: string | undefined) => {
    if (!boletoUrl) {
      toast({
        title: "Erro",
        description: "Boleto não disponível para esta cobrança",
        variant: "destructive",
      });
      return;
    }
    
    const printWindow = window.open(boletoUrl, "_blank");
    if (printWindow) {
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    }
  };

  // Função para copiar o código PIX
  const handleCopyPix = (pixCode: string | undefined) => {
    if (!pixCode) {
      toast({
        title: "Erro",
        description: "Código PIX não disponível para esta cobrança",
        variant: "destructive",
      });
      return;
    }
    
    navigator.clipboard.writeText(pixCode).then(
      () => {
        toast({
          title: "Sucesso",
          description: "Código PIX copiado para a área de transferência",
        });
      },
      () => {
        toast({
          title: "Erro",
          description: "Não foi possível copiar o código PIX",
          variant: "destructive",
        });
      }
    );
  };

  // Função para mostrar detalhes da cobrança
  const handleViewDetails = (billing: Charge) => {
    setSelectedBilling(billing);
  };
  
  // Função para visualizar a cobrança no Asaas
  const handleViewAsaasCharge = async (chargeId: string) => {
    try {
      if (!user) {
        throw new Error('Você precisa estar autenticado para visualizar a cobrança');
      }
      
      // Recuperar o token de autenticação
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Você precisa estar autenticado para visualizar a cobrança');
      }
      
      // Faz uma requisição para obter o link de visualização usando a API-JSON
      const response = await fetch(`/api-json/student/charges/${chargeId}/view-link`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao obter link de visualização');
      }
      
      const data = await response.json();
      
      if (data.success && data.viewLink) {
        // Abre o link de visualização em uma nova aba
        window.open(data.viewLink, '_blank');
        
        toast({
          title: "Link de pagamento aberto",
          description: "O link para pagamento da cobrança foi aberto em uma nova aba",
        });
      } else {
        throw new Error('Link de visualização não disponível');
      }
    } catch (error) {
      console.error('Erro ao obter link de visualização:', error);
      toast({
        title: "Erro ao visualizar cobrança",
        description: error instanceof Error ? error.message : "Não foi possível obter o link de visualização",
        variant: "destructive",
      });
    }
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

  // Determina o status visual da cobrança
  const getBillingStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "outline" | "secondary" | "destructive" | "success" }> = {
      PENDING: { label: "Pendente", variant: "secondary" },
      RECEIVED: { label: "Recebido", variant: "success" },
      CONFIRMED: { label: "Confirmado", variant: "success" },
      OVERDUE: { label: "Vencido", variant: "destructive" },
      REFUNDED: { label: "Reembolsado", variant: "outline" },
      RECEIVED_IN_CASH: { label: "Recebido em dinheiro", variant: "success" },
      REFUND_REQUESTED: { label: "Reembolso solicitado", variant: "outline" },
      CHARGEBACK_REQUESTED: { label: "Contestação solicitada", variant: "destructive" },
      CHARGEBACK_DISPUTE: { label: "Em disputa", variant: "destructive" },
      AWAITING_CHARGEBACK_REVERSAL: { label: "Aguardando reversão", variant: "secondary" },
      DUNNING_REQUESTED: { label: "Cobrança solicitada", variant: "secondary" },
      DUNNING_RECEIVED: { label: "Cobrança recebida", variant: "success" },
      AWAITING_RISK_ANALYSIS: { label: "Em análise de risco", variant: "secondary" },
    };
    
    return statusMap[status] || { label: status, variant: "default" };
  };

  // Renderiza o conteúdo conforme o estado da consulta
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
        <AlertTitle>Erro ao carregar dados financeiros</AlertTitle>
        <AlertDescription>
          {(error as Error)?.message || "Não foi possível obter as informações de pagamento. Tente novamente mais tarde."}
        </AlertDescription>
      </Alert>
    );
  } else if (!charges || charges.length === 0) {
    content = (
      <Alert className="my-4">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Nenhuma cobrança encontrada</AlertTitle>
        <AlertDescription>
          Você não possui cobranças registradas no sistema. Se acredita que isso é um erro, entre em contato com a secretaria.
        </AlertDescription>
      </Alert>
    );
  } else {
    content = (
      <Card>
        <CardHeader>
          <CardTitle>Suas Cobranças</CardTitle>
          <CardDescription>
            Visualize todas as suas cobranças e realize pagamentos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedFilteredCharges.length > 0 ? (
                  paginatedFilteredCharges.map((charge) => (
                    <TableRow key={charge.id}>
                      <TableCell className="font-medium">
                        {charge.description || "Mensalidade"}
                        {charge.installment && charge.installmentCount && (
                          <span className="text-muted-foreground text-xs ml-1">
                            (Parcela {charge.installment}/{charge.installmentCount})
                          </span>
                        )}
                        {charge.courseName && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {charge.courseName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(new Date(charge.dueDate))}</TableCell>
                      <TableCell>
                        {formatCurrency(charge.value)}
                        {charge.discount && charge.discount > 0 && (
                          <div className="text-xs text-green-600 font-medium mt-1">
                            Desconto: {formatCurrency(charge.discount)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const status = getBillingStatusBadge(charge.status);
                          return (
                            <Badge variant={status.variant as any}>{status.label}</Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* Botão para visualizar detalhes */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(charge)}
                            title="Ver Detalhes"
                          >
                            <InfoIcon className="h-4 w-4" />
                          </Button>
                          
                          {/* Botão para visualizar cobrança no Asaas */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewAsaasCharge(charge.id)}
                            title="Visualizar Cobrança"
                          >
                            <CreditCardIcon className="h-4 w-4" />
                          </Button>
                          
                          {/* Botão para baixar boleto */}
                          {charge.bankSlipUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadBoleto(charge.bankSlipUrl)}
                              title="Baixar Boleto"
                            >
                              <FileTextIcon className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Botão para imprimir boleto */}
                          {charge.bankSlipUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePrintBoleto(charge.bankSlipUrl)}
                              title="Imprimir Boleto"
                            >
                              <PrinterIcon className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Botão para copiar PIX */}
                          {charge.pixQrCode && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyPix(charge.pixQrCode)}
                              title="Copiar código PIX"
                            >
                              <BanknoteIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      Nenhuma cobrança encontrada com os filtros selecionados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Informações de paginação e total */}
          {filteredCharges && filteredCharges.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground text-center">
              Mostrando {paginatedFilteredCharges.length} de {filteredCharges.length} cobranças
              {searchTerm || filterStatus !== "all" ? " (filtradas)" : ""}
            </div>
          )}
        </CardContent>
        
        {/* Componente de paginação */}
        {filteredCharges && filteredCharges.length > itemsPerPage && (
          <CardFooter>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredCharges.length / itemsPerPage)}
              onPageChange={handlePageChange}
              className="mx-auto"
            />
          </CardFooter>
        )}
      </Card>
    );
  }

  return (
    <StudentLayout title="Financeiro" subtitle="Gerencie suas mensalidades e cobranças">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Visão Geral</h2>
        </div>
    
        <div className="grid gap-4 md:grid-cols-3">
          <Card 
            className={`cursor-pointer transition-all ${filterStatus === 'pending' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => handleFilterChange('pending')}
          >
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <AlertTriangleIcon className="h-5 w-5 text-amber-500" />
              <div>
                <CardTitle className="text-xl">Pendentes</CardTitle>
                <CardDescription>Aguardando pagamento</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="py-4">
                <p className="text-sm text-muted-foreground">Total de cobranças pendentes</p>
                <p className="text-2xl font-bold">
                  {charges?.filter((charge: Charge) => 
                    charge.status === "PENDING" || 
                    charge.status === "AWAITING_RISK_ANALYSIS" || 
                    charge.status === "DUNNING_REQUESTED"
                  ).length || 0}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all ${filterStatus === 'paid' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => handleFilterChange('paid')}
          >
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <div>
                <CardTitle className="text-xl">Pagos</CardTitle>
                <CardDescription>Pagamentos confirmados</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="py-4">
                <p className="text-sm text-muted-foreground">Total de pagamentos confirmados</p>
                <p className="text-2xl font-bold">
                  {charges?.filter((charge: Charge) => 
                    charge.status === "RECEIVED" || 
                    charge.status === "CONFIRMED" || 
                    charge.status === "RECEIVED_IN_CASH" ||
                    charge.status === "DUNNING_RECEIVED"
                  ).length || 0}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all ${filterStatus === 'overdue' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => handleFilterChange('overdue')}
          >
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <XCircleIcon className="h-5 w-5 text-red-500" />
              <div>
                <CardTitle className="text-xl">Vencidos</CardTitle>
                <CardDescription>Pagamentos em atraso</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="py-4">
                <p className="text-sm text-muted-foreground">Total de pagamentos vencidos</p>
                <p className="text-2xl font-bold">
                  {charges?.filter((charge: Charge) => 
                    charge.status === "OVERDUE"
                  ).length || 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
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
              variant={filterStatus === "paid" ? "default" : "outline"} 
              onClick={() => handleFilterChange("paid")}
              size="sm"
            >
              Pagos
            </Button>
            <Button 
              variant={filterStatus === "overdue" ? "default" : "outline"} 
              onClick={() => handleFilterChange("overdue")}
              size="sm"
            >
              Vencidos
            </Button>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <Input
              placeholder="Pesquisar cobranças..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="max-w-[300px]"
            />
            {(searchTerm || filterStatus !== "all") && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                <XIcon className="h-4 w-4 mr-1" /> Limpar
              </Button>
            )}
          </div>
        </div>
        
        {content}
        
        {/* Modal de detalhes */}
        {selectedBilling && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Detalhes da Cobrança</CardTitle>
              <CardDescription>
                Informações detalhadas sobre a cobrança selecionada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">ID da Cobrança</dt>
                  <dd className="mt-1 text-sm">{selectedBilling.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Descrição</dt>
                  <dd className="mt-1 text-sm">{selectedBilling.description || "Mensalidade"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Data de Vencimento</dt>
                  <dd className="mt-1 text-sm">{formatDate(new Date(selectedBilling.dueDate))}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Valor</dt>
                  <dd className="mt-1 text-sm">{formatCurrency(selectedBilling.value)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Data de Criação</dt>
                  <dd className="mt-1 text-sm">{formatDate(new Date(selectedBilling.dateCreated))}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm">
                    <Badge variant={getBillingStatusBadge(selectedBilling.status).variant as any}>
                      {getBillingStatusBadge(selectedBilling.status).label}
                    </Badge>
                  </dd>
                </div>
                {selectedBilling.paymentDate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Data de Pagamento</dt>
                    <dd className="mt-1 text-sm">{formatDate(new Date(selectedBilling.paymentDate))}</dd>
                  </div>
                )}
                {selectedBilling.fine && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Multa</dt>
                    <dd className="mt-1 text-sm">{formatCurrency(selectedBilling.fine)}</dd>
                  </div>
                )}
                {selectedBilling.interest && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Juros</dt>
                    <dd className="mt-1 text-sm">{formatCurrency(selectedBilling.interest)}</dd>
                  </div>
                )}
              </dl>
              
              <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={() => setSelectedBilling(null)}>
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </StudentLayout>
  );
}