import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { PlusIcon, Pencil, Trash2, BookMarked, Book, ExternalLink, FileUp } from 'lucide-react';
import { PdfViewer } from '@/components/pdf-viewer/pdf-viewer';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

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

export default function EbookContentSection({ disciplineId }: EbookContentSectionProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
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
  const { data: ebookData, isLoading } = useQuery<EbookData>({
    queryKey: ['/api/disciplines', disciplineId, 'ebook'],
    // Usar o queryFn padrão que já está configurado para lidar com autenticação
  });
  
  // Formulário para adicionar/editar ebook
  const form = useForm<EbookFormValues>({
    resolver: zodResolver(ebookFormSchema),
    defaultValues: {
      url: '',
      title: '',
      description: ''
    }
  });
  
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
  
  return (
    <div className="ebook-content-section">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">E-book Interativo</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsAddDialogOpen(true)}
          className="flex gap-2 items-center"
        >
          <PlusIcon className="h-4 w-4" />
          Adicionar E-book
        </Button>
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
                  <h3 className="text-lg font-semibold">{ebookData.name}</h3>
                  <p className="text-sm text-gray-500">{ebookData.description}</p>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="default" 
                    onClick={() => setIsViewDialogOpen(true)}
                    className="flex gap-2 items-center"
                  >
                    <Book className="h-4 w-4" />
                    Abrir E-book
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(ebookData.ebookPdfUrl, '_blank')}
                    className="flex gap-2 items-center"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Nova Aba
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="icon"
                      >
                        <Trash2 className="h-4 w-4" />
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
              
              <div className="h-64 w-full bg-slate-100 rounded-md overflow-hidden">
                {ebookData.ebookPdfUrl && (
                  <PdfViewer 
                    pdfUrl={ebookData.ebookPdfUrl} 
                    height={256}
                  />
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
      </Card>
      
      {/* Dialog para adicionar e-book */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar E-book</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      Salvar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para visualizar o PDF */}
      {ebookData?.available && ebookData.ebookPdfUrl && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{ebookData.name}</DialogTitle>
            </DialogHeader>
            
            <div className="flex-grow overflow-auto h-[calc(90vh-120px)]">
              <PdfViewer 
                pdfUrl={ebookData.ebookPdfUrl} 
                height="100%"
              />
            </div>
            
            <DialogFooter>
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
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}