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
  Search,
  File as FileIcon
} from 'lucide-react';
import { PdfViewer } from '@/components/pdf-viewer/pdf-viewer';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Esquema de validação para os formulários
const interactiveEbookFormSchema = z.object({
  url: z.string().optional(),
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().optional()
});

type InteractiveEbookFormValues = z.infer<typeof interactiveEbookFormSchema>;

interface InteractiveEbookContentSectionProps {
  disciplineId: number;
}

// Função utilitária para verificar se a URL é do Google Drive
function isGoogleDriveUrl(url: string): boolean {
  return url.includes('drive.google.com');
}

// Função para converter URL do Google Drive para formato de visualização direta
function getGoogleDriveFileId(url: string): string | null {
  if (!isGoogleDriveUrl(url)) return null;
  
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
  
  return fileId || null;
}

function convertGoogleDriveUrl(url: string): string {
  if (!isGoogleDriveUrl(url)) return url;
  
  const fileId = getGoogleDriveFileId(url);
  
  if (fileId) {
    console.log('Google Drive ID extraído:', fileId);
    
    // Usar URL de exportação direta para o conteúdo
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
  
  return url;
}

function getGoogleDriveEmbedUrl(url: string): string | null {
  const fileId = getGoogleDriveFileId(url);
  
  if (fileId) {
    // URL para incorporar documento do Google Drive diretamente como PDF
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  
  return null;
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

export default function InteractiveEbookContentSection({ disciplineId }: InteractiveEbookContentSectionProps) {
  console.log('InteractiveEbookContentSection renderizando para disciplina:', disciplineId);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  
  // Definir interface para os dados do ebook interativo
  interface InteractiveEbookData {
    id: number;
    available: boolean;
    name: string;
    description?: string;
    interactiveEbookUrl?: string;
    message?: string;
  }

  // Consulta para buscar dados do ebook interativo - usando um endpoint diferente
  const { data: rawEbookResponse, isLoading, refetch } = useQuery<any>({
    queryKey: ['/api/disciplines', disciplineId, 'interactive-ebook'],
    refetchOnWindowFocus: false,
    staleTime: 0,
    // Usar uma função de fallback que retorna um objeto vazio quando o endpoint ainda não existe
    queryFn: async ({ queryKey }) => {
      try {
        const response = await apiRequest('GET', `/api/disciplines/${disciplineId}/interactive-ebook`);
        if (!response.ok) {
          // Se o endpoint não existe, retornar um objeto que indica isso
          return { 
            id: disciplineId, 
            available: false,
            message: "Endpoint não disponível" 
          };
        }
        return response.json();
      } catch (error) {
        console.error("Erro ao buscar ebook interativo:", error);
        // Criar uma estrutura que indica que o recurso não está disponível
        return { 
          id: disciplineId, 
          available: false,
          message: "Recurso não disponível" 
        };
      }
    }
  });
  
  // Processamento da resposta para extrair os dados corretos
  const ebookData = React.useMemo(() => {
    console.log('Resposta bruta do e-book interativo:', rawEbookResponse);
    
    if (!rawEbookResponse) return null;
    
    // Se temos uma resposta com a mensagem indicando que o endpoint não existe
    if (rawEbookResponse.message && rawEbookResponse.message.includes("não disponível")) {
      return {
        id: disciplineId,
        available: false,
        message: rawEbookResponse.message
      } as InteractiveEbookData;
    }
    
    // Verificar se a resposta está no formato esperado
    if (typeof rawEbookResponse === 'object') {
      // Verificação de formatos como no componente original
      if (
        'id' in rawEbookResponse && 
        'available' in rawEbookResponse && 
        rawEbookResponse.available === true &&
        'interactiveEbookUrl' in rawEbookResponse
      ) {
        console.log('Formato identificado: objeto com available=true');
        return {
          id: rawEbookResponse.id,
          available: true,
          name: rawEbookResponse.name || "E-book Interativo da Disciplina",
          description: rawEbookResponse.description || "",
          interactiveEbookUrl: rawEbookResponse.interactiveEbookUrl
        } as InteractiveEbookData;
      }
      
      // Caso 1: Formato direto com available=false
      if ('id' in rawEbookResponse && 'available' in rawEbookResponse && !rawEbookResponse.available) {
        console.log('Formato identificado: objeto com available=false');
        return {
          id: rawEbookResponse.id,
          available: false
        } as InteractiveEbookData;
      }
      
      // Caso 2: Formato {success: true, data: {...}}
      if ('success' in rawEbookResponse && 'data' in rawEbookResponse) {
        console.log('Formato identificado: objeto com success e data');
        const data = rawEbookResponse.data;
        if (data && typeof data === 'object') {
          if ('id' in data && 'available' in data) {
            return data as InteractiveEbookData;
          }
        }
      }
    }
    
    // Se não conseguimos processar a resposta, retornar um objeto com available=false
    return {
      id: disciplineId,
      available: false,
      message: "Formato de resposta desconhecido"
    } as InteractiveEbookData;
  }, [rawEbookResponse, disciplineId]);
  
  console.log('Dados do e-book interativo processados:', ebookData);
  
  // Usado para preparar a URL para visualização
  useEffect(() => {
    if (ebookData?.interactiveEbookUrl) {
      console.log('URL original do e-book interativo:', ebookData.interactiveEbookUrl);
      const urlType = detectUrlType(ebookData.interactiveEbookUrl);
      console.log('Tipo de URL detectado:', urlType);
      
      if (urlType === 'google-drive') {
        const convertedUrl = convertGoogleDriveUrl(ebookData.interactiveEbookUrl);
        console.log('URL convertida para o Google Drive:', convertedUrl);
        setViewerUrl(convertedUrl);
      } else {
        console.log('Usando URL original para visualização');
        setViewerUrl(ebookData.interactiveEbookUrl);
      }
    } else {
      console.log('Nenhuma URL de e-book interativo disponível');
      setViewerUrl(null);
    }
  }, [ebookData]);
  
  // Formulário para adicionar/editar ebook interativo
  const form = useForm<InteractiveEbookFormValues>({
    resolver: zodResolver(interactiveEbookFormSchema),
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
  
  // Mutação para adicionar/atualizar ebook interativo
  const addEbookMutation = useMutation({
    mutationFn: async (data: FormData) => {
      try {
        // Para uploads de arquivo, precisamos usar uma abordagem especial
        // Usar a URL completa com o domínio da API
        const baseUrl = document.querySelector('meta[name="api-base-url"]')?.getAttribute('content') || '';
        const url = `${baseUrl}/api/disciplines/${disciplineId}/interactive-ebook`;
        
        console.log('Enviando dados para URL completa:', url);
        
        // Obter o token de autenticação do localStorage
        const token = localStorage.getItem('auth_token');
        
        const response = await fetch(url, {
          method: 'POST',
          body: data,
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        
        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            // Se for JSON, tentar ler a mensagem de erro
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro desconhecido ao adicionar e-book interativo');
          } else {
            // Se não for JSON, provavelmente é HTML de erro
            throw new Error('Erro no servidor ao adicionar e-book interativo');
          }
        }
        
        const text = await response.text();
        try {
          // Tentar converter para JSON
          return JSON.parse(text);
        } catch (e) {
          console.error('Erro ao parsear resposta como JSON:', text);
          throw new Error('A resposta não é um JSON válido');
        }
      } catch (error) {
        console.error('Erro na mutação:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/disciplines', disciplineId, 'interactive-ebook']
      });
      toast({
        title: 'Sucesso',
        description: 'E-book interativo adicionado com sucesso',
      });
      setIsAddDialogOpen(false);
      form.reset();
      setSelectedFile(null);
      
      // Refetch para atualizar os dados
      setTimeout(() => {
        console.log('Recarregando dados do e-book interativo após adição bem-sucedida');
        refetch();
      }, 500);
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: `Falha ao adicionar e-book interativo: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Mutação para excluir ebook interativo
  const deleteEbookMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/disciplines/${disciplineId}/interactive-ebook`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/disciplines', disciplineId, 'interactive-ebook']
      });
      toast({
        title: 'Sucesso',
        description: 'E-book interativo removido com sucesso',
      });
      setIsManageDialogOpen(false);
      
      // Refetch para atualizar os dados
      setTimeout(() => {
        console.log('Recarregando dados do e-book interativo após exclusão bem-sucedida');
        refetch();
      }, 500);
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: `Falha ao remover e-book interativo: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  const onSubmit = (values: InteractiveEbookFormValues) => {
    const formData = new FormData();
    
    if (selectedFile) {
      formData.append('file', selectedFile);
    } else if (values.url) {
      formData.append('url', values.url);
    } else {
      toast({
        title: 'Aviso',
        description: 'É necessário fornecer um arquivo ou uma URL para o e-book interativo',
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
  const urlType = ebookData?.interactiveEbookUrl ? detectUrlType(ebookData.interactiveEbookUrl) : 'unknown';
  
  // Função de depuração para forçar uma atualização dos dados
  const forceRefresh = () => {
    console.log('Forçando atualização dos dados do e-book interativo');
    queryClient.removeQueries({queryKey: ['/api/disciplines', disciplineId, 'interactive-ebook']});
    setTimeout(() => {
      refetch();
    }, 100);
  };
  
  return (
    <div className="interactive-ebook-content-section">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold">E-book Interativo</h2>
          {ebookData?.available && (
            <Badge variant="outline" className="ml-2 bg-green-50">
              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              Disponível
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={forceRefresh}
            className="flex gap-2 items-center"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          
          {ebookData?.available ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsManageDialogOpen(true)}
                className="flex gap-2 items-center"
              >
                <Pencil className="h-4 w-4" />
                Gerenciar
              </Button>
              
              <Button 
                variant="outline"
                size="sm" 
                onClick={() => window.open(ebookData.interactiveEbookUrl, '_blank')}
                className="flex gap-2 items-center bg-blue-50 text-blue-800 hover:bg-blue-100"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir
              </Button>
            </>
          ) : (
            <Button 
              variant="default"
              size="sm" 
              onClick={() => setIsAddDialogOpen(true)}
              className="flex gap-2 items-center"
            >
              <PlusIcon className="h-4 w-4" />
              Adicionar E-book Interativo
            </Button>
          )}
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
              <h3 className="text-lg font-medium">Carregando E-book Interativo</h3>
              <p className="text-sm text-gray-500 mb-4">Aguarde enquanto verificamos a disponibilidade</p>
            </div>
          ) : ebookData.available ? (
            <div className="flex flex-col">
              <div className="flex flex-col gap-4 mb-6">
                <div className="mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{ebookData.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{ebookData.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="h-[400px] w-full bg-slate-50 rounded-md overflow-hidden border border-slate-200">
                {urlType === 'google-drive' && ebookData?.interactiveEbookUrl ? (
                  <iframe 
                    src={getGoogleDriveEmbedUrl(ebookData.interactiveEbookUrl) || ''}
                    className="w-full h-full border-0"
                    allow="autoplay"
                    title="Visualizador de E-book Interativo"
                  ></iframe>
                ) : viewerUrl ? (
                  <PdfViewer 
                    pdfUrl={viewerUrl} 
                    height="100%"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 h-full">
                    <div className="text-center">
                      <FileText className="h-14 w-14 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500 text-xs">Visualização não disponível</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center">
              <BookMarked className="h-12 w-12 text-gray-300 mb-2" />
              <h3 className="text-lg font-medium">Nenhum E-book Interativo Disponível</h3>
              <p className="text-sm text-gray-500 mb-4">Adicione um e-book interativo para complementar o aprendizado</p>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="flex gap-2 items-center"
              >
                <PlusIcon className="h-4 w-4" />
                Adicionar E-book Interativo
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
              onClick={forceRefresh}
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Atualizar
            </Button>
          </CardFooter>
        )}
      </Card>
      
      {/* Dialog para adicionar/substituir e-book interativo */}
      <AccessibleDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        title={ebookData?.available ? "Substituir E-book Interativo" : "Adicionar E-book Interativo"}
        description="Preencha o formulário para adicionar ou substituir o e-book interativo"
        showTitle={true}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do E-book Interativo</FormLabel>
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
      
      {/* Dialog de gerenciamento do e-book interativo */}
      {ebookData?.available && (
        <AccessibleDialog
          open={isManageDialogOpen}
          onOpenChange={setIsManageDialogOpen}
          title="Gerenciar E-book Interativo"
          description="Gerencie o e-book interativo associado a esta disciplina"
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
                    {ebookData.interactiveEbookUrl || "N/A"}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="preview" className="space-y-4 mt-4">
              <div className="h-[400px] w-full bg-slate-100 rounded-md overflow-hidden flex items-center justify-center">
                {urlType === 'google-drive' && ebookData?.interactiveEbookUrl ? (
                  <iframe 
                    src={getGoogleDriveEmbedUrl(ebookData.interactiveEbookUrl) || ''}
                    className="w-full h-full border-0"
                    allow="autoplay"
                    title="Visualizador de E-book Interativo"
                  ></iframe>
                ) : viewerUrl ? (
                  <PdfViewer 
                    pdfUrl={viewerUrl} 
                    height="100%"
                  />
                ) : (
                  <div className="text-center p-4">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Pré-visualização não disponível</p>
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
                    Substituir E-book Interativo
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(ebookData.interactiveEbookUrl, '_blank')}
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
                        Excluir E-book Interativo
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir E-book Interativo</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir este e-book interativo? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteEbookMutation.mutate()}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {deleteEbookMutation.isPending ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Excluindo...</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Trash2 className="h-4 w-4" />
                              <span>Excluir</span>
                            </div>
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </AccessibleDialog>
      )}
    </div>
  );
}