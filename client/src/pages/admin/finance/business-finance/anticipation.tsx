import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/layout/admin-layout";
import { getAdminSidebarItems } from "@/components/layout/admin-sidebar-items";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Calendar, CalendarBlank } from "lucide-react";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Check, Clock, DollarSign, Download, MoreHorizontal, Plus, RefreshCw, Search, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate, formatDatetime } from "@/lib/formatters";
import { PageTransition } from "@/components/ui/page-transition";

const anticipationSchema = z.object({
  amount: z.string().min(1, "O valor é obrigatório"),
  selectedPayments: z.array(z.string()).min(1, "Selecione pelo menos um pagamento"),
  anticipationDate: z.string().optional()
});

type AnticipationFormValues = z.infer<typeof anticipationSchema>;

/**
 * Página de antecipação de recebíveis no módulo financeiro empresarial
 */
const AntecipacaoPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("eligible");
  const [isAnticipationModalOpen, setIsAnticipationModalOpen] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [anticipationAmount, setAnticipationAmount] = useState(0);

  const form = useForm<AnticipationFormValues>({
    resolver: zodResolver(anticipationSchema),
    defaultValues: {
      amount: "",
      selectedPayments: [],
      anticipationDate: ""
    }
  });

  // Buscar pagamentos elegíveis para antecipação
  const paymentsQuery = useQuery({
    queryKey: ["anticipation-payments", activeTab],
    queryFn: async () => {
      try {
        const status = activeTab === "eligible" ? "eligible" : activeTab === "pending" ? "pending" : "processed";
        const response = await apiRequest(`/api/admin/finance/anticipation/payments?status=${status}&search=${searchTerm}`);
        return response.data || [];
      } catch (error) {
        console.error("Erro ao buscar pagamentos:", error);
        throw error;
      }
    }
  });

  // Mutação para solicitar antecipação
  const anticipationMutation = useMutation({
    mutationFn: async (data: AnticipationFormValues) => {
      const response = await apiRequest("/api/admin/finance/anticipation/request", {
        method: "POST",
        body: JSON.stringify({
          paymentIds: data.selectedPayments,
          amount: parseFloat(data.amount.replace(/[^\d,]/g, "").replace(",", ".")),
          anticipationDate: data.anticipationDate || undefined
        })
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["anticipation-payments"] });
      toast({
        title: "Antecipação solicitada",
        description: "Sua solicitação de antecipação foi enviada com sucesso."
      });
      setIsAnticipationModalOpen(false);
      form.reset();
      setSelectedPayments([]);
      setAnticipationAmount(0);
    },
    onError: (error) => {
      console.error("Erro ao solicitar antecipação:", error);
      toast({
        variant: "destructive",
        title: "Erro na solicitação",
        description: "Não foi possível processar sua solicitação. Tente novamente."
      });
    }
  });

  const handleSelectPayment = (paymentId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedPayments([...selectedPayments, paymentId]);
    } else {
      setSelectedPayments(selectedPayments.filter(id => id !== paymentId));
    }
  };

  const handleSelectAllPayments = (isChecked: boolean) => {
    if (isChecked && payments) {
      setSelectedPayments(payments.map(payment => payment.id));
    } else {
      setSelectedPayments([]);
    }
  };

  const calculateAnticipationAmount = () => {
    if (!payments) return 0;
    
    const selectedPaymentData = payments.filter(payment => selectedPayments.includes(payment.id));
    const totalAmount = selectedPaymentData.reduce((sum, payment) => sum + payment.value, 0);
    // Aplicando uma taxa de desconto fictícia de 3%
    const discountRate = 0.03;
    const discountAmount = totalAmount * discountRate;
    const netAmount = totalAmount - discountAmount;
    
    setAnticipationAmount(netAmount);
    form.setValue("amount", netAmount.toFixed(2).replace(".", ","));
    return netAmount;
  };

  const onSubmit = (data: AnticipationFormValues) => {
    anticipationMutation.mutate(data);
  };

  const handleOpenAnticipationModal = () => {
    calculateAnticipationAmount();
    form.setValue("selectedPayments", selectedPayments);
    setIsAnticipationModalOpen(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    paymentsQuery.refetch();
  };

  // Renderizar estado de carregamento
  if (paymentsQuery.isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <PageTransition>
            <h1 className="text-2xl font-bold mb-6">Antecipação de Recebíveis</h1>
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </PageTransition>
        </div>
      </AdminLayout>
    );
  }

  // Renderizar erro
  if (paymentsQuery.isError) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <PageTransition>
            <h1 className="text-2xl font-bold mb-6">Antecipação de Recebíveis</h1>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>
                Ocorreu um erro ao carregar os pagamentos. Por favor, tente novamente mais tarde.
              </AlertDescription>
            </Alert>
          </PageTransition>
        </div>
      </AdminLayout>
    );
  }

  // Simulação de dados para demonstração
  const payments = paymentsQuery.data || [
    {
      id: "pay_001",
      dueDate: "2023-12-25",
      value: 1500.00,
      customer: "Escola Municipal João da Silva",
      description: "Pagamento mensal - Plano Premium",
      anticipationFee: 45.00,
      netValue: 1455.00,
      status: "eligible"
    },
    {
      id: "pay_002",
      dueDate: "2023-12-28",
      value: 2500.00,
      customer: "Faculdade de Tecnologia ABC",
      description: "Pagamento mensal - Plano Empresarial",
      anticipationFee: 75.00,
      netValue: 2425.00,
      status: "eligible"
    },
    {
      id: "pay_003",
      dueDate: "2024-01-05",
      value: 1200.00,
      customer: "Colégio Integrado Educacional",
      description: "Pagamento mensal - Plano Standard",
      anticipationFee: 36.00,
      netValue: 1164.00,
      status: "eligible"
    },
    {
      id: "pay_004",
      dueDate: "2024-01-10",
      value: 3500.00,
      customer: "Instituto de Educação Superior",
      description: "Pagamento mensal - Plano Empresarial Plus",
      anticipationFee: 105.00,
      netValue: 3395.00,
      status: "eligible"
    },
    {
      id: "pay_005",
      dueDate: "2024-01-15",
      value: 750.00,
      customer: "Escola Técnica Profissionalizante",
      description: "Pagamento mensal - Plano Básico",
      anticipationFee: 22.50,
      netValue: 727.50,
      status: "eligible"
    }
  ];

  // Histórico de antecipações
  const anticipationHistory = [
    {
      id: "ant_001",
      requestDate: "2023-11-10",
      amount: 4500.00,
      fee: 135.00,
      netAmount: 4365.00,
      status: "processed",
      paymentDate: "2023-11-12"
    },
    {
      id: "ant_002",
      requestDate: "2023-10-15",
      amount: 3200.00,
      fee: 96.00,
      netAmount: 3104.00,
      status: "processed",
      paymentDate: "2023-10-17"
    },
    {
      id: "ant_003",
      requestDate: "2023-09-22",
      amount: 5600.00,
      fee: 168.00,
      netAmount: 5432.00,
      status: "processed",
      paymentDate: "2023-09-24"
    }
  ];

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <PageTransition>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Antecipação de Recebíveis</h1>
            <Button 
              onClick={handleOpenAnticipationModal}
              disabled={selectedPayments.length === 0}
            >
              <Clock className="mr-2 h-4 w-4" />
              Solicitar Antecipação
            </Button>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Pagamentos Disponíveis para Antecipação</CardTitle>
              <CardDescription>
                Selecione os pagamentos futuros que deseja antecipar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-6">
                <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-sm">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por cliente ou descrição..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button type="submit" variant="secondary">Buscar</Button>
                </form>
                <div className="flex items-center gap-4">
                  {selectedPayments.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">{selectedPayments.length}</span> pagamentos selecionados 
                      (<span className="font-medium">{formatCurrency(payments
                        .filter(p => selectedPayments.includes(p.id))
                        .reduce((sum, p) => sum + p.value, 0))}</span>)
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => paymentsQuery.refetch()}
                  >
                    <RefreshCw 
                      className={`mr-2 h-4 w-4 ${paymentsQuery.isFetching ? 'animate-spin' : ''}`} 
                    />
                    Atualizar
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="eligible" className="mb-6" onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="eligible">Elegíveis</TabsTrigger>
                  <TabsTrigger value="pending">Em Processamento</TabsTrigger>
                  <TabsTrigger value="processed">Processados</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox 
                          id="select-all" 
                          onCheckedChange={(checked) => handleSelectAllPayments(checked === true)}
                          checked={payments.length > 0 && selectedPayments.length === payments.length}
                        />
                      </TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Taxa</TableHead>
                      <TableHead>Valor Líquido</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <Checkbox 
                            id={`select-${payment.id}`} 
                            onCheckedChange={(checked) => handleSelectPayment(payment.id, checked === true)}
                            checked={selectedPayments.includes(payment.id)}
                          />
                        </TableCell>
                        <TableCell>{formatDate(payment.dueDate)}</TableCell>
                        <TableCell>{payment.customer}</TableCell>
                        <TableCell className="max-w-xs truncate">{payment.description}</TableCell>
                        <TableCell>{formatCurrency(payment.value)}</TableCell>
                        <TableCell>{formatCurrency(payment.anticipationFee)}</TableCell>
                        <TableCell>{formatCurrency(payment.netValue)}</TableCell>
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
                              <DropdownMenuItem onClick={() => handleSelectPayment(payment.id, !selectedPayments.includes(payment.id))}>
                                {selectedPayments.includes(payment.id) ? (
                                  <>
                                    <X className="mr-2 h-4 w-4" />
                                    Remover seleção
                                  </>
                                ) : (
                                  <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Selecionar
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <DollarSign className="mr-2 h-4 w-4" />
                                Ver detalhes
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}

                    {payments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                          Nenhum pagamento disponível para antecipação.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 py-4">
              <div className="text-sm text-muted-foreground">
                Mostrando <strong>{payments.length}</strong> pagamentos
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  Anterior
                </Button>
                <Button variant="outline" size="sm">
                  Próxima
                </Button>
              </div>
            </CardFooter>
          </Card>

          {activeTab === "processed" && (
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Antecipações</CardTitle>
                <CardDescription>
                  Antecipações já processadas e pagamentos realizados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Data da Solicitação</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead>Taxa</TableHead>
                        <TableHead>Valor Líquido</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data do Pagamento</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {anticipationHistory.map((history) => (
                        <TableRow key={history.id}>
                          <TableCell className="font-medium">{history.id}</TableCell>
                          <TableCell>{formatDate(history.requestDate)}</TableCell>
                          <TableCell>{formatCurrency(history.amount)}</TableCell>
                          <TableCell>{formatCurrency(history.fee)}</TableCell>
                          <TableCell>{formatCurrency(history.netAmount)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={`${history.status === "processed" ? "bg-green-500" : "bg-yellow-500"} text-white`}
                            >
                              {history.status === "processed" ? "Processado" : "Pendente"}
                            </Badge>
                          </TableCell>
                          <TableCell>{history.paymentDate ? formatDate(history.paymentDate) : "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Comprovante
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}

                      {anticipationHistory.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                            Nenhum histórico de antecipação encontrado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          <Dialog open={isAnticipationModalOpen} onOpenChange={setIsAnticipationModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Solicitar Antecipação</DialogTitle>
                <DialogDescription>
                  Confirme os detalhes da sua solicitação de antecipação de recebíveis.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="selectedPayments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pagamentos Selecionados</FormLabel>
                        <FormControl>
                          <div className="text-sm">
                            {selectedPayments.length} pagamentos no valor total de{" "}
                            <span className="font-medium">
                              {formatCurrency(payments
                                .filter(p => selectedPayments.includes(p.id))
                                .reduce((sum, p) => sum + p.value, 0))}
                            </span>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Pagamentos que serão antecipados.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="border rounded-md p-4 bg-muted/50">
                    <h4 className="font-medium mb-2">Resumo da Antecipação</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Valor total:</span>
                        <span>
                          {formatCurrency(payments
                            .filter(p => selectedPayments.includes(p.id))
                            .reduce((sum, p) => sum + p.value, 0))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxa de antecipação (3%):</span>
                        <span>
                          {formatCurrency(payments
                            .filter(p => selectedPayments.includes(p.id))
                            .reduce((sum, p) => sum + p.value, 0) * 0.03)}
                        </span>
                      </div>
                      <Separator className="my-1" />
                      <div className="flex justify-between font-medium">
                        <span>Valor líquido:</span>
                        <span>
                          {formatCurrency(anticipationAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Líquido</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            readOnly
                          />
                        </FormControl>
                        <FormDescription>
                          Valor que você receberá após a dedução da taxa.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="anticipationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Recebimento (Opcional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma data de recebimento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="immediate">Imediato (em até 1 dia útil)</SelectItem>
                            <SelectItem value="2days">Em 2 dias úteis</SelectItem>
                            <SelectItem value="custom">Data específica</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Quando você deseja receber o valor antecipado.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAnticipationModalOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      disabled={selectedPayments.length === 0 || anticipationMutation.isLoading}
                    >
                      {anticipationMutation.isLoading ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Confirmar Antecipação
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </PageTransition>
      </div>
    </AdminLayout>
  );
};

export default AntecipacaoPage; 