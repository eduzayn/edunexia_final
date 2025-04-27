import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import AdminLayout from "@/components/layout/admin-layout";
import { getAdminSidebarItems } from "@/components/layout/admin-sidebar-items";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { BarChart, Activity, Users, CreditCard, DollarSign, Calendar, Clock, AlertCircle, FileText, Search, Download, Upload, ChevronRight, Edit, Trash, Check, X, Info } from "lucide-react";
import { formatCurrency, formatDate, formatDatetime } from "@/lib/formatters";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { PageTransition } from "@/components/ui/page-transition";

/**
 * Página principal do módulo Financeiro Empresarial
 */
const FinanceiroEmpresarialPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Buscar dados do dashboard financeiro
  const dashboardQuery = useQuery({
    queryKey: ["finance-dashboard"],
    queryFn: async () => {
      try {
        const response = await apiRequest("/api/admin/finance/dashboard");
        return response.data;
      } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
        throw error;
      }
    }
  });

  // Buscar últimas transações
  const transactionsQuery = useQuery({
    queryKey: ["finance-transactions", { limit: 5 }],
    queryFn: async () => {
      try {
        const response = await apiRequest("/api/admin/finance/transactions?limit=5");
        return response.data;
      } catch (error) {
        console.error("Erro ao buscar transações:", error);
        throw error;
      }
    }
  });

  // Buscar últimas cobranças
  const chargesQuery = useQuery({
    queryKey: ["finance-charges", { limit: 5 }],
    queryFn: async () => {
      try {
        const response = await apiRequest("/api/admin/finance/charges?limit=5");
        return response.data;
      } catch (error) {
        console.error("Erro ao buscar cobranças:", error);
        throw error;
      }
    }
  });

  if (dashboardQuery.isLoading || transactionsQuery.isLoading || chargesQuery.isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <PageTransition>
            <h1 className="text-2xl font-bold mb-6">Gestão Financeira Empresarial</h1>
            <Skeleton className="h-[200px] w-full mb-6 rounded-lg" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
              <Skeleton className="h-[120px] rounded-lg" />
              <Skeleton className="h-[120px] rounded-lg" />
              <Skeleton className="h-[120px] rounded-lg" />
            </div>
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </PageTransition>
        </div>
      </AdminLayout>
    );
  }

  if (dashboardQuery.isError || transactionsQuery.isError || chargesQuery.isError) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <PageTransition>
            <h1 className="text-2xl font-bold mb-6">Gestão Financeira Empresarial</h1>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>
                Ocorreu um erro ao carregar os dados financeiros. Por favor, tente novamente mais tarde.
              </AlertDescription>
            </Alert>
          </PageTransition>
        </div>
      </AdminLayout>
    );
  }

  // Simulando dados para visualização
  const dashboardData = dashboardQuery.data || {
    totalRevenue: 250000,
    pendingCharges: 45000,
    totalCustomers: 120,
    revenueByMonth: [
      { month: "Jan", value: 18000 },
      { month: "Fev", value: 22000 },
      { month: "Mar", value: 19500 },
      { month: "Abr", value: 24000 },
      { month: "Mai", value: 21000 },
      { month: "Jun", value: 25000 },
      { month: "Jul", value: 27500 },
      { month: "Ago", value: 28000 },
      { month: "Set", value: 30000 },
      { month: "Out", value: 27000 },
      { month: "Nov", value: 29000 },
      { month: "Dez", value: 0 }
    ]
  };

  const transactions = transactionsQuery.data || [];
  const charges = chargesQuery.data || [];

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <PageTransition>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Gestão Financeira Empresarial</h1>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate("/admin/finance/business-finance/subscriptions")}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Assinaturas
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate("/admin/finance/business-finance/anticipation")}
              >
                <Clock className="mr-2 h-4 w-4" />
                Antecipação
              </Button>
              <Button variant="default">
                <DollarSign className="mr-2 h-4 w-4" />
                Nova Cobrança
              </Button>
            </div>
          </div>

          {/* Cards de resumo */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Receita Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardData.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  +2.5% em relação ao mês anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cobranças Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardData.pendingCharges)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((dashboardData.pendingCharges / dashboardData.totalRevenue) * 100).toFixed(1)}% das receitas
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.totalCustomers}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  +12 novos este mês
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Taxa de Conversão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  68.2%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  +4.5% em relação ao mês anterior
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="mb-6" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="transactions">Transações</TabsTrigger>
              <TabsTrigger value="charges">Cobranças</TabsTrigger>
              <TabsTrigger value="reports">Relatórios</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Gráfico de receita mensal */}
              <Card>
                <CardHeader>
                  <CardTitle>Receita Mensal</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] relative">
                  <div className="h-full w-full flex items-end space-x-2 rtl:space-x-reverse pb-4">
                    {dashboardData.revenueByMonth.map((item, index) => {
                      const heightPercentage = (item.value / Math.max(...dashboardData.revenueByMonth.map(i => i.value))) * 100;
                      return (
                        <div key={index} className="relative group h-full flex flex-col justify-end flex-1 space-y-2">
                          <div
                            className="bg-primary/90 group-hover:bg-primary rounded-t w-full"
                            style={{ height: `${heightPercentage}%` }}
                          ></div>
                          <div className="text-xs text-center font-medium">
                            {item.month}
                          </div>
                          <div className="absolute -top-8 left-[50%] -translate-x-[50%] opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            {formatCurrency(item.value)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Últimas transações */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Últimas Transações</CardTitle>
                    <CardDescription>
                      As 5 transações mais recentes processadas.
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("transactions")}>
                    Ver Todas
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction: any) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.id}</TableCell>
                          <TableCell>{formatDate(transaction.date)}</TableCell>
                          <TableCell>{transaction.customer}</TableCell>
                          <TableCell>{transaction.method}</TableCell>
                          <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <div className={`h-2 w-2 rounded-full mr-2 ${
                                transaction.status === "complete" ? "bg-green-500" :
                                transaction.status === "pending" ? "bg-yellow-500" :
                                transaction.status === "failed" ? "bg-red-500" : "bg-gray-500"
                              }`}></div>
                              {transaction.status === "complete" ? "Concluída" :
                               transaction.status === "pending" ? "Pendente" :
                               transaction.status === "failed" ? "Falha" : transaction.status}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Todas as Transações</CardTitle>
                  <CardDescription>
                    Histórico completo das transações financeiras processadas.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <div className="relative w-72">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Pesquisar transações..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Exportar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Upload className="mr-2 h-4 w-4" />
                        Importar
                      </Button>
                    </div>
                  </div>
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox id="select-all" />
                          </TableHead>
                          <TableHead>ID</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction: any) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              <Checkbox id={`select-${transaction.id}`} />
                            </TableCell>
                            <TableCell className="font-medium">{transaction.id}</TableCell>
                            <TableCell>{formatDate(transaction.date)}</TableCell>
                            <TableCell>{transaction.customer}</TableCell>
                            <TableCell>{transaction.method}</TableCell>
                            <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className={`h-2 w-2 rounded-full mr-2 ${
                                  transaction.status === "complete" ? "bg-green-500" :
                                  transaction.status === "pending" ? "bg-yellow-500" :
                                  transaction.status === "failed" ? "bg-red-500" : "bg-gray-500"
                                }`}></div>
                                {transaction.status === "complete" ? "Concluída" :
                                transaction.status === "pending" ? "Pendente" :
                                transaction.status === "failed" ? "Falha" : transaction.status}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Abrir menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                  <DropdownMenuItem>
                                    <Info className="mr-2 h-4 w-4" />
                                    Ver detalhes
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Gerar comprovante
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <Trash className="mr-2 h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between border-t p-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando 5 de 123 transações
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled>
                      Anterior
                    </Button>
                    <Button variant="outline" size="sm">
                      Próxima
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="charges" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cobranças</CardTitle>
                  <CardDescription>
                    Gerencie as cobranças emitidas e seus status.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <div className="relative w-72">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Pesquisar cobranças..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="default" size="sm">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Nova Cobrança
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Exportar
                      </Button>
                    </div>
                  </div>
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox id="select-all" />
                          </TableHead>
                          <TableHead>ID</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {charges.map((charge: any) => (
                          <TableRow key={charge.id}>
                            <TableCell>
                              <Checkbox id={`select-${charge.id}`} />
                            </TableCell>
                            <TableCell className="font-medium">{charge.id}</TableCell>
                            <TableCell>{charge.customer}</TableCell>
                            <TableCell>{formatCurrency(charge.amount)}</TableCell>
                            <TableCell>{formatDate(charge.dueDate)}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className={`h-2 w-2 rounded-full mr-2 ${
                                  charge.status === "paid" ? "bg-green-500" :
                                  charge.status === "pending" ? "bg-yellow-500" :
                                  charge.status === "overdue" ? "bg-red-500" : "bg-gray-500"
                                }`}></div>
                                {charge.status === "paid" ? "Paga" :
                                 charge.status === "pending" ? "Pendente" :
                                 charge.status === "overdue" ? "Vencida" : charge.status}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Abrir menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                  <DropdownMenuItem>
                                    <Info className="mr-2 h-4 w-4" />
                                    Ver detalhes
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Check className="mr-2 h-4 w-4" />
                                    Marcar como paga
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <X className="mr-2 h-4 w-4" />
                                    Cancelar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between border-t p-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando 5 de 78 cobranças
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled>
                      Anterior
                    </Button>
                    <Button variant="outline" size="sm">
                      Próxima
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Relatórios Financeiros</CardTitle>
                  <CardDescription>
                    Acesse os relatórios detalhados para análise financeira.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-auto p-4 justify-start items-start text-left">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <BarChart className="h-5 w-5" />
                        <span className="font-medium">Relatório de Receitas</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Análise detalhada de receitas por período, categoria e cliente.
                      </p>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 justify-start items-start text-left">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        <span className="font-medium">Fluxo de Caixa</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Visualize entradas e saídas financeiras com projeções futuras.
                      </p>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 justify-start items-start text-left">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        <span className="font-medium">Relatório Mensal</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Resumo consolidado mensal com comparativos e indicadores.
                      </p>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 justify-start items-start text-left">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        <span className="font-medium">Relatório por Cliente</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Histórico financeiro detalhado por cliente e segmento.
                      </p>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </PageTransition>
      </div>
    </AdminLayout>
  );
};

export default FinanceiroEmpresarialPage; 