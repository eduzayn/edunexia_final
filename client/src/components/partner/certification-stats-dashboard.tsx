import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { useCertificationStats } from "@/hooks/use-certification-stats";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  FileText,
  RotateCcw,
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Award,
  Users
} from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function CertificationStatsDashboard() {
  // Buscar estatísticas
  const { data: stats, isLoading, error } = useCertificationStats();

  // Dados para o gráfico de instituições 
  const institutionChartData = React.useMemo(() => {
    if (!stats?.certificatesByInstitution) return [];
    return stats.certificatesByInstitution.map(item => ({
      name: item.institutionName,
      value: item.count
    }));
  }, [stats?.certificatesByInstitution]);

  // Dados para o gráfico de status
  const statusChartData = React.useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Pendentes', value: stats.pending || 0 },
      { name: 'Em Análise', value: stats.underReview || 0 },
      { name: 'Aguardando Pagamento', value: stats.paymentPending || 0 },
      { name: 'Completas', value: (stats.totalCertificatesIssued || 0) - (stats.newCertificatesLastMonth || 0) }
    ].filter(item => item.value > 0);
  }, [stats]);

  // Renderização condicional para loading
  if (isLoading) {
    return <CertificationStatsSkeleton />;
  }

  // Renderização condicional para erro
  if (error || !stats) {
    return (
      <Card className="col-span-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-6 text-red-500">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>Erro ao carregar estatísticas de certificação. Tente novamente mais tarde.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Card de Certificados Emitidos */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Certificados Emitidos</p>
              <h3 className="text-2xl font-bold">{stats.totalCertificatesIssued || 0}</h3>
              {(stats.newCertificatesLastMonth || 0) > 0 && (
                <div className="flex items-center mt-1">
                  <Badge variant="outline" className="bg-green-50 text-green-700 text-xs font-normal">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{stats.newCertificatesLastMonth} no último mês
                  </Badge>
                </div>
              )}
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <Award className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Instituições */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Instituições</p>
              <h3 className="text-2xl font-bold">{stats.institutionsCount || 0}</h3>
              {(stats.newInstitutionsLastMonth || 0) > 0 && (
                <div className="flex items-center mt-1">
                  <Badge variant="outline" className="bg-green-50 text-green-700 text-xs font-normal">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{stats.newInstitutionsLastMonth} no último mês
                  </Badge>
                </div>
              )}
            </div>
            <div className="bg-indigo-100 p-2 rounded-full">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Receita Total */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Receita Total</p>
              <h3 className="text-2xl font-bold">{formatCurrency(stats.totalRevenue || 0)}</h3>
              {(stats.revenueLastMonth || 0) > 0 && (
                <div className="flex items-center mt-1">
                  <Badge variant="outline" className="bg-green-50 text-green-700 text-xs font-normal">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{formatCurrency(stats.revenueLastMonth)} no último mês
                  </Badge>
                </div>
              )}
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Solicitações Pendentes */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Solicitações Pendentes</p>
              <h3 className="text-2xl font-bold">{(stats.pending || 0) + (stats.underReview || 0) + (stats.paymentPending || 0)}</h3>
              <div className="flex items-center mt-1">
                <p className="text-xs text-muted-foreground">
                  {stats.underReview || 0} em análise • {stats.paymentPending || 0} aguardando pagamento
                </p>
              </div>
            </div>
            <div className="bg-amber-100 p-2 rounded-full">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Instituições */}
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Certificações por Instituição</CardTitle>
          <CardDescription>
            Distribuição de certificados emitidos por instituição
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            {institutionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={institutionChartData}
                  margin={{
                    top: 10,
                    right: 0,
                    left: 0,
                    bottom: 40,
                  }}
                >
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end"
                    height={60}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Status */}
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Status das Solicitações</CardTitle>
          <CardDescription>
            Distribuição de solicitações por status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center">
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Skeleton para loading state
function CertificationStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Skeletons para os 4 cards de estatísticas */}
      {Array(4).fill(0).map((_, index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}

      {/* Skeleton para o gráfico de instituições */}
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-1/2 mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>

      {/* Skeleton para o gráfico de status */}
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-1/2 mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}