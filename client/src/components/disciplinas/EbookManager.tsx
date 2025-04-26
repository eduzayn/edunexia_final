import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { Discipline } from "@shared/schema";
import { queryClient, apiRequest, fetchDisciplineEbook } from "@/lib/queryClient";
import { buildDisciplineEbookApiUrl } from "@/lib/api-config";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Plus, 
  ExternalLink, 
  Upload, 
  Download, 
  Edit, 
  Trash, 
  AlertCircle, 
  Loader2,
  FileIcon
} from "lucide-react";

interface EbookManagerProps {
  disciplineId: number;
  discipline: Discipline;
}

// Schema para validação dos formulários
const ebookFormSchema = z.object({
  title: z.string().min(3, { message: "Título deve ter pelo menos 3 caracteres" }),
  description: z.string().min(10, { message: "Descrição deve ter pelo menos 10 caracteres" }),
  url: z.string().url({ message: "URL inválida" }),
});

type EbookFormValues = z.infer<typeof ebookFormSchema>;

export function EbookManager({ disciplineId, discipline }: EbookManagerProps) {
  const { toast } = useToast();
  const [isEbookLinkDialogOpen, setIsEbookLinkDialogOpen] = useState(false);
  const [isEbookEditDialogOpen, setIsEbookEditDialogOpen] = useState(false);
  const [isEbookUploadDialogOpen, setIsEbookUploadDialogOpen] = useState(false);
  const [selectedEbookId, setSelectedEbookId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Consulta para obter o e-book da disciplina
  const { 
    data: ebook, 
    isLoading: isEbookLoading,
    refetch: refetchEbook
  } = useQuery({
    queryKey: [buildDisciplineEbookApiUrl(disciplineId)],
    queryFn: async () => {
      try {
        const response = await fetchDisciplineEbook(disciplineId);
        const data = await response.json();
        return data || { ebookPdfUrl: null, apostilaPdfUrl: null, id: disciplineId };
      } catch (error) {
        console.error("Erro ao buscar e-book da disciplina:", error);
        return { ebookPdfUrl: null, apostilaPdfUrl: null, id: disciplineId };
      }
    },
  });

  // Mutation para adicionar e-book via link
  const addEbookLinkMutation = useMutation({
    mutationFn: async (data: EbookFormValues) => {
      return apiRequest('POST', buildDisciplineEbookApiUrl(disciplineId), {
        ...data,
        type: 'static'
      });
    },
    onSuccess: () => {
      toast({
        title: "E-book adicionado com sucesso",
        description: "O e-book foi vinculado à disciplina.",
        variant: "default",
      });
      setIsEbookLinkDialogOpen(false);
      // Recarrega as informações do e-book
      queryClient.invalidateQueries({ queryKey: [buildDisciplineEbookApiUrl(disciplineId)] });
      refetchEbook();
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar e-book",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mutation para editar e-book
  const editEbookMutation = useMutation({
    mutationFn: async (data: EbookFormValues) => {
      return apiRequest('PUT', buildDisciplineEbookApiUrl(disciplineId), {
        ...data,
        type: 'static'
      });
    },
    onSuccess: () => {
      toast({
        title: "E-book atualizado com sucesso",
        description: "As alterações foram salvas.",
        variant: "default",
      });
      setIsEbookEditDialogOpen(false);
      // Recarrega as informações do e-book
      queryClient.invalidateQueries({ queryKey: [buildDisciplineEbookApiUrl(disciplineId)] });
      refetchEbook();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar e-book",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mutation para excluir e-book
  const deleteEbookMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', buildDisciplineEbookApiUrl(disciplineId));
    },
    onSuccess: () => {
      toast({
        title: "E-book excluído com sucesso",
        description: "O e-book foi removido da disciplina.",
        variant: "default",
      });
      // Recarrega as informações do e-book
      queryClient.invalidateQueries({ queryKey: [buildDisciplineEbookApiUrl(disciplineId)] });
      refetchEbook();
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir e-book",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Formulário para adicionar e-book via link
  const form = useForm<EbookFormValues>({
    resolver: zodResolver(ebookFormSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
    },
  });

  // Formulário para editar e-book
  const editForm = useForm<EbookFormValues>({
    resolver: zodResolver(ebookFormSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
    },
  });

  const onSubmit = (data: EbookFormValues) => {
    addEbookLinkMutation.mutate(data);
  };

  const onEditSubmit = (data: EbookFormValues) => {
    editEbookMutation.mutate(data);
  };

  const handleEditEbook = () => {
    if (ebook && ebook.apostilaPdfUrl) {
      // Preenche o formulário com os dados do e-book
      editForm.reset({
        title: ebook.title || "E-book da disciplina",
        description: ebook.description || "Material didático para a disciplina",
        url: ebook.apostilaPdfUrl || "",
      });
      
      setIsEbookEditDialogOpen(true);
    }
  };

  const handleDeleteEbook = () => {
    if (confirm("Tem certeza que deseja remover este e-book da disciplina?")) {
      deleteEbookMutation.mutate();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Verifica se é um PDF
      if (file.type !== 'application/pdf') {
        toast({
          title: "Formato inválido",
          description: "O arquivo deve ser um PDF",
          variant: "destructive",
        });
        return;
      }
      
      setUploadFile(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('title', form.getValues('title'));
      formData.append('description', form.getValues('description'));
      formData.append('file', uploadFile);
      formData.append('type', 'static');
      
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          toast({
            title: "E-book enviado com sucesso",
            description: "O e-book foi adicionado à disciplina.",
            variant: "default",
          });
          setIsEbookUploadDialogOpen(false);
          // Recarrega as informações do e-book
          queryClient.invalidateQueries({ queryKey: [buildDisciplineEbookApiUrl(disciplineId)] });
          refetchEbook();
        } else {
          toast({
            title: "Erro ao enviar e-book",
            description: `Ocorreu um erro: ${xhr.statusText}`,
            variant: "destructive",
          });
        }
        setUploading(false);
      });
      
      xhr.addEventListener('error', () => {
        toast({
          title: "Erro ao enviar e-book",
          description: "Ocorreu um erro na comunicação com o servidor.",
          variant: "destructive",
        });
        setUploading(false);
      });
      
      xhr.open('POST', buildDisciplineEbookApiUrl(disciplineId) + '/upload');
      xhr.send(formData);
    } catch (error) {
      toast({
        title: "Erro ao enviar e-book",
        description: `Ocorreu um erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
      setUploading(false);
    }
  };

  const hasEbook = ebook && ebook.apostilaPdfUrl;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl">E-book Estático</CardTitle>
          <CardDescription>Adicione um e-book em PDF para a disciplina</CardDescription>
        </div>
        {!hasEbook && (
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setIsEbookLinkDialogOpen(true)}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Link externo
            </Button>
            <Button 
              size="sm" 
              onClick={() => setIsEbookUploadDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-1" />
              Upload
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isEbookLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : hasEbook ? (
          <div className="border rounded-md p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <FileIcon className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <h3 className="font-medium">{ebook.title || "E-book da disciplina"}</h3>
                  <p className="text-sm text-gray-600">{ebook.description || "Material didático para a disciplina"}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  asChild
                >
                  <a href={ebook.apostilaPdfUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  asChild
                >
                  <a href={ebook.apostilaPdfUrl} download>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" onClick={handleEditEbook}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDeleteEbook}>
                  <Trash className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              <span>Formato: PDF</span>
              {ebook.fileSize && (
                <span className="ml-3">Tamanho: {Math.round(ebook.fileSize / 1024)} KB</span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">Nenhum e-book adicionado</h3>
            <p className="text-gray-500 mt-1">Adicione um e-book para a disciplina usando upload ou link externo</p>
          </div>
        )}
      </CardContent>

      {/* Diálogo para adicionar e-book via link */}
      <Dialog open={isEbookLinkDialogOpen} onOpenChange={setIsEbookLinkDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar e-book via link</DialogTitle>
            <DialogDescription>
              Vincule um PDF hospedado externamente (Google Drive, Dropbox, etc.)
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do e-book</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Apostila da disciplina" {...field} />
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
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Breve descrição do conteúdo do e-book" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do PDF</FormLabel>
                    <FormControl>
                      <Input placeholder="https://" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEbookLinkDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={addEbookLinkMutation.isPending}>
                  {addEbookLinkMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Adicionar e-book
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar e-book */}
      <Dialog open={isEbookEditDialogOpen} onOpenChange={setIsEbookEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar e-book</DialogTitle>
            <DialogDescription>
              Modifique as informações do e-book.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do e-book</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do PDF</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEbookEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={editEbookMutation.isPending}>
                  {editEbookMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar alterações
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para upload de e-book */}
      <Dialog open={isEbookUploadDialogOpen} onOpenChange={setIsEbookUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload de e-book</DialogTitle>
            <DialogDescription>
              Faça upload de um arquivo PDF para ser usado como e-book da disciplina.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={(e) => { e.preventDefault(); handleUpload(); }} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do e-book</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Apostila da disciplina" {...field} />
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
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Breve descrição do conteúdo do e-book" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid w-full items-center gap-1.5">
                <label htmlFor="ebook-file" className="text-sm font-medium">
                  Arquivo PDF
                </label>
                <Input 
                  id="ebook-file" 
                  type="file" 
                  accept=".pdf"
                  onChange={handleFileChange}
                />
                {uploadFile && (
                  <p className="text-xs text-gray-500">
                    Arquivo selecionado: {uploadFile.name} ({Math.round(uploadFile.size / 1024)} KB)
                  </p>
                )}
              </div>
              
              {uploading && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-center text-gray-500">{uploadProgress}% concluído</p>
                </div>
              )}
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEbookUploadDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={uploading || !uploadFile}
                >
                  {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar e-book
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}