import React, { useState } from "react";
import { AdminLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  GraduationCapAltIcon, 
  SettingsIcon, 
  FileCheckIcon, 
  ClockIcon,
  ListIcon,
  BuildingIcon
} from "@/components/ui/icons";
import { AlertCircle, AlertTriangle, RefreshCw, Search } from "lucide-react";
import BreadcrumbWithBackButton from "@/components/ui/breadcrumb-with-back";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Schema para formulário de configuração da instituição
const institutionAccessConfigSchema = z.object({
  accessType: z.enum(["after_link_completion", "after_payment_confirmation"], {
    required_error: "Tipo de acesso é obrigatório",
  }),
  blockDelayDays: z.coerce.number().min(1, {
    message: "Dias para bloqueio deve ser maior que 0",
  }),
  cancelDelayDays: z.coerce.number().min(1, {
    message: "Dias para cancelamento deve ser maior que 0",
  }),
  institutionId: z.coerce.number().min(1, {
    message: "Instituição é obrigatória",
  }),
});

// Schema para formulário de filtro de relatório
const reportFilterSchema = z.object({
  institutionId: z.coerce.number().optional(),
  accessStatus: z.string().optional(),
  searchTerm: z.string().optional(),
});

export default function PortalAccessControlPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("configuracoes");
  const [selectedInstitution, setSelectedInstitution] = useState<number | null>(null);
  
  // Consulta para listar instituições
  const { data: institutions, isLoading: isLoadingInstitutions } = useQuery({
    queryKey: ["/api/admin/institutions"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/institutions");
      return response.json();
    },
  });

  // Consulta para obter configuração de acesso da instituição selecionada
  const { 
    data: institutionConfig, 
    isLoading: isLoadingConfig,
    refetch: refetchConfig
  } = useQuery({
    queryKey: ["/api-json/institution-access-config", selectedInstitution],
    queryFn: async () => {
      if (!selectedInstitution) return null;
      const response = await apiRequest("GET", `/api-json/institution-access-config/${selectedInstitution}`);
      return response.json();
    },
    enabled: !!selectedInstitution,
  });

  // Formulário para configuração de acesso
  const configForm = useForm<z.infer<typeof institutionAccessConfigSchema>>({
    resolver: zodResolver(institutionAccessConfigSchema),
    defaultValues: {
      accessType: "after_link_completion",
      blockDelayDays: 10,
      cancelDelayDays: 30,
      institutionId: selectedInstitution || undefined,
    },
  });

  // Formulário para filtro de relatório
  const reportFilterForm = useForm<z.infer<typeof reportFilterSchema>>({
    resolver: zodResolver(reportFilterSchema),
    defaultValues: {
      institutionId: undefined,
      accessStatus: "",
      searchTerm: "",
    },
  });

  // Atualização dos valores padrão quando a configuração for carregada
  React.useEffect(() => {
    if (institutionConfig?.config) {
      configForm.reset({
        accessType: institutionConfig.config.accessType,
        blockDelayDays: institutionConfig.config.blockDelayDays,
        cancelDelayDays: institutionConfig.config.cancelDelayDays,
        institutionId: selectedInstitution || undefined,
      });
    }
  }, [institutionConfig, selectedInstitution]);

  // Mutation para salvar a configuração
  const saveConfigMutation = useMutation({
    mutationFn: async (data: z.infer<typeof institutionAccessConfigSchema>) => {
      const response = await apiRequest("PUT", `/api-json/institution-access-config/${data.institutionId}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Configuração salva",
        description: "As configurações de acesso foram atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api-json/institution-access-config", selectedInstitution],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar configuração",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Consulta para carregar o relatório de acesso
  const { 
    data: accessReport, 
    isLoading: isLoadingReport,
    refetch: refetchReport
  } = useQuery({
    queryKey: ["/api-json/portal-access-report", reportFilterForm.watch()],
    queryFn: async () => {
      const filters = reportFilterForm.getValues();
      const queryParams = new URLSearchParams();
      
      if (filters.institutionId) {
        queryParams.append("institutionId", filters.institutionId.toString());
      }
      
      if (filters.accessStatus) {
        queryParams.append("accessStatus", filters.accessStatus);
      }
      
      if (filters.searchTerm) {
        queryParams.append("search", filters.searchTerm);
      }
      
      const response = await apiRequest("GET", `/api-json/portal-access-report?${queryParams}`);
      return response.json();
    },
  });

  // Handler para salvar a configuração
  const onSaveConfig = (data: z.infer<typeof institutionAccessConfigSchema>) => {
    saveConfigMutation.mutate(data);
  };

  // Handler para aplicar o filtro no relatório
  const onApplyFilter = () => {
    refetchReport();
  };

  // Função para formatar a mensagem de status de acesso
  const formatAccessStatusMessage = (status: string) => {
    switch (status) {
      case "not_granted":
        return "Não concedido";
      case "active":
        return "Ativo";
      case "blocked":
        return "Bloqueado";
      case "expired":
        return "Expirado";
      default:
        return status;
    }
  };

  // Função para renderizar o badge de status
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "not_granted":
        return <Badge variant="outline" className="bg-gray-100">Não concedido</Badge>;
      case "active":
        return <Badge variant="default" className="bg-green-500">Ativo</Badge>;
      case "blocked":
        return <Badge variant="default" className="bg-red-500">Bloqueado</Badge>;
      case "expired":
        return <Badge variant="default" className="bg-orange-500">Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="container px-4 py-6 mx-auto">
        <div className="flex justify-between items-center mb-6">
          <BreadcrumbWithBackButton
            items={[
              { title: "Dashboard", link: "/admin/dashboard" },
              { title: "Administração", link: "/admin" },
              { title: "Sistema", link: "/admin/sistema/settings" },
              { title: "Controle de Acesso ao Portal do Aluno", link: "/admin/sistema/portal-access-control" },
            ]}
          />
        </div>

        <div className="flex flex-col space-y-6">
          <div className="flex items-center space-x-2">
            <GraduationCapAltIcon className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Controle de Acesso ao Portal do Aluno</h1>
          </div>
          
          <div className="text-muted-foreground">
            Configure as regras de acesso ao portal do aluno para cada instituição e monitore o status de acesso das matrículas.
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="configuracoes" className="flex items-center space-x-2">
                <SettingsIcon className="h-4 w-4" />
                <span>Configurações de Acesso</span>
              </TabsTrigger>
              <TabsTrigger value="relatorios" className="flex items-center space-x-2">
                <FileCheckIcon className="h-4 w-4" />
                <span>Relatório de Acesso</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Aba de Configurações */}
            <TabsContent value="configuracoes" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Regras de Acesso por Instituição</CardTitle>
                  <CardDescription>
                    Configure quando o acesso ao portal do aluno deve ser liberado e os prazos para bloqueio e cancelamento.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Seleção de Instituição */}
                    <div className="mb-6">
                      <Label htmlFor="institution-select">Selecione a Instituição</Label>
                      <Select 
                        value={selectedInstitution?.toString() || ""}
                        onValueChange={(value) => {
                          const id = parseInt(value, 10);
                          setSelectedInstitution(id);
                          configForm.setValue("institutionId", id);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione uma instituição" />
                        </SelectTrigger>
                        <SelectContent>
                          {institutions?.map((institution: any) => (
                            <SelectItem key={institution.id} value={institution.id.toString()}>
                              {institution.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedInstitution ? (
                      <Form {...configForm}>
                        <form onSubmit={configForm.handleSubmit(onSaveConfig)} className="space-y-6">
                          <FormField
                            control={configForm.control}
                            name="accessType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo de Acesso</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o tipo de acesso" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="after_link_completion">
                                      Após preenchimento do link de pagamento
                                    </SelectItem>
                                    <SelectItem value="after_payment_confirmation">
                                      Apenas após confirmação do pagamento
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Define quando o acesso ao portal do aluno será liberado durante o processo de matrícula.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={configForm.control}
                              name="blockDelayDays"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Dias para Bloqueio</FormLabel>
                                  <FormControl>
                                    <Input type="number" {...field} min={1} />
                                  </FormControl>
                                  <FormDescription>
                                    Número de dias após o vencimento para bloquear o acesso.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={configForm.control}
                              name="cancelDelayDays"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Dias para Cancelamento</FormLabel>
                                  <FormControl>
                                    <Input type="number" {...field} min={1} />
                                  </FormControl>
                                  <FormDescription>
                                    Número de dias após o vencimento para cancelar a matrícula.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <Button 
                            type="submit" 
                            className="w-full md:w-auto" 
                            disabled={saveConfigMutation.isPending}
                          >
                            {saveConfigMutation.isPending ? (
                              <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                              </>
                            ) : "Salvar Configurações"}
                          </Button>
                        </form>
                      </Form>
                    ) : (
                      <div className="flex items-center justify-center p-8 border border-dashed rounded-lg bg-muted/50">
                        <div className="text-center">
                          <BuildingIcon className="mx-auto h-10 w-10 text-muted-foreground" />
                          <h3 className="mt-4 text-lg font-medium">Selecione uma Instituição</h3>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Escolha uma instituição para configurar as regras de acesso ao portal do aluno.
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedInstitution && (
                      <Alert className="mt-6">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Importante</AlertTitle>
                        <AlertDescription>
                          Alterações nas regras de acesso não afetam matrículas existentes. Para matrículas ativas, utilize as opções de 
                          bloqueio e desbloqueio de acesso na tela de gerenciamento de matrículas.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Aba de Relatórios */}
            <TabsContent value="relatorios" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Relatório de Acesso ao Portal</CardTitle>
                  <CardDescription>
                    Visualize e monitore o status de acesso de todos os alunos ao portal.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...reportFilterForm}>
                    <form className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={reportFilterForm.control}
                          name="institutionId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Instituição</FormLabel>
                              <Select 
                                onValueChange={(val) => field.onChange(val ? parseInt(val) : undefined)} 
                                value={field.value?.toString() || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Todas as instituições" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="">Todas as instituições</SelectItem>
                                  {institutions?.map((institution: any) => (
                                    <SelectItem key={institution.id} value={institution.id.toString()}>
                                      {institution.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={reportFilterForm.control}
                          name="accessStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status de Acesso</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Todos os status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="">Todos os status</SelectItem>
                                  <SelectItem value="not_granted">Não concedido</SelectItem>
                                  <SelectItem value="active">Ativo</SelectItem>
                                  <SelectItem value="blocked">Bloqueado</SelectItem>
                                  <SelectItem value="expired">Expirado</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={reportFilterForm.control}
                          name="searchTerm"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Buscar</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input 
                                    placeholder="Nome, email ou código" 
                                    className="pl-8" 
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button 
                        type="button" 
                        onClick={onApplyFilter}
                        disabled={isLoadingReport}
                      >
                        {isLoadingReport ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Carregando...
                          </>
                        ) : "Aplicar Filtros"}
                      </Button>
                    </form>
                  </Form>

                  <Separator className="my-6" />

                  <div className="rounded-md border">
                    <Table>
                      <TableCaption>Lista de alunos e status de acesso ao portal</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Matrícula</TableHead>
                          <TableHead>Aluno</TableHead>
                          <TableHead>Curso</TableHead>
                          <TableHead>Instituição</TableHead>
                          <TableHead>Status de Acesso</TableHead>
                          <TableHead>Acesso Desde</TableHead>
                          <TableHead>Validade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accessReport?.enrollments?.length > 0 ? (
                          accessReport.enrollments.map((enrollment: any) => (
                            <TableRow key={enrollment.id}>
                              <TableCell className="font-medium">{enrollment.code}</TableCell>
                              <TableCell>{enrollment.studentName}</TableCell>
                              <TableCell>{enrollment.courseName}</TableCell>
                              <TableCell>{enrollment.institutionName}</TableCell>
                              <TableCell>
                                {renderStatusBadge(enrollment.accessStatus)}
                                {enrollment.blockReason && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Motivo: {enrollment.blockReason}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {enrollment.accessGrantedAt ? (
                                  format(new Date(enrollment.accessGrantedAt), "dd/MM/yyyy", { locale: ptBR })
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {enrollment.accessExpiresAt ? (
                                  format(new Date(enrollment.accessExpiresAt), "dd/MM/yyyy", { locale: ptBR })
                                ) : (
                                  <span className="text-muted-foreground">Sem data</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                              {isLoadingReport ? (
                                <div className="flex justify-center items-center">
                                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                                  <span className="ml-2">Carregando dados...</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center">
                                  <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                                  <span>Nenhum registro encontrado</span>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
}