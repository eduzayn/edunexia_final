import React, { useState } from "react";
import { useLocation } from "wouter";
import AdminLayout from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import {
  FileCheck,
  Upload,
  Clock,
  Search,
  Download,
  Printer,
  Filter,
  RefreshCcw,
  Users,
  BookOpen,
  CheckCircle,
  XCircle,
  Eye,
  File,
  FileText,
  ThumbsUp,
  ThumbsDown,
  CircleDollarSign,
  ExternalLink,
  Mail,
  AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

// Definição de tipos para os modelos
interface Documento {
  id: number;
  nome: string;
  tipo: string;
  url: string;
  validado?: boolean;
}

interface Aluno {
  id: number;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
}

interface Curso {
  id: number;
  nome: string;
  categoria: string;
  cargaHoraria: number;
  disciplinas: {
    nome: string;
    cargaHoraria: number;
    professor: string;
  }[];
}

interface Instituicao {
  id: number;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
}

interface SolicitacaoCertificacao {
  id: number;
  aluno: Aluno;
  curso: Curso;
  instituicao: Instituicao;
  documentos: Documento[];
  dataSolicitacao: string;
  status: 'pendente' | 'aprovada' | 'rejeitada' | 'emitida';
  statusPagamento: 'pendente' | 'pago' | 'atrasado';
  dataAprovacao?: string;
  dataEmissao?: string;
  observacoes?: string;
  valorCertificacao: number;
}

export default function CertificacaoAlunosPage() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("pendentes");
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [validacaoDocumentos, setValidacaoDocumentos] = useState<Record<number, boolean>>({});
  const [observacoes, setObservacoes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [confirmacaoDialogAberta, setConfirmacaoDialogAberta] = useState(false);
  const [acaoConfirmacao, setAcaoConfirmacao] = useState<'aprovar' | 'rejeitar' | null>(null);

  // Mock data - será substituído pela chamada à API
  const mockSolicitacao: SolicitacaoCertificacao = {
    id: 1,
    aluno: {
      id: 1,
      nome: "Maria Silva dos Santos",
      cpf: "123.456.789-00",
      email: "maria.silva@exemplo.com",
      telefone: "(11) 98765-4321"
    },
    curso: {
      id: 1,
      nome: "MBA em Gestão Empresarial",
      categoria: "Pós-graduação",
      cargaHoraria: 420,
      disciplinas: [
        { nome: "Gestão Estratégica", cargaHoraria: 60, professor: "Dr. João Silva" },
        { nome: "Finanças Corporativas", cargaHoraria: 60, professor: "Dra. Ana Paula Souza" },
        { nome: "Marketing Digital", cargaHoraria: 60, professor: "Dr. Ricardo Oliveira" },
        { nome: "Gestão de Pessoas", cargaHoraria: 60, professor: "Dra. Carla Santos" },
        { nome: "Empreendedorismo", cargaHoraria: 60, professor: "Dr. Marcelo Almeida" },
        { nome: "Inovação e Tecnologia", cargaHoraria: 60, professor: "Dr. Fernando Costa" },
        { nome: "Metodologia Científica", cargaHoraria: 60, professor: "Dra. Juliana Ferreira" }
      ]
    },
    instituicao: {
      id: 1,
      nome: "Faculdade Dynamus",
      cnpj: "12.345.678/0001-90",
      email: "contato@faculdadedynamus.edu.br",
      telefone: "(11) 3456-7890"
    },
    documentos: [
      { id: 1, nome: "RG", tipo: "image/jpeg", url: "/uploads/rg.jpg" },
      { id: 2, nome: "CPF", tipo: "image/jpeg", url: "/uploads/cpf.jpg" },
      { id: 3, nome: "Diploma de Graduação", tipo: "application/pdf", url: "/uploads/diploma.pdf" },
      { id: 4, nome: "Histórico Escolar", tipo: "application/pdf", url: "/uploads/historico.pdf" }
    ],
    dataSolicitacao: "15/04/2025",
    status: "pendente",
    statusPagamento: "pendente",
    valorCertificacao: 250.00
  };

  const handleOpenDetails = (id: number) => {
    setSelectedSolicitacao(id);
    setDetailsOpen(true);
    // Inicializa o estado de validação dos documentos
    const validacaoInicial: Record<number, boolean> = {};
    mockSolicitacao.documentos.forEach(doc => {
      validacaoInicial[doc.id] = doc.validado || false;
    });
    setValidacaoDocumentos(validacaoInicial);
    setObservacoes(mockSolicitacao.observacoes || "");
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedSolicitacao(null);
    setObservacoes("");
    setRejectionReason("");
    setAcaoConfirmacao(null);
  };

  const handleDocumentoValidacaoChange = (docId: number, validado: boolean) => {
    setValidacaoDocumentos(prev => ({
      ...prev,
      [docId]: validado
    }));
  };

  const handleAprovarSolicitacao = () => {
    setAcaoConfirmacao('aprovar');
    setConfirmacaoDialogAberta(true);
  };

  const handleRejeitarSolicitacao = () => {
    setAcaoConfirmacao('rejeitar');
    setConfirmacaoDialogAberta(true);
  };

  const handleConfirmarAcao = () => {
    if (acaoConfirmacao === 'aprovar') {
      // Lógica para aprovar a solicitação
      console.log("Solicitação aprovada:", selectedSolicitacao);
      console.log("Validação de documentos:", validacaoDocumentos);
      console.log("Observações:", observacoes);
    } else if (acaoConfirmacao === 'rejeitar') {
      // Lógica para rejeitar a solicitação
      console.log("Solicitação rejeitada:", selectedSolicitacao);
      console.log("Motivo da rejeição:", rejectionReason);
    }
    setConfirmacaoDialogAberta(false);
    handleCloseDetails();
  };

  return (
    <AdminLayout
      title="Certificação de Alunos"
      subtitle="Gerencie as solicitações de certificação de alunos submetidas pelos parceiros"
    >
      <Tabs 
        defaultValue="pendentes" 
        className="w-full" 
        value={activeTab} 
        onValueChange={setActiveTab}
      >
        <div className="flex justify-between items-center mb-6">
          <TabsList className="grid grid-cols-3 w-auto">
            <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
            <TabsTrigger value="aprovadas">Aprovadas</TabsTrigger>
            <TabsTrigger value="emitidas">Emitidas</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Conteúdo da aba Pendentes */}
        <TabsContent value="pendentes" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Solicitações Pendentes de Análise</CardTitle>
                  <CardDescription>
                    Solicitações de certificação aguardando análise da documentação
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
                <div className="grid grid-cols-7 p-3 text-sm font-medium bg-muted">
                  <div className="col-span-2">Aluno</div>
                  <div>Instituição</div>
                  <div>Curso</div>
                  <div>Data</div>
                  <div>Status</div>
                  <div className="text-right">Ações</div>
                </div>
                <ScrollArea className="h-[400px]">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
                    <div 
                      key={item} 
                      className="grid grid-cols-7 items-center p-3 text-sm border-t"
                    >
                      <div className="col-span-2 font-medium">Maria Silva dos Santos</div>
                      <div>Faculdade Exemplo</div>
                      <div>MBA em Gestão</div>
                      <div>15/04/2025</div>
                      <div>
                        <Badge variant="pending">Aguardando</Badge>
                      </div>
                      <div className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleOpenDetails(item)}
                        >
                          <Search className="h-4 w-4" />
                          <span className="sr-only">Detalhes</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conteúdo da aba Aprovadas */}
        <TabsContent value="aprovadas" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Solicitações Aprovadas</CardTitle>
                  <CardDescription>
                    Solicitações com documentação validada e pagamento confirmado
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
                <div className="grid grid-cols-7 p-3 text-sm font-medium bg-muted">
                  <div className="col-span-2">Aluno</div>
                  <div>Instituição</div>
                  <div>Curso</div>
                  <div>Data</div>
                  <div>Status</div>
                  <div className="text-right">Ações</div>
                </div>
                <ScrollArea className="h-[400px]">
                  {[1, 2, 3].map((item) => (
                    <div 
                      key={item} 
                      className="grid grid-cols-7 items-center p-3 text-sm border-t"
                    >
                      <div className="col-span-2 font-medium">João Paulo Ferreira</div>
                      <div>Faculdade Exemplo</div>
                      <div>Segunda Licenciatura</div>
                      <div>12/04/2025</div>
                      <div>
                        <Badge variant="success">Aprovada</Badge>
                      </div>
                      <div className="text-right space-x-1">
                        <Button variant="ghost" size="sm">
                          <FileCheck className="h-4 w-4" />
                          <span className="sr-only">Emitir</span>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Search className="h-4 w-4" />
                          <span className="sr-only">Detalhes</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conteúdo da aba Emitidas */}
        <TabsContent value="emitidas" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Certificações Emitidas</CardTitle>
                  <CardDescription>
                    Certificados e históricos escolares já emitidos
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative max-w-xs">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar certificação..." className="pl-8" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-7 p-3 text-sm font-medium bg-muted">
                  <div className="col-span-2">Aluno</div>
                  <div>Instituição</div>
                  <div>Curso</div>
                  <div>Data Emissão</div>
                  <div>Status</div>
                  <div className="text-right">Ações</div>
                </div>
                <ScrollArea className="h-[400px]">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div 
                      key={item} 
                      className="grid grid-cols-7 items-center p-3 text-sm border-t"
                    >
                      <div className="col-span-2 font-medium">Ana Carolina Mendes</div>
                      <div>Faculdade Exemplo</div>
                      <div>Pós-Graduação</div>
                      <div>10/04/2025</div>
                      <div>
                        <Badge variant="success">Emitido</Badge>
                      </div>
                      <div className="text-right space-x-1">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Baixar</span>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Printer className="h-4 w-4" />
                          <span className="sr-only">Imprimir</span>
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
      {/* Modal de Detalhes da Solicitação */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Solicitação de Certificação</DialogTitle>
            <DialogDescription>
              Analise a documentação e aprove ou rejeite a solicitação
            </DialogDescription>
          </DialogHeader>
          
          {selectedSolicitacao && (
            <>
              <div className="grid grid-cols-2 gap-6">
                {/* Seção Dados do Aluno */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      Dados do Aluno
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Nome Completo</Label>
                        <p className="font-medium">{mockSolicitacao.aluno.nome}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">CPF</Label>
                        <p>{mockSolicitacao.aluno.cpf}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">E-mail</Label>
                        <p>{mockSolicitacao.aluno.email}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Telefone</Label>
                        <p>{mockSolicitacao.aluno.telefone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Seção Dados do Curso */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <BookOpen className="mr-2 h-5 w-5" />
                      Dados do Curso
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Curso</Label>
                        <p className="font-medium">{mockSolicitacao.curso.nome}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Categoria</Label>
                        <p>{mockSolicitacao.curso.categoria}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Carga Horária Total</Label>
                        <p>{mockSolicitacao.curso.cargaHoraria} horas</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Instituição</Label>
                        <p>{mockSolicitacao.instituicao.nome}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Seção Documentos */}
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <File className="mr-2 h-5 w-5" />
                    Documentos
                  </CardTitle>
                  <CardDescription>
                    Valide cada documento para aprovar a solicitação
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockSolicitacao.documentos.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.nome}</p>
                            <p className="text-xs text-muted-foreground">{doc.tipo}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </Button>
                          <div className="flex items-center space-x-2">
                            <RadioGroup 
                              value={validacaoDocumentos[doc.id] ? "valid" : "invalid"}
                              onValueChange={(value) => handleDocumentoValidacaoChange(doc.id, value === "valid")}
                              className="flex space-x-2"
                            >
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="valid" id={`valid-${doc.id}`} />
                                <Label htmlFor={`valid-${doc.id}`} className="text-green-600 flex items-center">
                                  <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                                  Válido
                                </Label>
                              </div>
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="invalid" id={`invalid-${doc.id}`} />
                                <Label htmlFor={`invalid-${doc.id}`} className="text-red-600 flex items-center">
                                  <ThumbsDown className="h-3.5 w-3.5 mr-1" />
                                  Inválido
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Seção de Pagamento */}
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <CircleDollarSign className="mr-2 h-5 w-5" />
                    Informações de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Valor da Certificação</Label>
                      <p className="font-medium text-lg">R$ {mockSolicitacao.valorCertificacao.toFixed(2)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Status do Pagamento</Label>
                      <Badge 
                        variant={
                          mockSolicitacao.statusPagamento === 'pago' ? 'success' : 
                          mockSolicitacao.statusPagamento === 'pendente' ? 'pending' : 'error'
                        }
                        className="mt-1"
                      >
                        {mockSolicitacao.statusPagamento === 'pago' ? 'Pago' : 
                          mockSolicitacao.statusPagamento === 'pendente' ? 'Pendente' : 'Atrasado'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Observações */}
              <div className="mt-4">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea 
                  id="observacoes" 
                  placeholder="Adicione observações sobre esta solicitação" 
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="h-24 mt-1"
                />
              </div>
              
              <DialogFooter className="mt-6 flex justify-between">
                <Button 
                  variant="destructive" 
                  onClick={handleRejeitarSolicitacao}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar Solicitação
                </Button>
                <div className="space-x-2">
                  <Button variant="outline" onClick={handleCloseDetails}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleAprovarSolicitacao}
                    disabled={Object.values(validacaoDocumentos).some(v => !v)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar Solicitação
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de Confirmação */}
      <Dialog open={confirmacaoDialogAberta} onOpenChange={setConfirmacaoDialogAberta}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {acaoConfirmacao === 'aprovar' ? 'Confirmar Aprovação' : 'Confirmar Rejeição'}
            </DialogTitle>
            <DialogDescription>
              {acaoConfirmacao === 'aprovar' 
                ? 'Você está prestes a aprovar esta solicitação de certificação. Esta ação não poderá ser desfeita.'
                : 'Você está prestes a rejeitar esta solicitação de certificação. Esta ação não poderá ser desfeita.'}
            </DialogDescription>
          </DialogHeader>
          
          {acaoConfirmacao === 'rejeitar' && (
            <div className="my-4">
              <Label htmlFor="motivo-rejeicao" className="text-destructive font-medium">
                Motivo da rejeição <span className="text-destructive">*</span>
              </Label>
              <Textarea 
                id="motivo-rejeicao" 
                placeholder="Informe o motivo da rejeição da solicitação"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-1"
              />
              {!rejectionReason && (
                <p className="text-xs text-destructive mt-1 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  O motivo da rejeição é obrigatório
                </p>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmacaoDialogAberta(false)}>
              Cancelar
            </Button>
            <Button 
              variant={acaoConfirmacao === 'aprovar' ? 'default' : 'destructive'}
              onClick={handleConfirmarAcao}
              disabled={acaoConfirmacao === 'rejeitar' && !rejectionReason}
            >
              {acaoConfirmacao === 'aprovar' ? 'Aprovar' : 'Rejeitar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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