import React, { useState } from "react";
import { useLocation } from "wouter";
import AdminLayout from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { 
  CircleDollarSign, 
  GraduationCap, 
  Users, 
  Building2, 
  FileCheck, 
  BarChart4, 
  Plus, 
  Settings,
  Loader2,
  ArrowRight
} from "lucide-react";
import { useCertificationRequests } from "@/hooks/use-certification-requests";
import { useCertificationStats } from "@/hooks/use-certification-stats";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

export default function PortalDoParceiroPage() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("visao-geral");
  
  // Buscar estatísticas
  const { 
    data: statsData, 
    isLoading: isLoadingStats,
    error: statsError
  } = useCertificationStats();
  
  // Buscar requisições recentes
  const { 
    data: requestsData, 
    isLoading: isLoadingRequests,
    error: requestsError
  } = useCertificationRequests({ limit: 5 });

  // Esta página servirá como um dashboard para o Portal do Parceiro
  return (
    <AdminLayout
      title="Portal do Parceiro"
      subtitle="Gerencie instituições parceiras e suas certificações"
    >
      <Tabs 
        defaultValue="visao-geral" 
        className="w-full" 
        value={activeTab} 
        onValueChange={setActiveTab}
      >
        <div className="flex justify-between items-center mb-6">
          <TabsList className="grid grid-cols-4 w-auto">
            <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="instituicoes">Instituições Parceiras</TabsTrigger>
            <TabsTrigger value="solicitacoes">Solicitações</TabsTrigger>
            <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Instituição Parceira
            </Button>
          </div>
        </div>

        {/* Conteúdo da aba Visão Geral */}
        <TabsContent value="visao-geral" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Instituições Parceiras
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  <div className="text-2xl font-bold">
                    {statsData?.institutionsCount || 0}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {isLoadingStats ? (
                    <Skeleton className="h-4 w-24 mt-1" />
                  ) : (
                    `+${statsData?.newInstitutionsLastMonth || 0} no último mês`
                  )}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Certificações Emitidas
                </CardTitle>
                <FileCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  <div className="text-2xl font-bold">
                    {statsData?.totalCertificatesIssued || 0}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {isLoadingStats ? (
                    <Skeleton className="h-4 w-24 mt-1" />
                  ) : (
                    `+${statsData?.newCertificatesLastMonth || 0} no último mês`
                  )}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Receita Total
                </CardTitle>
                <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <Skeleton className="h-9 w-28" />
                ) : (
                  <div className="text-2xl font-bold">
                    {formatCurrency(statsData?.totalRevenue || 0)}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {isLoadingStats ? (
                    <Skeleton className="h-4 w-32 mt-1" />
                  ) : (
                    `+${formatCurrency(statsData?.revenueLastMonth || 0)} no último mês`
                  )}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Solicitações Pendentes
                </CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  <div className="text-2xl font-bold">
                    {(statsData?.pending || 0) + (statsData?.underReview || 0)}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {isLoadingStats ? (
                    <Skeleton className="h-4 w-32 mt-1" />
                  ) : (
                    `${statsData?.paymentPending || 0} aguardando pagamento`
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Solicitações Recentes</CardTitle>
                <CardDescription>
                  Solicitações de certificação dos últimos 30 dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRequests ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="flex justify-between items-center border-b pb-2">
                        <div className="w-full">
                          <Skeleton className="h-5 w-48 mb-1" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : requestsError ? (
                  <div className="text-center py-6 text-red-500">
                    <p>Erro ao carregar solicitações. Tente novamente.</p>
                  </div>
                ) : requestsData?.data?.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>Nenhuma solicitação recente encontrada.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {requestsData?.data?.map((request) => (
                      <div key={request.id} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <p className="font-medium">{request.institution?.name || 'Instituição'}</p>
                          <p className="text-sm text-muted-foreground">
                            {request.totalStudents} certificações - {request.title}
                          </p>
                        </div>
                        <StatusBadge status={request.status} />
                      </div>
                    ))}
                    <Button 
                      variant="link" 
                      className="mt-4 px-0 flex items-center" 
                      onClick={() => setActiveTab("solicitacoes")}
                    >
                      Ver todas as solicitações
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Certificações por Instituição</CardTitle>
                <CardDescription>
                  Total de certificados emitidos por parceiro
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isLoadingStats ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : statsError ? (
                  <div className="text-center text-red-500 h-full flex items-center justify-center">
                    <p>Erro ao carregar dados. Tente novamente.</p>
                  </div>
                ) : !statsData?.certificatesByInstitution?.length ? (
                  <div className="text-center text-muted-foreground h-full flex flex-col items-center justify-center">
                    <BarChart4 className="h-16 w-16 mx-auto mb-2 opacity-50" />
                    <p>Não há dados suficientes para gerar o gráfico</p>
                  </div>
                ) : (
                  <div className="h-full flex flex-col justify-center">
                    {statsData.certificatesByInstitution.map((item, index) => (
                      <div key={index} className="mb-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium truncate max-w-[70%]">
                            {item.institutionName}
                          </span>
                          <span className="text-sm font-semibold">{item.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-primary h-2.5 rounded-full" 
                            style={{ 
                              width: `${Math.min(
                                100, 
                                (item.count / Math.max(...statsData.certificatesByInstitution.map(i => i.count))) * 100
                              )}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Conteúdo da aba Instituições Parceiras */}
        <TabsContent value="instituicoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Instituições Parceiras</CardTitle>
              <CardDescription>
                Gerencie todas as instituições parceiras e seus dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="mb-4">Este módulo está em desenvolvimento</p>
                <p>Lista de instituições parceiras será exibida aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conteúdo da aba Solicitações */}
        <TabsContent value="solicitacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações de Certificação</CardTitle>
              <CardDescription>
                Gerencie todas as solicitações de certificação dos parceiros
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRequests ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </div>
              ) : requestsError ? (
                <div className="text-center py-8 text-red-500">
                  <p className="mb-4">Erro ao carregar solicitações</p>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : !requestsData?.data?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GraduationCap className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">Nenhuma solicitação de certificação encontrada</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-12 py-3 px-4 border-b bg-muted/50 font-medium text-sm">
                    <div className="col-span-2">Código</div>
                    <div className="col-span-3">Instituição</div>
                    <div className="col-span-3">Título</div>
                    <div className="col-span-1 text-center">Alunos</div>
                    <div className="col-span-2 text-center">Valor</div>
                    <div className="col-span-1 text-right">Status</div>
                  </div>
                  
                  {requestsData.data.map((request) => (
                    <div 
                      key={request.id} 
                      className="grid grid-cols-12 py-3 px-4 border-b hover:bg-muted/30 cursor-pointer"
                      onClick={() => navigate(`/admin/parcerias/portal/solicitacoes/${request.id}`)}
                    >
                      <div className="col-span-2 font-medium">{request.code}</div>
                      <div className="col-span-3 truncate">{request.institution?.name || '-'}</div>
                      <div className="col-span-3 truncate">{request.title}</div>
                      <div className="col-span-1 text-center">{request.totalStudents}</div>
                      <div className="col-span-2 text-center">{formatCurrency(request.totalAmount)}</div>
                      <div className="col-span-1 text-right">
                        <StatusBadge status={request.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conteúdo da aba Configurações */}
        <TabsContent value="configuracoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Portal do Parceiro</CardTitle>
              <CardDescription>
                Defina as regras e parâmetros para o funcionamento do portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="mb-4">Este módulo está em desenvolvimento</p>
                <p>Configurações do portal de parceiros serão exibidas aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}

// Badge para status de solicitação de certificação
function StatusBadge({ status }: { status: string }) {
  let variant: 'success' | 'pending' | 'error' | 'processing' | 'complete';
  let label: string;
  
  switch (status) {
    case 'pending':
      variant = 'pending';
      label = 'Pendente';
      break;
    case 'under_review':
      variant = 'processing';
      label = 'Em Análise';
      break;
    case 'approved':
      variant = 'success';
      label = 'Aprovado';
      break;
    case 'rejected':
      variant = 'error';
      label = 'Rejeitado';
      break;
    case 'payment_pending':
      variant = 'pending';
      label = 'Aguardando Pgto';
      break;
    case 'payment_confirmed':
      variant = 'success';
      label = 'Pago';
      break;
    case 'processing':
      variant = 'processing';
      label = 'Processando';
      break;
    case 'completed':
      variant = 'complete';
      label = 'Concluído';
      break;
    case 'cancelled':
      variant = 'error';
      label = 'Cancelado';
      break;
    default:
      variant = 'pending';
      label = status;
  }
  
  return <Badge variant={variant}>{label}</Badge>;
}

// Badge component para status
function Badge({ 
  variant, 
  children 
}: { 
  variant: 'success' | 'pending' | 'error' | 'processing' | 'complete'; 
  children: React.ReactNode 
}) {
  const colorClass = 
    variant === 'success' ? 'bg-green-100 text-green-800' : 
    variant === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
    variant === 'error' ? 'bg-red-100 text-red-800' : 
    variant === 'processing' ? 'bg-blue-100 text-blue-800' :
    'bg-green-100 text-green-800';
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {children}
    </span>
  );
}