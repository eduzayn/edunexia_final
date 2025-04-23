import React, { useState } from "react";
import { useLocation } from "wouter";
import AdminLayout from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { 
  ChevronDown, 
  Download, 
  BarChart4, 
  PieChart, 
  TrendingUp, 
  Calendar, 
  FileUp, 
  FileDown
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RelatoriosPage() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("certificacoes");
  
  // Estado para o seletor de data
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(2025, 3, 1), // 1º de Abril
    to: new Date(2025, 3, 23), // 23 de Abril
  });

  return (
    <AdminLayout
      title="Relatórios"
      subtitle="Acompanhe os indicadores de desempenho do Portal do Parceiro"
    >
      <Tabs 
        defaultValue="certificacoes" 
        className="w-full" 
        value={activeTab} 
        onValueChange={setActiveTab}
      >
        <div className="flex justify-between items-center mb-6">
          <TabsList className="grid grid-cols-3 w-auto">
            <TabsTrigger value="certificacoes">Certificações</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="auditoria">Logs de Auditoria</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <FileDown className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button variant="outline" size="sm">
              <FileUp className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
        
        {/* Filtros comuns para todos os relatórios */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Configure os parâmetros do relatório
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="w-full lg:w-1/5">
                <label className="text-sm font-medium mb-1 block">Instituição</label>
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todas as instituições" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as instituições</SelectItem>
                    <SelectItem value="fac1">Faculdade Exemplo 1</SelectItem>
                    <SelectItem value="fac2">Faculdade Exemplo 2</SelectItem>
                    <SelectItem value="fac3">Faculdade Exemplo 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full lg:w-1/5">
                <label className="text-sm font-medium mb-1 block">Curso</label>
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todos os cursos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os cursos</SelectItem>
                    <SelectItem value="mba">MBA em Gestão</SelectItem>
                    <SelectItem value="posgrad">Pós Graduação</SelectItem>
                    <SelectItem value="licenciatura">Segunda Licenciatura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full lg:w-1/5">
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="approved">Aprovadas</SelectItem>
                    <SelectItem value="issued">Emitidas</SelectItem>
                    <SelectItem value="rejected">Recusadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full lg:w-2/5">
                <label className="text-sm font-medium mb-1 block">Período</label>
                <DatePickerWithRange date={date} setDate={setDate} />
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button>
                <BarChart4 className="h-4 w-4 mr-2" />
                Gerar Relatório
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo da aba Certificações */}
        <TabsContent value="certificacoes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Certificações por Mês</CardTitle>
                <CardDescription>
                  Evolução do número de certificações emitidas
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="h-16 w-16 mx-auto mb-2 opacity-50" />
                  <p>Gráfico de linha - evolução temporal</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Certificações por Instituição</CardTitle>
                <CardDescription>
                  Distribuição por parceiro
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <PieChart className="h-16 w-16 mx-auto mb-2 opacity-50" />
                  <p>Gráfico de pizza - distribuição por parceiro</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Relatório Detalhado de Certificações</CardTitle>
              <CardDescription>
                Análise completa de todos os certificados emitidos no período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-8 p-3 text-sm font-medium bg-muted">
                  <div className="col-span-2">Instituição</div>
                  <div>Curso</div>
                  <div>Certificados Emitidos</div>
                  <div>Taxa Média (R$)</div>
                  <div>Receita Total (R$)</div>
                  <div>Tempo Médio (dias)</div>
                  <div>Taxa de Conversão</div>
                </div>
                <div className="divide-y">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div 
                      key={item} 
                      className="grid grid-cols-8 items-center p-3 text-sm"
                    >
                      <div className="col-span-2 font-medium">Faculdade Exemplo {item}</div>
                      <div>Pós-Graduação</div>
                      <div>{35 + item * 3}</div>
                      <div>R$ {(150 + item * 10).toFixed(2)}</div>
                      <div>R$ {((150 + item * 10) * (35 + item * 3)).toFixed(2)}</div>
                      <div>{3 + (item % 3)}</div>
                      <div>{85 + (item % 10)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conteúdo da aba Financeiro */}
        <TabsContent value="financeiro" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Receita por Mês</CardTitle>
                <CardDescription>
                  Evolução da receita gerada com certificações
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart4 className="h-16 w-16 mx-auto mb-2 opacity-50" />
                  <p>Gráfico de barras - receita mensal</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Distribuição por Categoria</CardTitle>
                <CardDescription>
                  Receita por tipo de curso
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <PieChart className="h-16 w-16 mx-auto mb-2 opacity-50" />
                  <p>Gráfico de pizza - distribuição por categoria</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Relatório Financeiro Detalhado</CardTitle>
              <CardDescription>
                Análise completa das transações financeiras no período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-7 p-3 text-sm font-medium bg-muted">
                  <div className="col-span-2">Categoria do Curso</div>
                  <div>Valor Unitário (R$)</div>
                  <div>Certificados Emitidos</div>
                  <div>Receita Bruta (R$)</div>
                  <div>% do Total</div>
                  <div>Crescimento</div>
                </div>
                <div className="divide-y">
                  {[
                    {name: "Pós-Graduação Lato Sensu", value: 250, count: 98},
                    {name: "MBA", value: 280, count: 65},
                    {name: "Segunda Licenciatura", value: 220, count: 42},
                    {name: "Extensão", value: 180, count: 25},
                    {name: "Formação Continuada", value: 120, count: 15},
                  ].map((item, index) => (
                    <div 
                      key={index} 
                      className="grid grid-cols-7 items-center p-3 text-sm"
                    >
                      <div className="col-span-2 font-medium">{item.name}</div>
                      <div>R$ {item.value.toFixed(2)}</div>
                      <div>{item.count}</div>
                      <div>R$ {(item.value * item.count).toFixed(2)}</div>
                      <div>{Math.round((item.count / 245) * 100)}%</div>
                      <div className={index % 2 === 0 ? "text-green-600" : "text-red-600"}>
                        {index % 2 === 0 ? "+" : "-"}{4 + index}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conteúdo da aba Auditoria */}
        <TabsContent value="auditoria" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Auditoria</CardTitle>
              <CardDescription>
                Registro de todas as operações realizadas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-6 p-3 text-sm font-medium bg-muted">
                  <div>Data e Hora</div>
                  <div>Usuário</div>
                  <div>Tipo de Ação</div>
                  <div>Descrição</div>
                  <div>IP</div>
                  <div>Status</div>
                </div>
                <div className="divide-y">
                  {[
                    {
                      date: "23/04/2025 13:42:15",
                      user: "admin@edunexa.com",
                      action: "Emissão de Certificado",
                      description: "Emitido certificado para Maria Silva dos Santos",
                      ip: "192.168.1.105",
                      status: "Sucesso"
                    },
                    {
                      date: "23/04/2025 11:27:32",
                      user: "parceiro@faculdade.edu.br",
                      action: "Upload de Documentos",
                      description: "Enviados documentos para João Paulo Ferreira",
                      ip: "200.150.10.45",
                      status: "Sucesso"
                    },
                    {
                      date: "22/04/2025 18:15:07",
                      user: "admin@edunexa.com",
                      action: "Aprovação de Solicitação",
                      description: "Aprovada solicitação #3254 - Faculdade Exemplo",
                      ip: "192.168.1.105",
                      status: "Sucesso"
                    },
                    {
                      date: "22/04/2025 15:22:48",
                      user: "suporte@edunexa.com",
                      action: "Alteração de Status",
                      description: "Alterado status de pagamento da solicitação #3251",
                      ip: "192.168.1.110",
                      status: "Sucesso"
                    },
                    {
                      date: "21/04/2025 10:05:33",
                      user: "parceiro@instituto.edu.br",
                      action: "Criação de Solicitação",
                      description: "Criada nova solicitação de certificação em lote (15 alunos)",
                      ip: "187.122.45.78",
                      status: "Sucesso"
                    },
                    {
                      date: "20/04/2025 16:42:09",
                      user: "admin@edunexa.com",
                      action: "Configuração",
                      description: "Alterado valor de certificação para MBA",
                      ip: "192.168.1.112",
                      status: "Sucesso"
                    },
                    {
                      date: "20/04/2025 14:18:22",
                      user: "parceiro@faculdade.edu.br",
                      action: "Login",
                      description: "Tentativa de login falha - senha incorreta",
                      ip: "200.150.10.45",
                      status: "Falha"
                    },
                  ].map((log, index) => (
                    <div 
                      key={index} 
                      className="grid grid-cols-6 items-center p-3 text-sm"
                    >
                      <div>{log.date}</div>
                      <div className="font-medium">{log.user}</div>
                      <div>{log.action}</div>
                      <div>{log.description}</div>
                      <div>{log.ip}</div>
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          log.status === "Sucesso" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {log.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}