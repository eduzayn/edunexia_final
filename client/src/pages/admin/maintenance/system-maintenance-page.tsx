import { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Settings, 
  Tool, 
  Database, 
  RefreshCcw 
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnrollmentRecoveryTool } from '@/components/admin/enrollments/EnrollmentRecoveryTool';
import { AdminLayout } from '@/components/layouts/admin-layout';

export default function SystemMaintenancePage() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('enrollments');

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/admin')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Manutenção do Sistema</h1>
              <p className="text-sm text-muted-foreground">
                Ferramentas para manutenção e diagnóstico da plataforma
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Acesso administrativo</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Tool className="h-5 w-5 mr-2 text-primary" />
              Centro de Manutenção
            </CardTitle>
            <CardDescription>
              Use estas ferramentas com cautela. Ações realizadas aqui podem afetar diretamente a experiência dos usuários.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="enrollments" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="enrollments" className="flex items-center">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Matrículas
                </TabsTrigger>
                <TabsTrigger value="database" className="flex items-center">
                  <Database className="h-4 w-4 mr-2" />
                  Banco de Dados
                </TabsTrigger>
                <TabsTrigger value="diagnostic" className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Diagnóstico
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="enrollments" className="py-4">
                <EnrollmentRecoveryTool />
              </TabsContent>
              
              <TabsContent value="database" className="py-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Manutenção do Banco de Dados</CardTitle>
                    <CardDescription>
                      Ferramentas para otimização e manutenção do banco de dados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Esta seção será implementada em uma versão futura do sistema.
                    </p>
                    <Button variant="outline" disabled>
                      Verificar Integridade
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="diagnostic" className="py-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Diagnóstico do Sistema</CardTitle>
                    <CardDescription>
                      Ferramentas para diagnóstico e análise de problemas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Esta seção será implementada em uma versão futura do sistema.
                    </p>
                    <Button variant="outline" disabled>
                      Iniciar Diagnóstico
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-xs text-center text-muted-foreground pt-4">
          <p>EdunexIA - Sistema de Manutenção - Versão 1.0.0</p>
          <p>Use estas ferramentas com responsabilidade. Todas as ações são registradas.</p>
        </div>
      </div>
    </AdminLayout>
  );
}