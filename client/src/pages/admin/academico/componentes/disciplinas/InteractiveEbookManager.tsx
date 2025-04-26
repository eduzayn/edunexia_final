import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
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
import { Textarea } from "@/components/ui/textarea";
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
  BookText,
  Globe,
  Upload,
  LinkIcon,
  Loader2,
  ExternalLink,
  Trash2,
  Edit,
  Code,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const interactiveEbookFormSchema = z.object({
  type: z.enum(["link", "embed", "upload"]),
  url: z.string().url({ message: "Insira uma URL válida" }).optional().or(z.literal("")),
  title: z.string().min(3, { message: "O título deve ter pelo menos 3 caracteres" }),
  description: z.string().optional(),
  embedCode: z.string().optional(),
});

type InteractiveEbookFormValues = z.infer<typeof interactiveEbookFormSchema>;

interface InteractiveEbookType {
  id?: number;
  disciplineId?: number;
  title: string;
  description?: string;
  url?: string;
  embedCode?: string;
  type: "link" | "embed" | "upload";
}

function isValidEmbedCode(code: string): boolean {
  // Verifica se o código de incorporação contém iframe e não tem scripts maliciosos
  return code.includes('<iframe') && 
         !code.includes('<script') && 
         !code.includes('javascript:') &&
         !code.includes('onerror=') &&
         !code.includes('onload=');
}

