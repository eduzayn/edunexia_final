import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  FileText,
  Upload,
  LinkIcon,
  Download,
  Loader2,
  ExternalLink,
  Trash2,
  Edit,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const ebookFormSchema = z.object({
  uploadType: z.enum(["link", "upload"]),
  url: z.string().url({ message: "Insira uma URL válida" }).optional().or(z.literal("")),
  title: z.string().min(3, { message: "O título deve ter pelo menos 3 caracteres" }),
  description: z.string().optional(),
});

type EbookFormValues = z.infer<typeof ebookFormSchema>;

interface EbookType {
  id?: number;
  disciplineId?: number;
  title: string;
  description?: string;
  url: string;
  fileType?: string;
  uploadType: "link" | "upload";
}

export function EbookManager({ disciplineId }: { disciplineId: number | string }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEbook, setSelectedEbook] = useState<EbookType | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  // Função para construir a URL da API de e-books para uma disciplina
  const buildDisciplineEbookApiUrl = (disciplineId: number | string) => {
    return `/api/disciplines/${disciplineId}/ebook`;
  };

  // Busca os dados do e-book da disciplina
  const {
    data: ebook,
    isLoading: isEbookLoading,
    refetch: refetchEbook,
  } = useQuery({
    queryKey: [buildDisciplineEbookApiUrl(disciplineId)],
    enabled: !!disciplineId,
  });

  // Mutation para adicionar/atualizar e-book
  const ebookMutation = useMutation({
    mutationFn: (data: EbookFormValues) => {
      // Se já existe um e-book, faz update, senão cria
      const method = ebook && ebook.id ? "PUT" : "POST";
      return apiRequest(method, buildDisciplineEbookApiUrl(disciplineId), data);
    },
    onSuccess: () => {
      toast({
        title: ebook && ebook.id ? "E-book atualizado com sucesso" : "E-book adicionado com sucesso",
        description: ebook && ebook.id ? "As alterações foram salvas." : "O e-book foi vinculado à disciplina.",
        variant: "default",
      });
      setIsDialogOpen(false);
      setIsEditDialogOpen(false);
      form.reset();
      // Recarrega os dados do e-book
      queryClient.invalidateQueries({ queryKey: [buildDisciplineEbookApiUrl(disciplineId)] });
      refetchEbook();
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar e-book",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir e-book
  const deleteEbookMutation = useMutation({
    mutationFn: () => {
      return apiRequest("DELETE", buildDisciplineEbookApiUrl(disciplineId));
    },
    onSuccess: () => {
      toast({
        title: "E-book excluído com sucesso",
        description: "O e-book foi removido da disciplina.",
        variant: "default",
      });
      // Recarrega os dados do e-book
      queryClient.invalidateQueries({ queryKey: [buildDisciplineEbookApiUrl(disciplineId)] });
      refetchEbook();
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir e-book",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Formulário para adição e edição de e-book
  const form = useForm<EbookFormValues>({
    resolver: zodResolver(ebookFormSchema),
    defaultValues: {
      uploadType: "link",
      url: "",
      title: "",
      description: "",
    },
  });

  // Para edição, atualiza o formulário com os dados do e-book selecionado
  const handleEditEbook = (ebookData: EbookType) => {
    setSelectedEbook(ebookData);
    form.reset({
      uploadType: ebookData.uploadType || "link",
      url: ebookData.url || "",
      title: ebookData.title || "",
      description: ebookData.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const onSubmit = (data: EbookFormValues) => {
    ebookMutation.mutate(data);
  };

  const handleDeleteEbook = () => {
    if (confirm("Tem certeza que deseja excluir este e-book?")) {
      deleteEbookMutation.mutate();
    }
  };

  // Simulação de upload de arquivo
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Aqui seria o código para fazer o upload real do arquivo
    // Por enquanto, vamos simular o processo
    setIsUploading(true);
    
    setTimeout(() => {
      // Simulação de URL gerada após upload
      const fakeUploadedUrl = `https://storage.example.com/${file.name}`;
      form.setValue("url", fakeUploadedUrl);
      setIsUploading(false);
      
      toast({
        title: "Arquivo enviado com sucesso",
        description: `${file.name} foi carregado e está pronto para ser usado.`,
        variant: "default",
      });
    }, 2000);
  };

  const renderEbookContent = () => {
    if (isEbookLoading) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-10 w-1/2" />
        </div>
      );
    }

    if (ebook && ebook.available) {
      // Exibe o e-book configurado
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-medium text-lg">{ebook.title || "E-book da disciplina"}</h3>
              {ebook.description && (
                <p className="text-sm text-gray-600 mt-1">{ebook.description}</p>
              )}
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <FileText className="h-4 w-4 mr-1" />
                <span>{ebook.uploadType === "link" ? "Link externo" : "Arquivo PDF"}</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleEditEbook(ebook)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDeleteEbook}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir
              </Button>
            </div>
          </div>
          
          <div className="border rounded-md p-4 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-sm font-medium">
                  {ebook.url.split('/').pop() || "Material em PDF"}
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild
                >
                  <a href={ebook.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Abrir
                  </a>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild
                >
                  <a href={ebook.url} download>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Caso não tenha e-book configurado
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <h3 className="text-lg font-medium text-gray-900">Nenhum e-book adicionado</h3>
        <p className="text-gray-500 mt-1 mb-4">
          Adicione um e-book estático em PDF para esta disciplina
        </p>
        <Button onClick={() => setIsDialogOpen(true)}>
          Adicionar E-book
        </Button>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">E-book Estático</CardTitle>
            <CardDescription>
              Adicione um e-book (PDF) para complementar o material da disciplina
            </CardDescription>
          </div>
          
          {ebook && ebook.available && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-1" />
              Substituir
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {renderEbookContent()}
      </CardContent>
      
      {/* Diálogo para adicionar/editar e-book */}
      <Dialog 
        open={isDialogOpen || isEditDialogOpen} 
        onOpenChange={(open) => {
          if (isDialogOpen) setIsDialogOpen(open);
          if (isEditDialogOpen) setIsEditDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Editar E-book" : "Adicionar E-book"}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen 
                ? "Edite as informações do e-book atual."
                : "Adicione um e-book estático em PDF para esta disciplina."
              }
            </DialogDescription>
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
                      <Input placeholder="Ex: Material Complementar de Estudo" {...field} />
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
                      <Input 
                        placeholder="Breve descrição do conteúdo" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="uploadType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Tipo de E-book</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="link" id="upload-link" />
                          <Label htmlFor="upload-link" className="flex items-center">
                            <LinkIcon className="h-4 w-4 mr-2" />
                            Link externo (Google Drive, Dropbox)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="upload" id="upload-file" />
                          <Label htmlFor="upload-file" className="flex items-center">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload de arquivo PDF
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {form.watch("uploadType") === "link" ? (
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL do E-book</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://drive.google.com/file/..." 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="space-y-2">
                  <FormLabel>Upload de arquivo</FormLabel>
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Input
                      id="ebook-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </div>
                  {isUploading && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Enviando arquivo...</span>
                    </div>
                  )}
                  {form.watch("url") && form.watch("uploadType") === "upload" && !isUploading && (
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <FileText className="h-4 w-4" />
                      <span>Arquivo enviado com sucesso</span>
                    </div>
                  )}
                </div>
              )}
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsDialogOpen(false);
                    setIsEditDialogOpen(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={ebookMutation.isPending || isUploading}
                >
                  {ebookMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditDialogOpen ? "Salvar alterações" : "Adicionar E-book"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}