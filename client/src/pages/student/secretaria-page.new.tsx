import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import StudentLayout from "@/components/layout/student-layout";
import {
  ChartIcon,
  SchoolIcon,
  MenuBookIcon,
  EventNoteIcon,
  DescriptionIcon,
  PaymentsIcon,
  HelpOutlineIcon,
  UploadIcon,
  LayersIcon,
  FileTextIcon,
  SearchIcon,
  ClockIcon,
} from "@/components/ui/icons";
import { 
  Download as DownloadIcon, 
  User as UserIcon, 
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  Upload as UploadCloudIcon,
  FileText as FileTextIcon2,
  AlertCircle as AlertCircleIcon,
  Info,
  Loader2,
  Trash2
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// Definição das interfaces
interface RequestType {
  id: string;
  name: string;
  category: string;
  description: string;
  deadline: number; // em dias
  price: number | null;
  required_documents: string[];
}

interface UserRequest {
  id: number;
  requestTypeId: string;
  status: "pending" | "processing" | "completed" | "rejected";
  createdAt: string;
  updatedAt: string | null;
  completedAt: string | null;
  documents: UserDocument[];
  comments: string | null;
  requestTypeName: string;
}

interface UserDocument {
  id: number;
  name: string;
  url: string;
  uploadedAt: string;
}

// Interface para documentos acadêmicos
type DocumentStatus = "pending" | "approved" | "rejected";

interface AcademicDocument {
  id: string;
  name: string;
  description: string;
  required: boolean;
  status: DocumentStatus;
  fileUrl?: string;
  uploadedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

// Esquemas de validação
const documentUploadSchema = z.object({
  files: z.instanceof(FileList).refine(files => files.length > 0, {
    message: "Pelo menos um arquivo deve ser enviado.",
  }),
});

const newRequestSchema = z.object({
  requestTypeId: z.string().min(1, "Selecione um tipo de solicitação"),
  comments: z.string().optional(),
});

export default function SecretariaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("requests");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Lista de documentos acadêmicos requeridos
  const requiredDocuments: AcademicDocument[] = [
    {
      id: "certificado_ensino_medio",
      name: "Certificado Ensino Médio",
      description: "Certificado de conclusão do ensino médio emitido pela instituição de ensino.",
      required: true,
      status: "approved",
      fileUrl: "#",
      uploadedAt: "2023-02-15T10:30:00",
      reviewedAt: "2023-02-20T14:20:00"
    },
    {
      id: "diploma_ensino_medio",
      name: "Diploma Ensino Médio",
      description: "Diploma oficial que comprova a conclusão do ensino médio.",
      required: true,
      status: "approved",
      fileUrl: "#",
      uploadedAt: "2023-02-15T10:35:00",
      reviewedAt: "2023-02-20T14:25:00"
    },
    {
      id: "historico_graduacao",
      name: "Histórico Graduação",
      description: "Histórico escolar de graduação anterior, se aplicável.",
      required: false,
      status: "pending",
      fileUrl: "#",
      uploadedAt: "2023-03-10T09:15:00"
    },
    {
      id: "diploma_graduacao",
      name: "Diploma Graduação",
      description: "Diploma de curso de graduação anterior, se aplicável.",
      required: false,
      status: "pending",
      fileUrl: "#",
      uploadedAt: "2023-03-10T09:20:00"
    },
    {
      id: "rg",
      name: "RG",
      description: "Documento de identidade (frente e verso).",
      required: true,
      status: "rejected",
      fileUrl: "#",
      uploadedAt: "2023-02-10T14:30:00",
      reviewedAt: "2023-02-20T14:30:00",
      rejectionReason: "Documento ilegível. Por favor, envie uma cópia mais nítida."
    },
    {
      id: "cpf",
      name: "CPF",
      description: "Cadastro de Pessoa Física.",
      required: true,
      status: "approved",
      fileUrl: "#",
      uploadedAt: "2023-02-15T10:40:00",
      reviewedAt: "2023-02-20T14:35:00"
    },
    {
      id: "comprovante_endereco",
      name: "Comprovante de Endereço",
      description: "Comprovante de residência recente (últimos 3 meses).",
      required: true,
      status: "pending",
      fileUrl: "#",
      uploadedAt: "2023-03-15T11:20:00"
    },
    {
      id: "certidao_reservista",
      name: "Certidão de Reservista",
      description: "Certificado de dispensa de incorporação (apenas para homens).",
      required: true,
      status: "pending",
      fileUrl: "#",
      uploadedAt: "2023-03-15T11:25:00"
    }
  ];

  // Simular tipos de solicitações disponíveis
  const requestTypes: RequestType[] = [
    {
      id: "transcript",
      name: "Histórico Escolar",
      category: "documentos",
      description: "Solicite seu histórico escolar completo com todas as disciplinas cursadas.",
      deadline: 5,
      price: 25.90,
      required_documents: ["Documento de identidade"],
    },
    {
      id: "certificate",
      name: "Certificado de Conclusão",
      category: "documentos",
      description: "Obtenha seu certificado de conclusão de curso.",
      deadline: 15,
      price: 49.90,
      required_documents: ["Documento de identidade", "Comprovante de quitação de débitos"],
    },
    {
      id: "enrollment",
      name: "Comprovante de Matrícula",
      category: "documentos",
      description: "Documento que comprova sua matrícula atual na instituição.",
      deadline: 2,
      price: null,
      required_documents: [],
    },
    {
      id: "course_change",
      name: "Transferência de Curso",
      category: "acadêmico",
      description: "Solicite transferência para outro curso dentro da instituição.",
      deadline: 30,
      price: 75.00,
      required_documents: ["Justificativa", "Histórico atual", "Formulário de transferência"],
    },
    {
      id: "review_request",
      name: "Revisão de Prova",
      category: "acadêmico",
      description: "Solicite a revisão de uma avaliação específica.",
      deadline: 10,
      price: null,
      required_documents: ["Comprovante da avaliação", "Justificativa detalhada"],
    },
    {
      id: "academic_calendar",
      name: "Calendário Acadêmico",
      category: "documentos",
      description: "Acesse o calendário acadêmico oficial do semestre atual.",
      deadline: 1,
      price: null,
      required_documents: [],
    },
    {
      id: "cancellation",
      name: "Cancelamento de Matrícula",
      category: "acadêmico",
      description: "Solicite o cancelamento da sua matrícula na instituição.",
      deadline: 20,
      price: 35.00,
      required_documents: ["Justificativa", "Formulário de cancelamento", "Comprovante de quitação de débitos"],
    },
  ];

  // Simular solicitações do usuário
  const mockUserRequests: UserRequest[] = [
    {
      id: 1,
      requestTypeId: "transcript",
      status: "completed",
      createdAt: "2023-03-10T10:30:00",
      updatedAt: "2023-03-12T14:20:00",
      completedAt: "2023-03-15T09:45:00",
      documents: [
        {
          id: 101,
          name: "RG.pdf",
          url: "#",
          uploadedAt: "2023-03-10T10:35:00",
        }
      ],
      comments: "Preciso do histórico para inscrição em pós-graduação.",
      requestTypeName: "Histórico Escolar",
    },
    {
      id: 2,
      requestTypeId: "review_request",
      status: "rejected",
      createdAt: "2023-04-05T16:20:00",
      updatedAt: "2023-04-07T11:10:00",
      completedAt: "2023-04-07T11:10:00",
      documents: [
        {
          id: 102,
          name: "Prova_Matemática.pdf",
          url: "#",
          uploadedAt: "2023-04-05T16:25:00",
        },
        {
          id: 103,
          name: "Justificativa.pdf",
          url: "#",
          uploadedAt: "2023-04-05T16:28:00",
        }
      ],
      comments: "Creio que houve erro na correção da questão 5.",
      requestTypeName: "Revisão de Prova",
    },
    {
      id: 3,
      requestTypeId: "enrollment",
      status: "pending",
      createdAt: "2023-05-20T09:15:00",
      updatedAt: null,
      completedAt: null,
      documents: [],
      comments: "Preciso do comprovante para estágio.",
      requestTypeName: "Comprovante de Matrícula",
    },
    {
      id: 4,
      requestTypeId: "certificate",
      status: "processing",
      createdAt: "2023-06-01T14:30:00",
      updatedAt: "2023-06-02T10:20:00",
      completedAt: null,
      documents: [
        {
          id: 104,
          name: "RG_Frente_Verso.pdf",
          url: "#",
          uploadedAt: "2023-06-01T14:40:00",
        },
        {
          id: 105,
          name: "Comprovante_Quitacao.pdf",
          url: "#",
          uploadedAt: "2023-06-01T14:45:00",
        }
      ],
      comments: null,
      requestTypeName: "Certificado de Conclusão",
    }
  ];

  // Form para upload de documentos
  const documentForm = useForm<z.infer<typeof documentUploadSchema>>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {},
  });

  // Form para nova solicitação
  const newRequestForm = useForm<z.infer<typeof newRequestSchema>>({
    resolver: zodResolver(newRequestSchema),
    defaultValues: {
      requestTypeId: "",
      comments: "",
    },
  });

  // Funções de gerenciamento
  const handleDocumentUpload = (data: z.infer<typeof documentUploadSchema>) => {
    // Simular upload
    toast({
      title: "Documentos enviados",
      description: `${data.files.length} arquivos enviados com sucesso.`,
    });
    documentForm.reset();
  };

  const handleNewRequest = (data: z.infer<typeof newRequestSchema>) => {
    // Simular criação de nova solicitação
    const requestType = requestTypes.find(type => type.id === data.requestTypeId);
    
    if (requestType) {
      toast({
        title: "Solicitação criada",
        description: `Sua solicitação de ${requestType.name} foi enviada com sucesso.`,
      });
      setIsDialogOpen(false);
      newRequestForm.reset();
    }
  };

  // Função para upload de documentos acadêmicos
  const handleAcademicDocumentUpload = (documentId: string) => {
    if (!fileInputRef.current?.files?.length) {
      toast({
        title: "Erro no upload",
        description: "Por favor, selecione um arquivo para enviar.",
        variant: "destructive",
      });
      return;
    }

    const file = fileInputRef.current.files[0];
    setIsUploading(documentId);
    setUploadProgress(0);

    // Simular progresso de upload
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          
          // Atualizar o status do documento para "pending" (em análise)
          // Numa aplicação real, isso seria feito via API
          setTimeout(() => {
            setIsUploading(null);
            toast({
              title: "Documento enviado",
              description: "Seu documento foi enviado e está em análise pela secretaria.",
            });
          }, 500);
          
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  // Função para reenviar documento rejeitado
  const handleResendRejectedDocument = (documentId: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
      setSelectedDocumentType(documentId);
    }
  };

  // Função para tratar o upload quando o arquivo é selecionado
  const handleFileSelected = () => {
    if (selectedDocumentType && fileInputRef.current?.files?.length) {
      handleAcademicDocumentUpload(selectedDocumentType);
      setSelectedDocumentType(null);
    }
  };

  // Filtragem de solicitações
  const filteredRequests = mockUserRequests.filter(request => {
    // Filtro de busca
    const searchMatch = 
      request.requestTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.comments?.toLowerCase().includes(searchTerm.toLowerCase());
      
    // Filtro de status
    const statusMatch = filterStatus === "all" || request.status === filterStatus;
    
    return searchMatch && statusMatch;
  });

  // Determinar cor do badge de status
  const getStatusBadgeVariant = (status: UserRequest["status"]) => {
    switch (status) {
      case "pending":
        return "default";
      case "processing":
        return "secondary";
      case "completed":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Formatar status para exibição
  const formatStatus = (status: UserRequest["status"]) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "processing":
        return "Em Processamento";
      case "completed":
        return "Concluído";
      case "rejected":
        return "Rejeitado";
      default:
        return "Desconhecido";
    }
  };

  // Formatador de data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <StudentLayout
      title="Secretaria Acadêmica"
      subtitle="Faça solicitações e acompanhe o status dos seus pedidos"
      breadcrumbs={[
        { title: "Home", href: "/student" },
        { title: "Secretaria", href: "/student/secretaria" }
      ]}
      action={
        <Button onClick={() => setIsDialogOpen(true)}>
          Nova Solicitação
        </Button>
      }
    >
      {/* Tabs */}
      <Tabs defaultValue="requests" className="mb-6" onValueChange={(value) => setActiveTab(value)}>
        <TabsList>
          <TabsTrigger value="requests">Minhas Solicitações</TabsTrigger>
          <TabsTrigger value="services">Serviços Disponíveis</TabsTrigger>
          <TabsTrigger value="documents">Documentos Acadêmicos</TabsTrigger>
          <TabsTrigger value="info">Informações e Prazos</TabsTrigger>
        </TabsList>

        {/* Tab - Minhas Solicitações */}
        <TabsContent value="requests">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="Buscar solicitações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:w-1/3"
            />
            <Select
              value={filterStatus}
              onValueChange={(value) => setFilterStatus(value)}
            >
              <SelectTrigger className="md:w-1/4">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="processing">Em Processamento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredRequests.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Nenhuma solicitação encontrada</CardTitle>
                <CardDescription>
                  Você não possui solicitações com os filtros selecionados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  Para criar uma nova solicitação, clique no botão "Nova Solicitação" acima.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRequests.map((request) => (
                <Card key={request.id} className="overflow-hidden">
                  <div className={`h-1 ${
                    request.status === 'completed' 
                      ? 'bg-green-500' 
                      : request.status === 'processing' 
                        ? 'bg-blue-500' 
                        : request.status === 'rejected'
                          ? 'bg-red-500'
                          : 'bg-amber-500'
                  }`} />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{request.requestTypeName}</CardTitle>
                      <Badge variant={getStatusBadgeVariant(request.status)}>
                        {formatStatus(request.status)}
                      </Badge>
                    </div>
                    <CardDescription>
                      Solicitado em {formatDate(request.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    {request.comments && (
                      <div className="mb-3 text-sm text-gray-600">
                        <span className="font-medium">Comentário:</span> {request.comments}
                      </div>
                    )}
                    
                    {request.documents.length > 0 && (
                      <div className="mb-3">
                        <p className="font-medium text-sm mb-1">Documentos enviados:</p>
                        <div className="flex flex-wrap gap-2">
                          {request.documents.map((doc) => (
                            <Button key={doc.id} variant="outline" size="sm" className="text-xs h-7 px-2 py-0">
                              <FileTextIcon2 className="h-3 w-3 mr-1" />
                              {doc.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {request.status === 'processing' && (
                      <div className="text-sm text-blue-600 flex items-center">
                        <Info className="h-4 w-4 mr-1" />
                        Sua solicitação está sendo processada pela secretaria acadêmica
                      </div>
                    )}
                    
                    {request.status === 'rejected' && (
                      <div className="text-sm text-red-600 flex items-center">
                        <AlertCircleIcon className="h-4 w-4 mr-1" />
                        Sua solicitação foi rejeitada. Por favor, entre em contato com a secretaria.
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="bg-gray-50 pt-3">
                    {request.status === 'completed' ? (
                      <Button variant="outline" className="w-full">
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Baixar Documento
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setSelectedRequest(request)}
                      >
                        Ver Detalhes
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab - Serviços Disponíveis */}
        <TabsContent value="services">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requestTypes.map((requestType) => (
              <Card key={requestType.id} className="overflow-hidden">
                <div className={`h-1 ${
                  requestType.category === 'documentos' ? 'bg-blue-500' : 'bg-green-500'
                }`} />
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{requestType.name}</CardTitle>
                  <CardDescription>
                    {requestType.category === 'documentos' ? 'Documento' : 'Serviço Acadêmico'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-sm text-gray-600 mb-3">
                    {requestType.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1 text-gray-500" />
                      <span>Prazo: {requestType.deadline} {requestType.deadline === 1 ? 'dia' : 'dias'}</span>
                    </div>
                    
                    {requestType.price !== null && (
                      <div className="flex items-center">
                        <PaymentsIcon className="h-4 w-4 mr-1 text-gray-500" />
                        <span>Valor: R$ {requestType.price.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  
                  {requestType.required_documents.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-700 mb-1">Documentos necessários:</p>
                      <ul className="text-xs text-gray-600 list-disc list-inside">
                        {requestType.required_documents.map((doc, index) => (
                          <li key={index}>{doc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-gray-50 pt-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      newRequestForm.setValue("requestTypeId", requestType.id);
                      setIsDialogOpen(true);
                    }}
                  >
                    Solicitar
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab - Documentos Acadêmicos */}
        <TabsContent value="documents">
          <div className="overflow-hidden rounded-lg border">
            <div className="bg-gray-50 p-4 flex justify-between items-center border-b">
              <div>
                <h3 className="text-lg font-medium">Documentos Acadêmicos</h3>
                <p className="text-sm text-gray-500">Gerencie seus documentos acadêmicos</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelected}
              />
            </div>
            
            <div className="divide-y">
              {requiredDocuments.map((document) => (
                <div key={document.id} className="p-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start">
                      <div>
                        <h4 className="font-medium flex items-center">
                          {document.name}
                          {document.required && (
                            <span className="ml-2 text-xs text-red-500 font-normal">
                              Obrigatório
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {document.description}
                        </p>
                        
                        <div className="flex items-center mt-2 text-sm">
                          {document.status === 'approved' ? (
                            <div className="flex items-center text-green-600">
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              <span>Aprovado</span>
                              {document.reviewedAt && (
                                <span className="text-gray-500 ml-2">
                                  em {formatDate(document.reviewedAt)}
                                </span>
                              )}
                            </div>
                          ) : document.status === 'rejected' ? (
                            <div className="flex items-center text-red-600">
                              <XCircleIcon className="h-4 w-4 mr-1" />
                              <span>Rejeitado</span>
                              {document.rejectionReason && (
                                <span className="ml-2">- {document.rejectionReason}</span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center text-amber-600">
                              <ClockIcon className="h-4 w-4 mr-1" />
                              <span>Em análise</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-2 md:mt-0">
                    {document.fileUrl && (
                      <Button variant="outline" size="sm">
                        <DownloadIcon className="h-3.5 w-3.5 mr-1.5" />
                        Ver Documento
                      </Button>
                    )}
                    
                    {document.status === "rejected" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendRejectedDocument(document.id)}
                        disabled={isUploading === document.id}
                      >
                        {isUploading === document.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            Enviando... {uploadProgress}%
                          </>
                        ) : (
                          <>
                            <UploadCloudIcon className="h-3.5 w-3.5 mr-1.5" />
                            Reenviar
                          </>
                        )}
                      </Button>
                    )}
                    
                    {document.status === "pending" && document.fileUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Remover
                      </Button>
                    )}
                    
                    {(!document.fileUrl || (!document.status || document.status === "pending")) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading === document.id}
                      >
                        {isUploading === document.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            Enviando... {uploadProgress}%
                          </>
                        ) : (
                          <>
                            <UploadCloudIcon className="h-3.5 w-3.5 mr-1.5" />
                            Enviar Documento
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Tab - Informações e Prazos */}
        <TabsContent value="info">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Importantes</CardTitle>
                <CardDescription>
                  Diretrizes e procedimentos da secretaria acadêmica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">Horário de Atendimento</h4>
                  <p className="text-sm">
                    Segunda a sexta-feira, das 8h às 17h, exceto feriados.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Documentos Oficiais</h4>
                  <p className="text-sm">
                    Todos os documentos oficiais possuem autenticação digital que pode ser verificada no site da instituição.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Pagamentos</h4>
                  <p className="text-sm">
                    Serviços que possuem valor associado devem ser pagos através do sistema financeiro antes de serem processados.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Contato</h4>
                  <p className="text-sm">
                    Em caso de dúvidas, entre em contato pelo e-mail: secretaria@edunexia.com.br<br />
                    Telefone: (11) 3333-4444
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Prazos e Processos</CardTitle>
                <CardDescription>
                  Entenda os prazos e processos relacionados às solicitações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">Tempo de Processamento</h4>
                  <p className="text-sm">
                    Os prazos para cada tipo de solicitação são contados em dias úteis e começam a partir do momento em que todos os requisitos são atendidos.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Documentos Pendentes</h4>
                  <p className="text-sm">
                    Se houver documentos pendentes ou informações faltantes, o prazo será pausado até que as pendências sejam resolvidas.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Situações Especiais</h4>
                  <p className="text-sm">
                    Durante períodos de alta demanda (como final de semestre), os prazos podem ser estendidos. Você será notificado caso isso ocorra.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Cancelamento de Solicitações</h4>
                  <p className="text-sm">
                    Solicitações podem ser canceladas enquanto estiverem no status "Pendente". Após iniciado o processamento, não é possível realizar o cancelamento.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog para nova solicitação */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Solicitação</DialogTitle>
            <DialogDescription>
              Preencha as informações abaixo para submeter uma nova solicitação à secretaria.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...newRequestForm}>
            <form onSubmit={newRequestForm.handleSubmit(handleNewRequest)} className="space-y-6">
              <FormField
                control={newRequestForm.control}
                name="requestTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Solicitação</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de solicitação" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {requestTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name} {type.price ? `(R$ ${type.price.toFixed(2)})` : '(Gratuito)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Escolha o tipo de serviço ou documento que você deseja solicitar.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newRequestForm.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comentários (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Adicione informações ou detalhes relevantes para sua solicitação"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Adicione quaisquer detalhes que possam ser úteis para o processamento da sua solicitação.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Enviar Solicitação</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de detalhes da solicitação */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes da Solicitação</DialogTitle>
              <DialogDescription>
                {selectedRequest.requestTypeName} - {formatStatus(selectedRequest.status)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Informações</h4>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Número da Solicitação:</span>
                    <span className="text-sm font-medium">{selectedRequest.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Data da Solicitação:</span>
                    <span className="text-sm font-medium">{formatDate(selectedRequest.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Última Atualização:</span>
                    <span className="text-sm font-medium">
                      {selectedRequest.updatedAt ? formatDate(selectedRequest.updatedAt) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Concluído em:</span>
                    <span className="text-sm font-medium">
                      {selectedRequest.completedAt ? formatDate(selectedRequest.completedAt) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Status:</span>
                    <Badge variant={getStatusBadgeVariant(selectedRequest.status)}>
                      {formatStatus(selectedRequest.status)}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {selectedRequest.comments && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Comentários</h4>
                  <p className="mt-2 text-sm p-3 bg-gray-50 rounded-md">
                    {selectedRequest.comments}
                  </p>
                </div>
              )}
              
              {selectedRequest.documents.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Documentos Enviados</h4>
                  <div className="mt-2 space-y-2">
                    {selectedRequest.documents.map((doc) => (
                      <div key={doc.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                        <div className="flex items-center">
                          <FileTextIcon2 className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm">{doc.name}</span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <DownloadIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedRequest.status === 'pending' && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-amber-800">Solicitação em Análise</h5>
                      <p className="text-sm text-amber-700">
                        Sua solicitação está sendo analisada pela secretaria. Você receberá uma notificação quando houver atualização.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedRequest.status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex items-start">
                    <AlertCircleIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-red-800">Solicitação Rejeitada</h5>
                      <p className="text-sm text-red-700">
                        Sua solicitação foi rejeitada. Por favor, entre em contato com a secretaria para mais informações.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              {selectedRequest.status === 'completed' ? (
                <Button>
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Baixar Documento
                </Button>
              ) : (
                <Button type="button" onClick={() => setSelectedRequest(null)}>Fechar</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </StudentLayout>
  );
}