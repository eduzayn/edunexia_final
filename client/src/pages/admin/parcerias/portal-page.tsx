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
  Settings 
} from "lucide-react";

export default function PortalDoParceiroPage() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("visao-geral");

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
            <TabsTrigger value="instituicoes">Instituições</TabsTrigger>
            <TabsTrigger value="cursos">Cursos</TabsTrigger>
            <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Instituição
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
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">
                  +2 no último mês
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
                <div className="text-2xl font-bold">245</div>
                <p className="text-xs text-muted-foreground">
                  +38 no último mês
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
                <div className="text-2xl font-bold">R$ 18.350,00</div>
                <p className="text-xs text-muted-foreground">
                  +R$ 4.200,00 no último mês
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
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">
                  3 aguardando pagamento
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
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-medium">Faculdade Exemplo {item}</p>
                        <p className="text-sm text-muted-foreground">4 certificações - MBA em Gestão</p>
                      </div>
                      <Badge variant={item % 2 === 0 ? "success" : "pending"}>
                        {item % 2 === 0 ? "Pago" : "Pendente"}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button variant="link" className="mt-4 px-0">Ver todas as solicitações</Button>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Certificações por Instituição</CardTitle>
                <CardDescription>
                  Total de certificados emitidos por parceiro
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart4 className="h-16 w-16 mx-auto mb-2 opacity-50" />
                  <p>Gráfico de certificações por instituição</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Conteúdo da aba Instituições */}
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

        {/* Conteúdo da aba Cursos */}
        <TabsContent value="cursos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cursos Disponíveis para Parceiros</CardTitle>
              <CardDescription>
                Gerenciar quais cursos cada parceiro pode certificar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <GraduationCap className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="mb-4">Este módulo está em desenvolvimento</p>
                <p>Lista de cursos e suas permissões por parceiro será exibida aqui</p>
              </div>
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

// Badge component para status
function Badge({ variant, children }: { variant: 'success' | 'pending' | 'error'; children: React.ReactNode }) {
  const colorClass = 
    variant === 'success' ? 'bg-green-100 text-green-800' : 
    variant === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
    'bg-red-100 text-red-800';
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {children}
    </span>
  );
}