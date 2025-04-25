import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  UploadCloud, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  RefreshCcw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileCheck,
  Inbox
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useLocation, Link } from "wouter";

import {
  ChartIcon,
  PaymentsIcon,
  PeopleIcon,
  TrendingUpIcon,
  GroupIcon,
  AccountBalanceIcon,
  ComputerIcon,
  ShowChartIcon,
  SettingsIcon,
  HelpOutlineIcon,
  PersonAddIcon,
  MonetizationOnIcon,
  ArrowUpwardIcon,
  ReceiptIcon,
  AwardIcon
} from "@/components/ui/icons";

export default function CertificacaoPage() {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("solicitacoes");
  const [location, setLocation] = useLocation();

  // Mapeamento dos status para variantes de badge
  const statusVariantMap: Record<string, "success" | "pending" | "error" | "warning"> = {
    "aprovada": "success",
    "pendente": "pending",
    "rejeitada": "error",
    "emitida": "success",
    "em_analise": "warning"
  };

  // Mapeamento dos status para texto de exibição
  const statusTextMap: Record<string, string> = {
    "aprovada": "Aprovada",
    "pendente": "Pendente",
    "rejeitada": "Rejeitada",
    "emitida": "Emitida",
    "em_analise": "Em Análise"
  };

  // Mapeamento dos ícones por status
  const statusIconMap: Record<string, JSX.Element> = {
    "aprovada": <CheckCircle className="h-4 w-4 text-green-500" />,
    "pendente": <Clock className="h-4 w-4 text-yellow-500" />,
    "rejeitada": <XCircle className="h-4 w-4 text-red-500" />,
    "emitida": <FileCheck className="h-4 w-4 text-green-500" />,
    "em_analise": <AlertCircle className="h-4 w-4 text-orange-500" />
  };

  // Sidebar items for partner portal
  const sidebarItems = [
    { name: "Dashboard", icon: <ChartIcon />, href: "/partner/dashboard" },
    { name: "Certificação", icon: <AwardIcon />, active: true, href: "/partner/certificacao" },
    { name: "Referências", icon: <PeopleIcon />, href: "/partner/referrals" },
    { name: "Comissões", icon: <MonetizationOnIcon />, href: "/partner/commissions" },
    { name: "Materiais", icon: <ComputerIcon />, href: "/partner/materials" },
    { name: "Relatórios", icon: <ShowChartIcon />, href: "/partner/reports" },
    { name: "Suporte", icon: <HelpOutlineIcon />, href: "/partner/support" },
    { name: "Configurações", icon: <SettingsIcon />, href: "/partner/settings" },
  ];

  // Hook para buscar as solicitações de certificação
  const [isLoading, setIsLoading] = useState(false);
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mapear status da API para nossos status de exibição
  const mapApiStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'pendente',
      'under_review': 'em_analise',
      'rejected': 'rejeitada',
      'approved': 'aprovada',
      'payment_pending': 'pendente',
      'payment_confirmed': 'em_analise',
      'processing': 'em_analise',
      'completed': 'emitida',
      'cancelled': 'rejeitada'
    };
    return statusMap[status] || 'pendente';
  };

  // Função para buscar as solicitações
  const fetchSolicitacoes = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Obter o token de autenticação
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setErrorMessage("Você precisa estar autenticado para visualizar as solicitações");
        setIsLoading(false);
        return;
      }
      
      const response = await fetch('/api/certification/requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setErrorMessage("Sessão expirada. Por favor, faça login novamente.");
        } else {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
      } else {
        const data = await response.json();
        
        // Formatar os dados para o formato esperado pelo componente
        const formattedData = data.data?.map((item: any) => ({
          id: item.id,
          aluno: item.students && item.students[0]?.name || "Nome não disponível",
          curso: item.title || "Curso não disponível",
          data: new Date(item.submittedAt).toLocaleDateString('pt-BR'),
          status: mapApiStatus(item.status)
        })) || [];
        
        setSolicitacoes(formattedData);
      }
    } catch (error) {
      console.error("Erro ao buscar solicitações:", error);
      setErrorMessage("Não foi possível carregar as solicitações. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar solicitações ao montar o componente
  useEffect(() => {
    fetchSolicitacoes();
  }, []);

  const certificadosEmitidos = [
    { id: 1, aluno: "Juliana Costa", curso: "MBA em Marketing Digital", dataEmissao: "28/03/2025", status: "emitida" },
    { id: 2, aluno: "Ricardo Almeida", curso: "MBA em Gestão de Projetos", dataEmissao: "20/03/2025", status: "emitida" },
    { id: 3, aluno: "Fernanda Oliveira", curso: "Pós em Psicopedagogia", dataEmissao: "15/03/2025", status: "emitida" },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        items={sidebarItems}
        user={user}
        portalType="partner"
        portalColor="#7C4DFC"
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 py-20 md:py-6 md:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Certificação de Alunos</h1>
            <p className="text-gray-600">Gerencie as solicitações de certificação para seus alunos.</p>
          </div>

          <Tabs 
            defaultValue="solicitacoes" 
            className="w-full" 
            value={activeTab} 
            onValueChange={setActiveTab}
          >
            <div className="flex justify-between items-center mb-6">
              <TabsList className="grid grid-cols-2 w-auto">
                <TabsTrigger value="solicitacoes">Solicitações</TabsTrigger>
                <TabsTrigger value="certificados">Certificados Emitidos</TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
                <Button variant="outline" size="sm" onClick={fetchSolicitacoes}>
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
                <Button size="sm" onClick={() => setLocation("/partner/certificacao/nova")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Solicitação
                </Button>
              </div>
            </div>

            {/* Conteúdo da aba Solicitações */}
            <TabsContent value="solicitacoes" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Suas Solicitações</CardTitle>
                      <CardDescription>
                        Acompanhe o status das suas solicitações de certificação
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative max-w-xs">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar solicitação..." className="pl-8" />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 p-3 text-sm font-medium bg-muted">
                      <div>Aluno</div>
                      <div>Curso</div>
                      <div>Data Solicitação</div>
                      <div>Status</div>
                      <div className="text-right">Ações</div>
                    </div>
                    <ScrollArea className="h-[400px]">
                      {isLoading ? (
                        <div className="p-8 text-center">
                          <div className="flex justify-center mb-4">
                            <svg className="animate-spin h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                          <p className="text-gray-500">Carregando solicitações...</p>
                        </div>
                      ) : errorMessage ? (
                        <div className="p-8 text-center">
                          <div className="flex justify-center mb-4">
                            <AlertCircle className="h-8 w-8 text-red-500" />
                          </div>
                          <p className="text-gray-700 mb-4">{errorMessage}</p>
                          <Button variant="outline" size="sm" onClick={fetchSolicitacoes}>
                            <RefreshCcw className="h-4 w-4 mr-2" />
                            Tentar novamente
                          </Button>
                        </div>
                      ) : solicitacoes.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className="flex justify-center mb-4">
                            <Inbox className="h-8 w-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500 mb-4">Nenhuma solicitação de certificação encontrada.</p>
                          <Button variant="default" size="sm" onClick={() => setLocation("/partner/certificacao/nova")}>
                            <Plus className="h-4 w-4 mr-2" />
                            Criar nova solicitação
                          </Button>
                        </div>
                      ) : (
                        solicitacoes.map((solicitacao) => (
                          <div 
                            key={solicitacao.id} 
                            className="grid grid-cols-5 items-center p-3 text-sm border-t"
                          >
                            <div className="font-medium">{solicitacao.aluno}</div>
                            <div>{solicitacao.curso}</div>
                            <div>{solicitacao.data}</div>
                            <div className="flex items-center">
                              <Badge variant={statusVariantMap[solicitacao.status]} className="flex items-center">
                                {statusIconMap[solicitacao.status]}
                                <span className="ml-1">{statusTextMap[solicitacao.status]}</span>
                              </Badge>
                            </div>
                            <div className="text-right space-x-1">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Detalhes</span>
                              </Button>
                              {solicitacao.status === "emitida" && (
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
                                  <span className="sr-only">Baixar</span>
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Conteúdo da aba Certificados Emitidos */}
            <TabsContent value="certificados" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Certificados Emitidos</CardTitle>
                      <CardDescription>
                        Certificados e históricos escolares disponíveis para download
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative max-w-xs">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar certificado..." className="pl-8" />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 p-3 text-sm font-medium bg-muted">
                      <div>Aluno</div>
                      <div>Curso</div>
                      <div>Data Emissão</div>
                      <div>Status</div>
                      <div className="text-right">Documentos</div>
                    </div>
                    <ScrollArea className="h-[400px]">
                      {certificadosEmitidos.map((certificado) => (
                        <div 
                          key={certificado.id} 
                          className="grid grid-cols-5 items-center p-3 text-sm border-t"
                        >
                          <div className="font-medium">{certificado.aluno}</div>
                          <div>{certificado.curso}</div>
                          <div>{certificado.dataEmissao}</div>
                          <div>
                            <Badge variant="success" className="flex items-center">
                              <FileCheck className="h-4 w-4 mr-1" />
                              Emitido
                            </Badge>
                          </div>
                          <div className="text-right space-x-1">
                            <Button variant="ghost" size="sm" className="text-xs">
                              <FileText className="h-4 w-4 mr-1" />
                              Certificado
                            </Button>
                            <Button variant="ghost" size="sm" className="text-xs">
                              <FileText className="h-4 w-4 mr-1" />
                              Histórico
                            </Button>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Informações e Ajuda */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Sobre a Certificação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  O processo de certificação permite gerar certificados e históricos escolares oficiais para alunos que concluíram seus cursos.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2 flex items-center">
                      <UploadCloud className="h-5 w-5 mr-2 text-purple-600" />
                      Solicitar
                    </h3>
                    <p className="text-sm text-gray-600">Envie os documentos do aluno e solicite a certificação.</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2 flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-orange-500" />
                      Aprovação
                    </h3>
                    <p className="text-sm text-gray-600">Nossa equipe analisará os documentos e aprovará a emissão.</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2 flex items-center">
                      <FileCheck className="h-5 w-5 mr-2 text-green-600" />
                      Certificado
                    </h3>
                    <p className="text-sm text-gray-600">Após aprovação, o certificado estará disponível para download.</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline" size="sm">
                Ver tutorial
              </Button>
              <Button variant="outline" size="sm">
                FAQ de certificação
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Badge component para status
function Badge({ variant, children, className }: { 
  variant: 'success' | 'pending' | 'error' | 'warning'; 
  children: React.ReactNode;
  className?: string;
}) {
  const variantClassMap = {
    'success': 'bg-green-100 text-green-800 border-green-200',
    'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'error': 'bg-red-100 text-red-800 border-red-200',
    'warning': 'bg-orange-100 text-orange-800 border-orange-200'
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantClassMap[variant]} ${className || ''}`}>
      {children}
    </span>
  );
}