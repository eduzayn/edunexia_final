import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import StudentLayout from "@/components/layout/student-layout";
import {
  Download,
  Camera,
  Upload,
  CreditCard,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Info,
  RefreshCw,
  Loader2
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartIcon,
  SchoolIcon,
  MenuBookIcon,
  EventNoteIcon,
  DescriptionIcon,
  PaymentsIcon,
  HelpOutlineIcon,
  LayersIcon,
  FileTextIcon,
} from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";

// Interface para o status do estudante
interface StudentCredentialStatus {
  hasValidPhoto: boolean;
  hasApprovedDocuments: boolean;
  hasPaidFirstInstallment: boolean;
  canGenerateCredential: boolean;
  hasGeneratedCredential: boolean;
  credentialExpiryDate: string | null;
  rejectionReason: string | null;
  pendingDocuments: string[];
  paymentStatus: 'pending' | 'paid' | 'late';
}

// Interface para o histórico de credenciais
interface CredentialHistory {
  id: number;
  status: 'active' | 'expired' | 'canceled';
  generatedAt: string;
  expiresAt: string;
  downloadUrl?: string;
}

export default function CredencialPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>("https://placehold.co/400x500/e2e8f0/475569?text=Foto+do+Aluno");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simular dados do estudante
  const mockStudentCredentialStatus: StudentCredentialStatus = {
    hasValidPhoto: true,
    hasApprovedDocuments: true,
    hasPaidFirstInstallment: true,
    canGenerateCredential: true,
    hasGeneratedCredential: true,
    credentialExpiryDate: "2025-12-31",
    rejectionReason: null,
    pendingDocuments: [],
    paymentStatus: 'paid',
  };

  // Simular histórico de credenciais
  const mockCredentialHistory: CredentialHistory[] = [
    {
      id: 1,
      status: 'active',
      generatedAt: "2023-01-15T10:20:00",
      expiresAt: "2025-12-31T23:59:59",
      downloadUrl: "#",
    },
    {
      id: 2,
      status: 'expired',
      generatedAt: "2021-01-20T14:30:00",
      expiresAt: "2022-12-31T23:59:59",
      downloadUrl: "#",
    }
  ];

  // Formatador de data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Formatador de data e hora
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Simulação de upload
    setIsUploading(true);
    setUploadProgress(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);

    // Simular progresso de upload
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          
          toast({
            title: "Foto enviada com sucesso",
            description: "Sua foto foi enviada e está sendo analisada.",
          });
          
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleCameraCapture = async () => {
    setShowCamera(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Erro ao acessar câmera",
        description: "Não foi possível acessar sua câmera. Verifique as permissões.",
        variant: "destructive",
      });
      setShowCamera(false);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        // Aspectos da imagem
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Converter para imagem
        const imageDataURL = canvas.toDataURL('image/png');
        setCapturedImage(imageDataURL);
        setPhotoPreview(imageDataURL);
        
        // Parar a câmera
        const stream = video.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
        
        setShowCamera(false);
        
        // Simulação de upload
        setIsUploading(true);
        setUploadProgress(0);
        
        // Simular progresso de upload
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              setIsUploading(false);
              
              toast({
                title: "Foto capturada com sucesso",
                description: "Sua foto foi enviada e está sendo analisada.",
              });
              
              return 100;
            }
            return prev + 10;
          });
        }, 300);
      }
    }
  };

  const cancelCamera = () => {
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
    setShowCamera(false);
  };

  const handleGenerateCredential = () => {
    setIsGenerating(true);
    
    // Simular geração
    setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: "Credencial gerada com sucesso!",
        description: "Sua credencial estudantil foi gerada e está disponível para download.",
      });
      
      // Atualizar o status
      // Na aplicação real, isso seria feito via API
    }, 2000);
  };

  // Verificar se o aluno pode gerar a credencial
  const canGenerate = mockStudentCredentialStatus.hasValidPhoto &&
                      mockStudentCredentialStatus.hasApprovedDocuments &&
                      mockStudentCredentialStatus.hasPaidFirstInstallment;

  // Verificar se o aluno já possui credencial ativa
  const hasActiveCredential = mockCredentialHistory.some(cred => cred.status === 'active');

  return (
    <StudentLayout
      title="Credencial Estudantil"
      subtitle="Gerencie sua credencial estudantil digital"
      breadcrumbs={[
        { title: "Home", href: "/student" },
        { title: "Credencial", href: "/student/credencial" }
      ]}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna esquerda - Status e Geração */}
        <div className="md:col-span-2 space-y-6">
          {/* Status da Credencial */}
          <Card>
            <CardHeader>
              <CardTitle>Status da Credencial</CardTitle>
              <CardDescription>
                Verifique seu status atual e os requisitos para emissão
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasActiveCredential ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Credencial Ativa</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Você já possui uma credencial ativa válida até {formatDate(mockCredentialHistory[0].expiresAt)}.
                  </AlertDescription>
                </Alert>
              ) : canGenerate ? (
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">Pronto para Emissão</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    Você atende a todos os requisitos e pode gerar sua credencial estudantil.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">Pendências Encontradas</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    Existem requisitos pendentes para a emissão da sua credencial.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Requisito: Foto */}
                <div className="p-4 rounded-lg border bg-white">
                  <div className="flex items-start">
                    {mockStudentCredentialStatus.hasValidPhoto ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900">Foto do Aluno</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {mockStudentCredentialStatus.hasValidPhoto
                          ? "Foto aprovada e válida para uso na credencial."
                          : "Você precisa enviar uma foto de rosto em fundo branco."}
                      </p>
                      {!mockStudentCredentialStatus.hasValidPhoto && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="h-3.5 w-3.5 mr-1" />
                            Enviar Foto
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={handleCameraCapture}
                          >
                            <Camera className="h-3.5 w-3.5 mr-1" />
                            Tirar Foto
                          </Button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoUpload}
                            accept="image/*"
                            className="hidden"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Requisito: Documentação */}
                <div className="p-4 rounded-lg border bg-white">
                  <div className="flex items-start">
                    {mockStudentCredentialStatus.hasApprovedDocuments ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900">Documentação Acadêmica</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {mockStudentCredentialStatus.hasApprovedDocuments
                          ? "Documentação aprovada pela secretaria acadêmica."
                          : "Documentos pendentes de aprovação pela secretaria."}
                      </p>
                      {mockStudentCredentialStatus.pendingDocuments.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700">Documentos pendentes:</p>
                          <ul className="mt-1 text-xs text-gray-600 list-disc list-inside">
                            {mockStudentCredentialStatus.pendingDocuments.map((doc, index) => (
                              <li key={index}>{doc}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Requisito: Pagamento */}
                <div className="p-4 rounded-lg border bg-white">
                  <div className="flex items-start">
                    {mockStudentCredentialStatus.hasPaidFirstInstallment ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900">Situação Financeira</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {mockStudentCredentialStatus.hasPaidFirstInstallment
                          ? "Situação financeira regularizada."
                          : "Pendências financeiras detectadas."}
                      </p>
                      {!mockStudentCredentialStatus.hasPaidFirstInstallment && (
                        <div className="mt-3">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.location.href = "/student/financial"}
                          >
                            <CreditCard className="h-3.5 w-3.5 mr-1" />
                            Ver Pendências
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleGenerateCredential}
                disabled={!canGenerate || hasActiveCredential || isGenerating}
                className="w-full sm:w-auto"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : hasActiveCredential ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Já possui credencial
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Gerar Credencial
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Histórico de Credenciais */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Credenciais</CardTitle>
              <CardDescription>
                Visualize suas credenciais anteriores e atuais
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mockCredentialHistory.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500">Você ainda não possui histórico de credenciais.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mockCredentialHistory.map((credential) => (
                    <div 
                      key={credential.id}
                      className={`p-4 rounded-lg border ${
                        credential.status === 'active' 
                          ? 'border-green-200 bg-green-50' 
                          : credential.status === 'expired'
                            ? 'border-gray-200 bg-gray-50'
                            : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            {credential.status === 'active' ? (
                              <Badge variant="success">Ativa</Badge>
                            ) : credential.status === 'expired' ? (
                              <Badge variant="secondary">Expirada</Badge>
                            ) : (
                              <Badge variant="destructive">Cancelada</Badge>
                            )}
                            <span className="ml-2 text-sm text-gray-600">
                              ID: {credential.id}
                            </span>
                          </div>
                          <div className="mt-2 space-y-1 text-sm">
                            <p className="text-gray-700">
                              <span className="font-medium">Emitida em:</span> {formatDateTime(credential.generatedAt)}
                            </p>
                            <p className="text-gray-700">
                              <span className="font-medium">Válida até:</span> {formatDate(credential.expiresAt)}
                            </p>
                          </div>
                        </div>
                        {credential.downloadUrl && (
                          <Button variant="outline" size="sm">
                            <Download className="h-3.5 w-3.5 mr-1.5" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna direita - Previsualização e Informações */}
        <div className="space-y-6">
          {/* Previsualização da Credencial */}
          <Card>
            <CardHeader>
              <CardTitle>Visualização da Foto</CardTitle>
              <CardDescription>
                Prévia da foto para sua credencial
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="relative w-full max-w-[250px] mb-4">
                <div 
                  className="aspect-[3/4] rounded-md overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center"
                >
                  {photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt="Prévia da foto do aluno" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4 text-gray-400">
                      <Camera className="mx-auto h-10 w-10 mb-2" />
                      <p className="text-sm">Nenhuma foto disponível</p>
                    </div>
                  )}
                </div>
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-md">
                    <div className="text-white text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin mb-2" />
                      <p className="text-sm font-medium">{uploadProgress}%</p>
                    </div>
                  </div>
                )}
              </div>
              {photoPreview && !mockStudentCredentialStatus.hasValidPhoto && (
                <div className="flex gap-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    Alterar Foto
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações Sobre a Credencial */}
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <p className="text-gray-700">
                  A credencial estudantil é o documento oficial que comprova seu vínculo com a instituição de ensino.
                </p>
                <p className="text-gray-700">
                  Com ela, você tem acesso a diversos benefícios, como descontos em eventos culturais, cinemas, teatros e transporte público.
                </p>
                <p className="text-gray-700">
                  Para emitir sua credencial, é necessário:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Foto recente em fundo branco</li>
                  <li>Documentação acadêmica completa</li>
                  <li>Situação financeira regularizada</li>
                </ul>
                <p className="text-gray-700">
                  A credencial tem validade de um ano acadêmico, podendo ser renovada anualmente enquanto você mantiver vínculo com a instituição.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal da câmera */}
      {showCamera && (
        <Dialog open={showCamera} onOpenChange={setShowCamera}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Capturar Foto</DialogTitle>
              <DialogDescription>
                Posicione seu rosto no centro da imagem e clique em "Capturar"
              </DialogDescription>
            </DialogHeader>
            <div className="relative overflow-hidden rounded-md">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-auto"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <DialogFooter className="flex justify-between sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={cancelCamera}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={takePhoto}>
                <Camera className="h-4 w-4 mr-2" />
                Capturar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </StudentLayout>
  );
}