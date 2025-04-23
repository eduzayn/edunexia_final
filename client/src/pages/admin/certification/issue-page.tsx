import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AwardIcon, 
  BadgeCheckIcon, 
  FileCheckIcon, 
  SearchIcon, 
  InfoIcon, 
  DownloadIcon, 
  PrinterIcon, 
  MailIcon,
  EyeIcon,
  CheckIcon,
  AlertTriangleIcon,
  FilterIcon,
  PlusIcon,
  TrashIcon,
  LoaderIcon
} from "@/components/ui/icons";

// Página de emissão de certificados
export default function CertificationIssuePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedTab, setSelectedTab] = React.useState("eligible");
  const [selectedStudents, setSelectedStudents] = React.useState<number[]>([]);
  const [openPreviewDialog, setOpenPreviewDialog] = React.useState(false);
  const [selectedCertificate, setSelectedCertificate] = React.useState<any>(null);
  const [issuingCertificates, setIssuingCertificates] = React.useState(false);
  
  // Consultas para buscar dados do backend
  const { 
    data: eligibleStudentsData, 
    isLoading: loadingEligible,
    error: eligibleError 
  } = useQuery({
    queryKey: ['api/eligibleStudents'],
    queryFn: async () => {
      // Em um ambiente real, buscaríamos esta lista da API
      // Exemplo: const response = await fetch('/api/enrollments/completed');
      
      // Por enquanto, usamos dados simulados
      return [
        {
          id: 1,
          name: "Ana Clara Silva",
          cpf: "123.456.789-00",
          email: "ana.silva@exemplo.com",
          course: "MBA em Gestão de Projetos",
          courseType: "Pós-Graduação",
          completionDate: "15/03/2025",
          requiredHours: 360,
          completedHours: 360,
          status: "eligible"
        },
        {
          id: 2,
          name: "Bruno Costa Oliveira",
          cpf: "987.654.321-00",
          email: "bruno.costa@exemplo.com",
          course: "Especialização em Marketing Digital",
          courseType: "Pós-Graduação",
          completionDate: "10/03/2025",
          requiredHours: 360,
          completedHours: 360,
          status: "eligible"
        },
        {
          id: 3,
          name: "Carlos Eduardo Mendes",
          cpf: "456.789.123-00",
          email: "carlos.mendes@exemplo.com",
          course: "Desenvolvimento Full Stack",
          courseType: "Formação Livre",
          completionDate: "05/03/2025",
          requiredHours: 120,
          completedHours: 120,
          status: "eligible"
        }
      ];
    },
  });

  const { 
    data: certificatesData, 
    isLoading: loadingCertificates,
    error: certificatesError,
    refetch: refetchCertificates
  } = useQuery({
    queryKey: ['api/certificates'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/certificates?status=issued');
        if (!response.ok) {
          throw new Error('Erro ao buscar certificados');
        }
        
        const data = await response.json();
        return data.data.map((cert: any) => ({
          id: cert.certificates.id,
          studentName: cert.studentName,
          course: cert.courseName,
          courseType: cert.certificates.courseType,
          issueDate: new Date(cert.issueDate).toLocaleDateString('pt-BR'),
          certificateCode: cert.certificates.code,
          status: cert.status,
        }));
      } catch (error) {
        console.error('Erro ao buscar certificados:', error);
        throw error;
      }
    },
  });

  const { 
    data: templatesData, 
    isLoading: loadingTemplates 
  } = useQuery({
    queryKey: ['api/certificateTemplates'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/certificate-templates');
        if (!response.ok) {
          return [{ id: 1, name: "Modelo Padrão" }];
        }
        const data = await response.json();
        return data;
      } catch (error) {
        // Fallback para um template padrão em caso de erro
        return [{ id: 1, name: "Modelo Padrão" }];
      }
    },
  });
  
  // Função para alternar seleção de aluno
  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudents(prevSelected => 
      prevSelected.includes(studentId)
        ? prevSelected.filter(id => id !== studentId)
        : [...prevSelected, studentId]
    );
  };
  
  // Função para selecionar todos os alunos
  const toggleSelectAll = () => {
    if (!eligibleStudentsData) return;
    
    setSelectedStudents(
      selectedStudents.length === eligibleStudentsData.length
        ? []
        : eligibleStudentsData.map(student => student.id)
    );
  };
  
  // Usar os dados reais da API ou fallbacks
  const eligibleStudents = eligibleStudentsData || [];
  const issuedCertificates = certificatesData || [];
  const certificateTemplates = templatesData || [{ id: 1, name: "Modelo Padrão" }];
  
  // Signatários disponíveis para assinatura do certificado
  const availableSigners = [
    { id: 1, name: "Ana Lúcia", role: "Diretora Acadêmica" },
    { id: 2, name: "Carlos Alberto", role: "Coordenador de Pós-Graduação" }
  ];
  
  // Função para verificar se todos estão selecionados
  const areAllSelected = selectedStudents.length === eligibleStudents.length && eligibleStudents.length > 0;
  
  // Função para recarregar dados quando a aba muda
  React.useEffect(() => {
    if (selectedTab === "issued") {
      refetchCertificates();
    }
  }, [selectedTab, refetchCertificates]);
  
  // Função para filtrar alunos com base no termo de busca
  const filteredEligibleStudents = eligibleStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.cpf.includes(searchTerm) ||
    student.course.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Função para filtrar certificados com base no termo de busca
  const filteredIssuedCertificates = issuedCertificates.filter((cert: any) =>
    cert.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cert.cpf && cert.cpf.includes(searchTerm)) ||
    cert.course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.certificateCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Mock da função para visualizar certificado
  const handlePreviewCertificate = (studentId: number) => {
    const student = eligibleStudents.find(s => s.id === studentId);
    if (student) {
      setSelectedCertificate({
        student,
        previewUrl: "#"
      });
      setOpenPreviewDialog(true);
    }
  };
  
  // Função para emitir certificados em lote
  const handleIssueCertificates = async () => {
    if (selectedStudents.length === 0) {
      toast({
        title: "Nenhum aluno selecionado",
        description: "Selecione pelo menos um aluno para emitir certificados.",
        variant: "destructive"
      });
      return;
    }
    
    // Por padrão, usamos o primeiro template disponível
    const defaultTemplateId = certificateTemplates.length > 0 ? certificateTemplates[0].id : 1;
    
    setIssuingCertificates(true);
    
    try {
      // Chamada à API para emitir certificados em lote
      const response = await fetch('/api/certificates/batch-issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentIds: selectedStudents,
          templateId: defaultTemplateId,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Certificados emitidos com sucesso",
          description: data.message || `${selectedStudents.length} certificado(s) emitido(s) com sucesso.`,
        });
        
        // Limpar a seleção de alunos
        setSelectedStudents([]);
        
        // Se estamos na aba de alunos elegíveis, mudar para a aba de certificados emitidos
        // para mostrar imediatamente os certificados que foram gerados
        if (selectedTab === "eligible") {
          setSelectedTab("issued");
          
          // Invalidar o cache para forçar uma nova busca de certificados
          queryClient.invalidateQueries({ queryKey: ['api/certificates'] });
          
          // Refetch para garantir que temos os dados mais recentes
          await refetchCertificates();
        }
      } else {
        toast({
          title: "Erro ao emitir certificados",
          description: data.message || "Ocorreu um erro ao emitir os certificados.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao emitir certificados:", error);
      toast({
        title: "Erro ao emitir certificados",
        description: "Ocorreu um erro de conexão ao tentar emitir os certificados.",
        variant: "destructive"
      });
    } finally {
      setIssuingCertificates(false);
    }
  };
  
  // Função para visualizar o certificado em PDF
  const handleViewCertificate = (certificateId: number) => {
    // Abre uma nova janela com o PDF do certificado
    window.open(`/api/certificates/${certificateId}/pdf`, '_blank');
  };
  
  // Função para visualizar o histórico escolar em PDF
  const handleViewTranscript = (certificateId: number) => {
    // Abre uma nova janela com o PDF do histórico escolar
    window.open(`/api/certificates/${certificateId}/transcript`, '_blank');
  };
  
  // Função para baixar certificado
  const handleDownloadCertificate = (certificateId: number) => {
    // Inicia o download do PDF
    window.open(`/api/certificates/${certificateId}/pdf/download`, '_blank');
    
    toast({
      title: "Download iniciado",
      description: "Certificado sendo baixado.",
    });
  };
  
  // Função para baixar histórico escolar
  const handleDownloadTranscript = (certificateId: number) => {
    // Inicia o download do PDF do histórico escolar
    window.open(`/api/certificates/${certificateId}/transcript/download`, '_blank');
    
    toast({
      title: "Download iniciado",
      description: "Histórico escolar sendo baixado.",
    });
  };
  
  // Função para imprimir certificado (abre a visualização para impressão)
  const handlePrintCertificate = (certificateId: number) => {
    // Abre o PDF em uma nova janela pronta para impressão
    const printWindow = window.open(`/api/certificates/${certificateId}/pdf`, '_blank');
    printWindow?.addEventListener('load', () => {
      try {
        // Tenta imprimir automaticamente
        printWindow.print();
      } catch (error) {
        console.error('Erro ao imprimir:', error);
      }
    });
    
    toast({
      title: "Preparando impressão",
      description: "Certificado preparado para impressão.",
    });
  };
  
  // Função para enviar certificado por e-mail
  const handleEmailCertificate = (certificateId: number) => {
    fetch(`/api/certificates/${certificateId}/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    .then(response => {
      if (response.ok) {
        toast({
          title: "E-mail enviado",
          description: "Certificado enviado por e-mail com sucesso.",
        });
      } else {
        throw new Error('Falha ao enviar e-mail');
      }
    })
    .catch(error => {
      toast({
        title: "Erro ao enviar e-mail",
        description: error.message,
        variant: "destructive",
      });
    });
  };
  
  // Função para remover disciplina
  const handleRemoveDiscipline = (disciplineName: string) => {
    toast({
      title: "Disciplina removida",
      description: `A disciplina ${disciplineName} foi removida da lista.`,
    });
  };
  
  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Emissão de Certificados</h1>
            <p className="text-muted-foreground">
              Gerencie e emita certificados para alunos que concluíram seus cursos.
            </p>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex mb-4 gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar por nome, CPF, curso ou código do certificado..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button variant="outline">
              <FilterIcon className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>
        </div>
        
        <Tabs 
          defaultValue="eligible" 
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="mb-6"
        >
          <TabsList>
            <TabsTrigger value="eligible" className="flex items-center">
              <Badge variant="secondary" className="mr-2">{eligibleStudents.length}</Badge>
              Elegíveis para Certificação
            </TabsTrigger>
            <TabsTrigger value="issued" className="flex items-center">
              <Badge variant="secondary" className="mr-2">{issuedCertificates.length}</Badge>
              Certificados Emitidos
            </TabsTrigger>
          </TabsList>
          
          {/* Tab de alunos elegíveis para certificação */}
          <TabsContent value="eligible" className="mt-6">
            {filteredEligibleStudents.length > 0 ? (
              <>
                <div className="mb-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="select-all" 
                      checked={areAllSelected}
                      onCheckedChange={toggleSelectAll}
                    />
                    <Label htmlFor="select-all">Selecionar todos</Label>
                  </div>
                  
                  <Button 
                    onClick={handleIssueCertificates} 
                    disabled={selectedStudents.length === 0 || issuingCertificates}
                  >
                    {issuingCertificates ? (
                      <>Emitindo...</>
                    ) : (
                      <>
                        <BadgeCheckIcon className="mr-2 h-4 w-4" />
                        Emitir Certificados ({selectedStudents.length})
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Curso</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Conclusão</TableHead>
                        <TableHead>C.H.</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEligibleStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Checkbox 
                              checked={selectedStudents.includes(student.id)}
                              onCheckedChange={() => toggleStudentSelection(student.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-sm text-gray-500">CPF: {student.cpf}</div>
                              <div className="text-sm text-gray-500">{student.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{student.course}</TableCell>
                          <TableCell>{student.courseType}</TableCell>
                          <TableCell>{student.completionDate}</TableCell>
                          <TableCell>{student.completedHours}h</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handlePreviewCertificate(student.id)}
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              Pré-visualizar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <Alert className="bg-muted">
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertTitle>Nenhum resultado encontrado</AlertTitle>
                <AlertDescription>
                  Não foram encontrados alunos elegíveis para certificação com os critérios de busca informados.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          {/* Tab de certificados já emitidos */}
          <TabsContent value="issued" className="mt-6">
            {filteredIssuedCertificates.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Emissão</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIssuedCertificates.map((cert) => (
                      <TableRow key={cert.id}>
                        <TableCell className="font-medium">{cert.certificateCode}</TableCell>
                        <TableCell>
                          <div>
                            <div>{cert.studentName}</div>
                            <div className="text-sm text-gray-500">CPF: {cert.cpf}</div>
                          </div>
                        </TableCell>
                        <TableCell>{cert.course}</TableCell>
                        <TableCell>{cert.courseType}</TableCell>
                        <TableCell>{cert.issueDate}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {/* Grupo: Certificado */}
                            <div className="border rounded-md p-1 flex gap-1 mr-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleViewCertificate(cert.id)}
                                title="Visualizar certificado"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDownloadCertificate(cert.id)}
                                title="Baixar certificado"
                              >
                                <DownloadIcon className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handlePrintCertificate(cert.id)}
                                title="Imprimir certificado"
                              >
                                <PrinterIcon className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {/* Grupo: Histórico */}
                            <div className="border rounded-md p-1 flex gap-1 mr-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleViewTranscript(cert.id)}
                                title="Visualizar histórico"
                              >
                                <FileCheckIcon className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDownloadTranscript(cert.id)}
                                title="Baixar histórico"
                              >
                                <DownloadIcon className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {/* E-mail */}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEmailCertificate(cert.id)}
                              title="Enviar por e-mail"
                              className="ml-1"
                            >
                              <MailIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Alert className="bg-muted">
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertTitle>Nenhum resultado encontrado</AlertTitle>
                <AlertDescription>
                  Não foram encontrados certificados emitidos com os critérios de busca informados.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Diálogo de pré-visualização de certificado */}
      <Dialog open={openPreviewDialog} onOpenChange={setOpenPreviewDialog}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Pré-visualização do Certificado</DialogTitle>
            <DialogDescription>
              Configure os detalhes do certificado antes da emissão
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="preview">
            <TabsList className="mb-4">
              <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
              <TabsTrigger value="details">Detalhes do Certificado</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview">
              <div className="bg-gray-100 rounded-md p-4 h-[400px] flex justify-center items-center">
                <div className="text-center">
                  <AwardIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-lg font-medium mb-2">Preview do Certificado</p>
                  <p className="text-sm text-gray-500">
                    Aqui será exibida uma prévia do certificado que será gerado.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="details">
              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Configurações do Certificado</h3>
                    
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="certificate-model">Modelo:</Label>
                        <select 
                          id="certificate-model" 
                          className="w-full p-2 border rounded-md"
                          defaultValue={certificateTemplates[0].id}
                        >
                          {certificateTemplates.map(template => (
                            <option key={template.id} value={template.id}>
                              {template.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="certificate-title">Título:</Label>
                        <select 
                          id="certificate-title" 
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="certificado">Certificado</option>
                          <option value="diploma">Diploma</option>
                        </select>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="certificate-signature">Assinatura:</Label>
                        <select 
                          id="certificate-signature" 
                          className="w-full p-2 border rounded-md"
                          defaultValue={availableSigners[0].id}
                        >
                          {availableSigners.map(signer => (
                            <option key={signer.id} value={signer.id}>
                              {signer.name} - {signer.role}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Dados do Aluno</h3>
                    
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="student-name">Nome do Aluno:</Label>
                        <Input 
                          id="student-name" 
                          defaultValue={selectedCertificate?.student?.name || ""} 
                          readOnly 
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="student-document">Documento (CPF):</Label>
                        <Input 
                          id="student-document" 
                          defaultValue={selectedCertificate?.student?.cpf || ""} 
                          readOnly 
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="student-naturalidade">Naturalidade:</Label>
                        <Input 
                          id="student-naturalidade" 
                          placeholder="Cidade de nascimento" 
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="student-birth-date">Data de Nascimento:</Label>
                        <Input 
                          id="student-birth-date" 
                          type="date" 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <h3 className="text-lg font-medium mb-4">Dados do Curso</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="course-name">Nome do Curso:</Label>
                        <Input 
                          id="course-name" 
                          defaultValue={selectedCertificate?.student?.course || ""} 
                          readOnly 
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="course-area">Área de Conhecimento:</Label>
                        <Input 
                          id="course-area" 
                          placeholder="Ex: Ciências Humanas" 
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="course-start">Início do Período:</Label>
                        <Input 
                          id="course-start" 
                          type="date" 
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="course-end">Fim do Período:</Label>
                        <Input 
                          id="course-end" 
                          type="date" 
                          defaultValue={selectedCertificate?.student?.completionDate || ""}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="course-hours">Total de Horas:</Label>
                        <Input 
                          id="course-hours" 
                          type="number" 
                          defaultValue={selectedCertificate?.student?.completedHours || ""}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label>Disciplinas:</Label>
                        <Button variant="outline" size="sm">
                          <PlusIcon className="w-4 h-4 mr-1" />
                          Adicionar Disciplina
                        </Button>
                      </div>
                      
                      <div className="border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome da Disciplina</TableHead>
                              <TableHead>Corpo Docente</TableHead>
                              <TableHead>Titulação</TableHead>
                              <TableHead>Carga Horária</TableHead>
                              <TableHead>Frequência</TableHead>
                              <TableHead>Aproveitamento</TableHead>
                              <TableHead className="w-16">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">Formação e Ética do Psi</TableCell>
                              <TableCell>Marinês Da Consolação</TableCell>
                              <TableCell>Especialista</TableCell>
                              <TableCell>30h</TableCell>
                              <TableCell>100%</TableCell>
                              <TableCell>Aprovado</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon">
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Narcisismo e a Cultura</TableCell>
                              <TableCell>Adriana Maria Cancella</TableCell>
                              <TableCell>Especialista</TableCell>
                              <TableCell>40h</TableCell>
                              <TableCell>100%</TableCell>
                              <TableCell>Aprovado</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon">
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">O Método Psicanalítico</TableCell>
                              <TableCell>Marcio Antonio Rodrigues</TableCell>
                              <TableCell>Mestre</TableCell>
                              <TableCell>50h</TableCell>
                              <TableCell>100%</TableCell>
                              <TableCell>Aprovado</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon">
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    
                    {/* Formulário para adicionar nova disciplina */}
                    <div className="mt-4 p-4 border rounded-md bg-gray-50">
                      <h4 className="text-sm font-semibold mb-3">Adicionar Nova Disciplina</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="grid gap-2">
                          <Label htmlFor="new-discipline-name">Nome da Disciplina:</Label>
                          <Input id="new-discipline-name" placeholder="Nome da disciplina" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="new-discipline-professor">Corpo Docente:</Label>
                          <Input id="new-discipline-professor" placeholder="Nome do professor" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="new-discipline-title">Titulação:</Label>
                          <select id="new-discipline-title" className="w-full p-2 border rounded-md">
                            <option value="Especialista">Especialista</option>
                            <option value="Mestre">Mestre</option>
                            <option value="Doutor">Doutor</option>
                            <option value="Pós-Doutor">Pós-Doutor</option>
                          </select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="new-discipline-hours">Carga Horária:</Label>
                          <Input id="new-discipline-hours" type="number" min="1" placeholder="Em horas" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="new-discipline-frequency">Frequência:</Label>
                          <Input id="new-discipline-frequency" placeholder="Ex: 100%" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="new-discipline-performance">Aproveitamento:</Label>
                          <select id="new-discipline-performance" className="w-full p-2 border rounded-md">
                            <option value="Aprovado">Aprovado</option>
                            <option value="Reprovado">Reprovado</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <Button size="sm">
                          <PlusIcon className="w-4 h-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="flex justify-between pt-4">
            <div>
              <Button variant="outline" onClick={() => setOpenPreviewDialog(false)}>
                Cancelar
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <PrinterIcon className="mr-2 h-4 w-4" />
                Imprimir Pré-visualização
              </Button>
              <Button onClick={() => {
                setOpenPreviewDialog(false);
                if (selectedCertificate?.student?.id) {
                  setSelectedStudents([selectedCertificate.student.id]);
                  handleIssueCertificates();
                }
              }}>
                <BadgeCheckIcon className="mr-2 h-4 w-4" />
                Emitir Certificado
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}