export function InteractiveEbookManager({ disciplineId }: { disciplineId: number | string }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEbook, setSelectedEbook] = useState<InteractiveEbookType | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Função para construir a URL da API de e-books interativos para uma disciplina
  const buildDisciplineInteractiveEbookApiUrl = (disciplineId: number | string) => {
    return `/api/disciplines/${disciplineId}/interactive-ebook`;
  };

  // Busca os dados do e-book interativo da disciplina
  const {
    data: interactiveEbook,
    isLoading: isEbookLoading,
    refetch: refetchEbook,
  } = useQuery({
    queryKey: [buildDisciplineInteractiveEbookApiUrl(disciplineId)],
    enabled: !!disciplineId,
  });

  // Mutation para adicionar/atualizar e-book interativo
  const ebookMutation = useMutation({
    mutationFn: (data: InteractiveEbookFormValues) => {
      // Se já existe um e-book, faz update, senão cria
      const method = interactiveEbook && interactiveEbook.id ? "PUT" : "POST";
      return apiRequest(method, buildDisciplineInteractiveEbookApiUrl(disciplineId), data);
    },
    onSuccess: () => {
      toast({
        title: interactiveEbook && interactiveEbook.id ? "E-book interativo atualizado com sucesso" : "E-book interativo adicionado com sucesso",
        description: interactiveEbook && interactiveEbook.id ? "As alterações foram salvas." : "O e-book interativo foi vinculado à disciplina.",
        variant: "default",
      });
      setIsDialogOpen(false);
      setIsEditDialogOpen(false);
      form.reset();
      // Recarrega os dados do e-book interativo
      queryClient.invalidateQueries({ queryKey: [buildDisciplineInteractiveEbookApiUrl(disciplineId)] });
      refetchEbook();
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar e-book interativo",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir e-book interativo
  const deleteEbookMutation = useMutation({
    mutationFn: () => {
      return apiRequest("DELETE", buildDisciplineInteractiveEbookApiUrl(disciplineId));
    },
    onSuccess: () => {
      toast({
        title: "E-book interativo excluído com sucesso",
        description: "O e-book interativo foi removido da disciplina.",
        variant: "default",
      });
      // Recarrega os dados do e-book interativo
      queryClient.invalidateQueries({ queryKey: [buildDisciplineInteractiveEbookApiUrl(disciplineId)] });
      refetchEbook();
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir e-book interativo",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Formulário para adição e edição de e-book interativo
  const form = useForm<InteractiveEbookFormValues>({
    resolver: zodResolver(interactiveEbookFormSchema),
    defaultValues: {
      type: "link",
      url: "",
      title: "",
      description: "",
      embedCode: "",
    },
  });

  // Para edição, atualiza o formulário com os dados do e-book selecionado
  const handleEditEbook = (ebookData: InteractiveEbookType) => {
    setSelectedEbook(ebookData);
    form.reset({
      type: ebookData.type || "link",
      url: ebookData.url || "",
      title: ebookData.title || "",
      description: ebookData.description || "",
      embedCode: ebookData.embedCode || "",
    });
    setIsEditDialogOpen(true);
  };

  const onSubmit = (data: InteractiveEbookFormValues) => {
    // Validação adicional para código de incorporação
    if (data.type === "embed" && data.embedCode) {
      if (!isValidEmbedCode(data.embedCode)) {
        toast({
          title: "Código de incorporação inválido",
          description: "O código deve conter um iframe e não ter scripts maliciosos.",
          variant: "destructive",
        });
        return;
      }
    }
    
    ebookMutation.mutate(data);
  };

  const handleDeleteEbook = () => {
    if (confirm("Tem certeza que deseja excluir este e-book interativo?")) {
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

  const handlePreviewEmbedCode = () => {
    const embedCode = form.watch("embedCode");
    if (embedCode && isValidEmbedCode(embedCode)) {
      setPreviewHtml(embedCode);
    } else {
      toast({
        title: "Código de incorporação inválido",
        description: "O código deve conter um iframe e não ter scripts maliciosos.",
        variant: "destructive",
      });
    }
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

    if (interactiveEbook && interactiveEbook.available) {
      // Exibe o e-book interativo configurado
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-medium text-lg">{interactiveEbook.title || "E-book interativo da disciplina"}</h3>
              {interactiveEbook.description && (
                <p className="text-sm text-gray-600 mt-1">{interactiveEbook.description}</p>
              )}
              <div className="flex items-center mt-2 text-sm text-gray-500">
                {interactiveEbook.type === "link" ? (
                  <>
                    <Globe className="h-4 w-4 mr-1" />
                    <span>Link externo interativo</span>
                  </>
                ) : interactiveEbook.type === "embed" ? (
                  <>
                    <Code className="h-4 w-4 mr-1" />
                    <span>Código incorporado</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-1" />
                    <span>Conteúdo HTML5 hospedado</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleEditEbook(interactiveEbook)}
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
            {interactiveEbook.type === "link" && (
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Globe className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-sm font-medium">
                    {new URL(interactiveEbook.url || "").hostname}
                  </span>
                </div>
                
                <Button 
                  variant="default" 
                  size="sm" 
                  asChild
                >
                  <a href={interactiveEbook.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Abrir conteúdo interativo
                  </a>
                </Button>
              </div>
            )}
            
            {interactiveEbook.type === "embed" && (
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Visualização do conteúdo incorporado</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditEbook(interactiveEbook)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar código
                  </Button>
                </div>
                <div 
                  className="w-full aspect-video border rounded bg-white"
                  dangerouslySetInnerHTML={{ __html: interactiveEbook.embedCode || "" }}
                />
              </div>
            )}
            
            {interactiveEbook.type === "upload" && (
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <BookText className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-sm font-medium">
                    Conteúdo HTML5 interativo
                  </span>
                </div>
                
                <Button 
                  variant="default" 
                  size="sm" 
                  asChild
                >
                  <a href={interactiveEbook.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Abrir conteúdo interativo
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // Caso não tenha e-book interativo configurado
    return (
      <div className="text-center py-8">
        <BookText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <h3 className="text-lg font-medium text-gray-900">Nenhum e-book interativo adicionado</h3>
        <p className="text-gray-500 mt-1 mb-4">
          Adicione um e-book interativo (HTML5, incorporação ou link externo) para esta disciplina
        </p>
        <Button onClick={() => setIsDialogOpen(true)}>
          Adicionar E-book Interativo
        </Button>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">E-book Interativo</CardTitle>
            <CardDescription>
              Adicione um e-book interativo para proporcionar uma experiência imersiva
            </CardDescription>
          </div>
          
          {interactiveEbook && interactiveEbook.available && (
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
      
      {/* Diálogo para adicionar/editar e-book interativo */}
      <Dialog 
        open={isDialogOpen || isEditDialogOpen} 
        onOpenChange={(open) => {
          if (isDialogOpen) setIsDialogOpen(open);
          if (isEditDialogOpen) setIsEditDialogOpen(open);
          if (!open) setPreviewHtml(null);
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Editar E-book Interativo" : "Adicionar E-book Interativo"}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen 
                ? "Edite as informações do e-book interativo atual."
                : "Adicione um e-book interativo para esta disciplina."
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
                    <FormLabel>Título do E-book Interativo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Material Interativo de Estudo" {...field} />
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
                        placeholder="Breve descrição do conteúdo interativo" 
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
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Tipo de Conteúdo Interativo</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="link" id="type-link" />
                          <Label htmlFor="type-link" className="flex items-center">
                            <LinkIcon className="h-4 w-4 mr-2" />
                            Link para conteúdo interativo externo
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="embed" id="type-embed" />
                          <Label htmlFor="type-embed" className="flex items-center">
                            <Code className="h-4 w-4 mr-2" />
                            Incorporar conteúdo (iframe/código HTML)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="upload" id="type-upload" />
                          <Label htmlFor="type-upload" className="flex items-center">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload de conteúdo HTML5 interativo
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Campos condicionais baseados no tipo selecionado */}
              {form.watch("type") === "link" && (
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL do Conteúdo Interativo</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://h5p.org/..." 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {form.watch("type") === "embed" && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="embedCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código de Incorporação (iframe)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder='<iframe src="https://example.com/embed" width="100%" height="400" frameborder="0" allowfullscreen></iframe>' 
                            {...field}
                            value={field.value || ""}
                            className="font-mono text-sm h-32"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handlePreviewEmbedCode}
                      disabled={!form.watch("embedCode")}
                    >
                      Visualizar
                    </Button>
                  </div>
                  
                  {previewHtml && (
                    <div className="border rounded p-2">
                      <p className="text-xs text-gray-500 mb-2">Pré-visualização:</p>
                      <div 
                        className="w-full aspect-video bg-white"
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {form.watch("type") === "upload" && (
                <div className="space-y-2">
                  <FormLabel>Upload de conteúdo HTML5</FormLabel>
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Input
                      id="ebook-upload"
                      type="file"
                      accept=".html,.htm,.zip"
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
                  {form.watch("url") && form.watch("type") === "upload" && !isUploading && (
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <BookText className="h-4 w-4" />
                      <span>Conteúdo HTML5 enviado com sucesso</span>
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
                    setPreviewHtml(null);
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
                  {isEditDialogOpen ? "Salvar alterações" : "Adicionar E-book Interativo"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}