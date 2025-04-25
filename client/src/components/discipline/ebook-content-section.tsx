import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { AccessibleDialog } from '@/components/ui/accessible-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  PlusIcon, 
  Pencil, 
  Trash2, 
  BookMarked, 
  Book, 
  ExternalLink, 
  FileUp, 
  Download,
  Info,
  RefreshCw,
  CheckCircle, 
  FileText,
  Search
} from 'lucide-react';
import { PdfViewer } from '@/components/pdf-viewer/pdf-viewer';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Esquema de validação para os formulários
const ebookFormSchema = z.object({
  url: z.string().optional(),
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().optional()
});

type EbookFormValues = z.infer<typeof ebookFormSchema>;

interface EbookContentSectionProps {
  disciplineId: number;
}

// Função utilitária para verificar se a URL é do Google Drive
function isGoogleDriveUrl(url: string): boolean {
  return url.includes('drive.google.com');
}

// Função para converter URL do Google Drive para formato de visualização direta
function convertGoogleDriveUrl(url: string): string {
  if (!isGoogleDriveUrl(url)) return url;
  
  // Extrair o ID do arquivo
  let fileId = '';
  
  // Padrão para URLs de visualização
  const viewPattern = /\/file\/d\/([^\/]+)/;
  const viewMatch = url.match(viewPattern);
  
  if (viewMatch && viewMatch[1]) {
    fileId = viewMatch[1];
  } else {
    // Padrão para URLs de compartilhamento
    const sharePattern = /id=([^&]+)/;
    const shareMatch = url.match(sharePattern);
    
    if (shareMatch && shareMatch[1]) {
      fileId = shareMatch[1];
    }
  }
  
  if (fileId) {
    // Construir URL para visualização direta no Google Drive
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  
  return url;
}

// Função para detectar o tipo de URL
function detectUrlType(url: string | undefined): 'google-drive' | 'pdf' | 'unknown' {
  if (!url) return 'unknown';
  
  if (isGoogleDriveUrl(url)) {
    return 'google-drive';
  } else if (url.endsWith('.pdf') || url.includes('/uploads/')) {
    return 'pdf';
  }
  
  return 'unknown';
}

export default function EbookContentSection({ disciplineId }: EbookContentSectionProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('preview');
  
  const queryClient = useQueryClient();
  
  // Definir interface para os dados do ebook
  interface EbookData {
    id: number;
    available: boolean;
    name: string;
    description?: string;
    ebookPdfUrl?: string;
    message?: string;
  }

  // Consulta para buscar dados do ebook
  const { data: ebookData, isLoading, refetch } = useQuery<EbookData>({
    queryKey: ['/api/disciplines', disciplineId, 'ebook'],
    refetchOnWindowFocus: false,
    // Usar o queryFn padrão que já está configurado para lidar com autenticação
  });
  
  // Usado para preparar a URL para visualização
  useEffect(() => {
    if (ebookData?.ebookPdfUrl) {
      const urlType = detectUrlType(ebookData.ebookPdfUrl);
      if (urlType === 'google-drive') {
        setViewerUrl(convertGoogleDriveUrl(ebookData.ebookPdfUrl));
      } else {
        setViewerUrl(ebookData.ebookPdfUrl);
      }
    } else {
      setViewerUrl(null);
    }
  }, [ebookData]);
  
  // Formulário para adicionar/editar ebook
  const form = useForm<EbookFormValues>({
    resolver: zodResolver(ebookFormSchema),
    defaultValues: {
      url: '',
      title: ebookData?.name || '',
      description: ebookData?.description || ''
    }
  });
  
  // Atualizar os valores padrão quando os dados do e-book são carregados
  useEffect(() => {
    if (ebookData) {
      form.reset({
        url: '',
        title: ebookData.name || '',
        description: ebookData.description || ''
      });
    }
  }, [ebookData, form]);
  
  // Mutação para adicionar/atualizar ebook
  const addEbookMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Para uploads de arquivo, precisamos usar uma abordagem especial
      // já que apiRequest não suporta FormData diretamente
      const url = `/api/disciplines/${disciplineId}/ebook`;
      
      // Obter o token de autenticação do localStorage
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(url, {
        method: 'POST',
        body: data,
        headers: {
          // Não podemos definir Content-Type com FormData,
          // o navegador fará isso automaticamente com o boundary correto
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao adicionar ebook');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/disciplines', disciplineId, 'ebook']
      });
      toast({
        title: 'Sucesso',
        description: 'E-book adicionado com sucesso',
      });
      setIsAddDialogOpen(false);
      form.reset();
      setSelectedFile(null);
      
      // Refetch para atualizar os dados
      setTimeout(() => {
        refetch();
      }, 500);
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: `Falha ao adicionar e-book: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Mutação para excluir ebook
  const deleteEbookMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/disciplines/${disciplineId}/ebook`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/disciplines', disciplineId, 'ebook']
      });
      toast({
        title: 'Sucesso',
        description: 'E-book removido com sucesso',
      });
      setIsManageDialogOpen(false);
      
      // Refetch para atualizar os dados
      setTimeout(() => {
        refetch();
      }, 500);
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: `Falha ao remover e-book: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  const onSubmit = (values: EbookFormValues) => {
    const formData = new FormData();
    
    if (selectedFile) {
      formData.append('file', selectedFile);
    } else if (values.url) {
      formData.append('url', values.url);
    } else {
      toast({
        title: 'Aviso',
        description: 'É necessário fornecer um arquivo ou uma URL para o e-book',
        variant: 'destructive',
      });
      return;
    }
    
    formData.append('title', values.title);
    if (values.description) {
      formData.append('description', values.description);
    }
    
    addEbookMutation.mutate(formData);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  // Verificar o tipo de URL do e-book (se disponível)
  const urlType = ebookData?.ebookPdfUrl ? detectUrlType(ebookData.ebookPdfUrl) : 'unknown';
  
  return (
    <div className="ebook-content-section">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold">E-book Interativo (Nova Interface)</h2>
          {ebookData?.available && (
            <Badge variant="outline" className="ml-2 bg-green-50">
              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              Disponível
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          {ebookData?.available && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsManageDialogOpen(true)}
              className="flex gap-2 items-center"
            >
              <Pencil className="h-4 w-4" />
              Gerenciar
            </Button>
          )}
          
          <Button 
            variant={ebookData?.available ? "outline" : "default"}
            size="sm" 
            onClick={() => setIsAddDialogOpen(true)}
            className="flex gap-2 items-center"
          >
            <PlusIcon className="h-4 w-4" />
            {ebookData?.available ? "Substituir" : "Adicionar E-book"}
          </Button>
        </div>
      </div>
      
      <Card className="w-full">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !ebookData ? (
            // Caso em que ebookData é null ou undefined
            <div className="py-8 flex flex-col items-center justify-center">
              <BookMarked className="h-12 w-12 text-gray-300 mb-2" />
              <h3 className="text-lg font-medium">Carregando...</h3>
              <p className="text-sm text-gray-500 mb-4">Aguarde enquanto carregamos os dados do e-book</p>
            </div>
          ) : ebookData.available ? (
            <div className="flex flex-col">
              <div className="flex flex-col gap-4 mb-6">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{ebookData.name}</h3>
                      <p className="text-sm text-gray-500">{ebookData.description}</p>
                    </div>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="bg-blue-50">
                            {urlType === 'google-drive' ? 'Google Drive' : urlType === 'pdf' ? 'PDF' : 'Link Externo'}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Tipo de conteúdo: {urlType === 'google-drive' ? 'Google Drive' : urlType === 'pdf' ? 'PDF' : 'Link Externo'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="default" 
                    onClick={() => setIsViewDialogOpen(true)}
                    className="flex gap-2 items-center"
                  >
                    <Book className="h-4 w-4" />
                    Visualizar E-book
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(ebookData.ebookPdfUrl, '_blank')}
                    className="flex gap-2 items-center"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Abrir em Nova Aba
                  </Button>
                </div>
              </div>
              
              <div className="h-64 w-full bg-slate-100 rounded-md overflow-hidden flex items-center justify-center">
                {viewerUrl ? (
                  urlType === 'google-drive' ? (
                    <iframe 
                      src={viewerUrl} 
                      className="w-full h-full"
                      allow="autoplay"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <PdfViewer 
                      pdfUrl={viewerUrl} 
                      height={256}
                    />
                  )
                ) : (
                  <div className="text-center p-4">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Pré-visualização não disponível</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => window.open(ebookData.ebookPdfUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir para visualizar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center">
              <BookMarked className="h-12 w-12 text-gray-300 mb-2" />
              <h3 className="text-lg font-medium">Nenhum E-book Disponível</h3>
              <p className="text-sm text-gray-500 mb-4">Adicione um e-book para complementar o aprendizado</p>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="flex gap-2 items-center"
              >
                <PlusIcon className="h-4 w-4" />
                Adicionar E-book
              </Button>
            </div>
          )}
        </CardContent>
        
        {ebookData?.available && (
          <CardFooter className="border-t bg-muted/20 flex justify-between">
            <div className="flex items-center text-xs text-muted-foreground">
              <Info className="h-3 w-3 mr-1" />
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => refetch()}
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Atualizar
            </Button>
          </CardFooter>
        )}
      </Card>
      
      {/* Dialog para adicionar/substituir e-book */}
      <AccessibleDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        title={ebookData?.available ? "Substituir E-book" : "Adicionar E-book"}
        description="Preencha o formulário para adicionar ou substituir o e-book"
        showTitle={true}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do E-book</FormLabel>
                  <FormControl>
                    <Input placeholder="Inserir título" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Inserir uma breve descrição do conteúdo" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid gap-4 py-2">
              <Label>Arquivo ou URL</Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Upload de Arquivo</Label>
                  <div className="flex flex-col gap-2 w-full">
                    <Input 
                      type="file" 
                      accept=".pdf" 
                      onChange={handleFileChange}
                    />
                    {selectedFile && (
                      <p className="text-xs text-green-600">
                        {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Label>OU Link Externo</Label>
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="https://exemplo.com/ebook.pdf" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Suporta URLs do Google Drive, OneDrive ou PDFs diretos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={addEbookMutation.isPending}
                className="flex gap-2 items-center"
              >
                {addEbookMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <FileUp className="h-4 w-4" />
                    {ebookData?.available ? "Substituir" : "Adicionar"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </AccessibleDialog>
      
      {/* Dialog de gerenciamento do e-book */}
      {ebookData?.available && (
        <AccessibleDialog
          open={isManageDialogOpen}
          onOpenChange={setIsManageDialogOpen}
          title="Gerenciar E-book"
          description="Gerencie o e-book associado a esta disciplina"
          showTitle={true}
        >
          <Tabs defaultValue="info" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="preview">Pré-visualizar</TabsTrigger>
              <TabsTrigger value="actions">Ações</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div>
                  <Label>Título</Label>
                  <div className="font-medium mt-1">{ebookData.name}</div>
                </div>
                
                <div>
                  <Label>Descrição</Label>
                  <div className="text-sm text-gray-500 mt-1">
                    {ebookData.description || "Sem descrição"}
                  </div>
                </div>
                
                <div>
                  <Label>Tipo</Label>
                  <div className="flex items-center mt-1">
                    <Badge className="bg-blue-50 text-blue-800">
                      {urlType === 'google-drive' ? 'Google Drive' : urlType === 'pdf' ? 'PDF' : 'Link Externo'}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label>URL</Label>
                  <div className="text-xs text-gray-500 mt-1 break-all">
                    {ebookData.ebookPdfUrl || "N/A"}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="preview" className="space-y-4 mt-4">
              <div className="h-[400px] w-full bg-slate-100 rounded-md overflow-hidden flex items-center justify-center">
                {viewerUrl ? (
                  urlType === 'google-drive' ? (
                    <iframe 
                      src={viewerUrl} 
                      className="w-full h-full" 
                      allow="autoplay"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <PdfViewer 
                      pdfUrl={viewerUrl} 
                      height="100%"
                    />
                  )
                ) : (
                  <div className="text-center p-4">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Pré-visualização não disponível</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => window.open(ebookData.ebookPdfUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir para visualizar
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="actions" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(true)}
                    className="w-full justify-start"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Substituir E-book
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(ebookData.ebookPdfUrl, '_blank')}
                    className="w-full justify-start"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir em Nova Aba
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        className="w-full justify-start mt-4"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir E-book
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir E-book</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir este e-book? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteEbookMutation.mutate()}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsManageDialogOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </AccessibleDialog>
      )}
      
      {/* Dialog para visualizar o PDF/Google Drive */}
      {ebookData?.available && ebookData.ebookPdfUrl && (
        <AccessibleDialog
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          title={ebookData.name || "Visualizador de E-book"}
          description="Visualização do conteúdo do e-book"
          showTitle={true}
        >
          <div className="flex-grow overflow-auto h-[calc(90vh-120px)] mt-4">
            {viewerUrl ? (
              urlType === 'google-drive' ? (
                <iframe 
                  src={viewerUrl}
                  className="w-full h-full" 
                  allow="autoplay"
                  allowFullScreen
                ></iframe>
              ) : (
                <PdfViewer 
                  pdfUrl={viewerUrl} 
                  height="100%"
                />
              )
            ) : (
              <div className="text-center p-4">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Visualização não disponível</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => window.open(ebookData.ebookPdfUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir para visualizar
                </Button>
              </div>
            )}
          </div>
          
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsViewDialogOpen(false)}
            >
              Fechar
            </Button>
            <Button 
              variant="default" 
              onClick={() => window.open(ebookData.ebookPdfUrl, '_blank')}
              className="flex gap-2 items-center"
            >
              <ExternalLink className="h-4 w-4" />
              Nova Aba
            </Button>
          </DialogFooter>
        </AccessibleDialog>
      )}
    </div>
  );
}