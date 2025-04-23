import React, { useState } from "react";
import { useLocation } from "wouter";
import AdminLayout from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { 
  FileCheck, 
  Clock, 
  Search, 
  Download, 
  CheckCircle2,
  XCircle,
  Filter,
  Eye,
  BarChart4,
  FileText,
  CircleDollarSign
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SolicitacoesPendentesPage() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  return (
    <AdminLayout
      title="Solicitações Pendentes"
      subtitle="Acompanhe e gerencie todas as solicitações de certificação em andamento"
    >
      <div className="space-y-6">
        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Solicitações
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">48</div>
              <p className="text-xs text-muted-foreground">
                Em todos os status
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Aguardando Pagamento
              </CardTitle>
              <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15</div>
              <p className="text-xs text-muted-foreground">
                31% do total
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Aguardando Análise
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">22</div>
              <p className="text-xs text-muted-foreground">
                46% do total
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Prontas para Emissão
              </CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">11</div>
              <p className="text-xs text-muted-foreground">
                23% do total
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative max-w-xs">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar solicitação..." className="pl-8" />
            </div>
            
            <div className="w-[180px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending_payment">Aguardando Pagamento</SelectItem>
                  <SelectItem value="pending_analysis">Aguardando Análise</SelectItem>
                  <SelectItem value="ready">Pronto para Emissão</SelectItem>
                  <SelectItem value="rejected">Recusado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-[200px]">
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Instituição Parceira" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Instituições</SelectItem>
                  <SelectItem value="fac1">Faculdade Exemplo 1</SelectItem>
                  <SelectItem value="fac2">Faculdade Exemplo 2</SelectItem>
                  <SelectItem value="fac3">Faculdade Exemplo 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Mais Filtros
            </Button>
            <Button variant="default" size="sm">
              <BarChart4 className="h-4 w-4 mr-2" />
              Relatório
            </Button>
          </div>
        </div>
        
        {/* Tabela principal */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Lista de Solicitações</CardTitle>
                <CardDescription>
                  Gerencie as solicitações de certificação de todos os parceiros
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="grid grid-cols-9 p-3 text-sm font-medium bg-muted">
                <div className="col-span-2">Aluno</div>
                <div className="col-span-1">Instituição</div>
                <div className="col-span-1">Curso</div>
                <div className="col-span-1">Data</div>
                <div className="col-span-1">Finanças</div>
                <div className="col-span-1">Documentos</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1 text-right">Ações</div>
              </div>
              <ScrollArea className="h-[400px]">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => {
                  // Status simulados para visualização da interface
                  const status = 
                    item % 3 === 0 ? "pending_payment" : 
                    item % 3 === 1 ? "pending_analysis" : "ready";
                  
                  const documentStatus = 
                    item % 4 === 0 ? "incomplete" : 
                    item % 4 === 1 ? "pending" : "complete";
                  
                  const paymentStatus = 
                    item % 3 === 0 ? "pending" : 
                    item % 3 === 1 ? "processing" : "paid";
                  
                  return (
                    <div 
                      key={item} 
                      className="grid grid-cols-9 items-center p-3 text-sm border-t"
                    >
                      <div className="col-span-2 font-medium">Maria Silva dos Santos</div>
                      <div className="col-span-1">Faculdade Exemplo</div>
                      <div className="col-span-1">MBA em Gestão</div>
                      <div className="col-span-1">15/04/2025</div>
                      <div className="col-span-1">
                        {renderPaymentBadge(paymentStatus)}
                      </div>
                      <div className="col-span-1">
                        {renderDocumentBadge(documentStatus)}
                      </div>
                      <div className="col-span-1">
                        {renderStatusBadge(status)}
                      </div>
                      <div className="col-span-1 text-right space-x-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Visualizar</span>
                        </Button>
                        {status === "ready" && (
                          <Button variant="ghost" size="sm">
                            <FileCheck className="h-4 w-4" />
                            <span className="sr-only">Emitir</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

// Badge componente para diferentes status
function renderStatusBadge(status: string) {
  switch (status) {
    case "pending_payment":
      return <Badge variant="warning">Aguardando Pagamento</Badge>;
    case "pending_analysis":
      return <Badge variant="pending">Aguardando Análise</Badge>;
    case "ready":
      return <Badge variant="success">Pronto p/ Emissão</Badge>;
    case "rejected":
      return <Badge variant="error">Recusado</Badge>;
    default:
      return <Badge variant="pending">{status}</Badge>;
  }
}

function renderPaymentBadge(status: string) {
  switch (status) {
    case "paid":
      return <Badge variant="success">Pago</Badge>;
    case "pending":
      return <Badge variant="warning">Pendente</Badge>;
    case "processing":
      return <Badge variant="pending">Processando</Badge>;
    default:
      return <Badge variant="pending">{status}</Badge>;
  }
}

function renderDocumentBadge(status: string) {
  switch (status) {
    case "complete":
      return <Badge variant="success">Completos</Badge>;
    case "incomplete":
      return <Badge variant="error">Incompletos</Badge>;
    case "pending":
      return <Badge variant="pending">Pendentes</Badge>;
    default:
      return <Badge variant="pending">{status}</Badge>;
  }
}

// Badge component genérico com mais variantes 
function Badge({ variant, children }: { 
  variant: 'success' | 'pending' | 'warning' | 'error'; 
  children: React.ReactNode 
}) {
  const colorClass = 
    variant === 'success' ? 'bg-green-100 text-green-800' : 
    variant === 'pending' ? 'bg-blue-100 text-blue-800' : 
    variant === 'warning' ? 'bg-yellow-100 text-yellow-800' : 
    'bg-red-100 text-red-800';
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {children}
    </span>
  );
}