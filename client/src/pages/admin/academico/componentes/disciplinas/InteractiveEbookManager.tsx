import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { EbookViewer } from "@/components/EbookViewer";
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
import {
  Book,
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
import { Textarea } from "@/components/ui/textarea";
import { InteractiveEbook, InteractiveEbookType } from "@/types/pedagogico";
import { getInteractiveEbook, saveInteractiveEbook, deleteInteractiveEbook } from "@/api/pedagogico";
import { getEmbedUrl, detectUrlType } from "@/utils/url-converter";

const interactiveEbookFormSchema = z.object({
  type: z.enum(["embed", "iframe", "link", "h5p"]),
  title: z.string().min(3, { message: "O título deve ter pelo menos 3 caracteres" }),
  description: z.string().optional(),
  url: z.string().url({ message: "Insira uma URL válida" }).optional(),
  embedCode: z.string().optional(),
}).refine(data => {
  // Se o tipo for link, a URL é obrigatória
  if (data.type === 'link' && !data.url) {
    return false;
  }
  // Se o tipo for embed ou iframe, o código de incorporação é obrigatório
  if ((data.type === 'embed' || data.type === 'iframe') && !data.embedCode) {
    return false;
  }
  return true;
}, {
  message: "Forneça os campos necessários de acordo com o tipo selecionado",
  path: ['type'],
});

type InteractiveEbookFormValues = z.infer<typeof interactiveEbookFormSchema>;

export function InteractiveEbookManager({ disciplineId }: { disciplineId: number | string }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEbook, setSelectedEbook] = useState<InteractiveEbook | null>(null);
  const queryClient = useQueryClient();

  // Função para construir a URL da API
  const buildDisciplineInteractiveEbookApiUrl = (disciplineId: number | string) => {
    return `/api/disciplines/${disciplineId}/interactive-ebook`;
  };

  // Busca os dados do e-book interativo da disciplina usando a API centralizada
  const {
    data: ebook,
    isLoading: isEbookLoading,
    refetch: refetchEbook,
  } = useQuery({
    queryKey: [buildDisciplineInteractiveEbookApiUrl(disciplineId)],
    queryFn: () => getInteractiveEbook(disciplineId),
    enabled: !!disciplineId,
  });

  // Mutation para adicionar/atualizar e-book interativo usando a API centralizada
  const ebookMutation = useMutation({
    mutationFn: (data: InteractiveEbookFormValues) => {
      const ebookData: Partial<InteractiveEbook> = {
        ...data,
        disciplineId: disciplineId,
        id: ebook && 'id' in ebook ? ebook.id : undefined // Preserva o ID caso esteja editando
      };
      return saveInteractiveEbook(disciplineId, ebookData);
    },
    onSuccess: () => {
      const isUpdate = !!(ebook && 'id' in ebook && ebook.id);
      toast({
        title: isUpdate ? "E-book interativo atualizado com sucesso" : "E-book interativo adicionado com sucesso",
        description: isUpdate ? "As alterações foram salvas." : "O e-book interativo foi vinculado à disciplina.",
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
        description: `Ocorreu um erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir e-book interativo usando a API centralizada
  const deleteEbookMutation = useMutation({
    mutationFn: () => {
      return deleteInteractiveEbook(disciplineId);
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
        description: `Ocorreu um erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    },
  });

  // Formulário para adição e edição de e-book interativo
  const form = useForm<InteractiveEbookFormValues>({
    resolver: zodResolver(interactiveEbookFormSchema),
    defaultValues: {
      type: "link",
      title: "",
      description: "",
      url: "",
      embedCode: "",
    },
  });

  // Para edição, atualiza o formulário com os dados do e-book interativo selecionado
  const handleEditEbook = (ebookData: InteractiveEbook | Record<string, any>) => {
    setSelectedEbook(ebookData as InteractiveEbook);
    form.reset({
      type: ebookData?.type as InteractiveEbookType || "link",
      title: ebookData?.title || "",
      description: ebookData?.description || "",
      url: ebookData?.url || "",
      embedCode: ebookData?.embedCode || "",
    });
    setIsEditDialogOpen(true);
  };

  const onSubmit = (data: InteractiveEbookFormValues) => {
    ebookMutation.mutate(data);
  };

  const handleDeleteEbook = () => {
    if (confirm("Tem certeza que deseja excluir este e-book interativo?")) {
      deleteEbookMutation.mutate();
    }
  };

  // Função para exibir um tipo de e-book interativo de forma amigável
  const getEbookTypeLabel = (type: InteractiveEbookType): string => {
    const types: Record<InteractiveEbookType, string> = {
      link: "Link externo",
      embed: "Código embutido",
      iframe: "Frame embutido",
      h5p: "Conteúdo H5P",
    };
    return types[type] || "Outro";
  };
  
  // Usamos a biblioteca centralizada url-converter.ts para converter URLs

  const renderEbookContent = () => {
    if (isEbookLoading) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-10 w-1/2" />
        </div>
      );
    }

    if (ebook && ('available' in ebook ? ebook.available : true)) {
      // Exibe o e-book interativo configurado
      
      // Normalizar os dados para garantir compatibilidade de campos
      const normalizedEbook = {
        ...ebook,
        // Garantir que temos o campo url (pode vir como interactiveEbookUrl da API)
        url: ebook.url || (ebook as any).interactiveEbookUrl || "",
        // Garantir que temos o campo title (pode vir como name da API)
        title: ebook.title || (ebook as any).name || "",
      };
      
      console.log("Dados do e-book recebidos:", ebook);
      console.log("Dados do e-book normalizados:", normalizedEbook);
      
      const ebookObj = normalizedEbook as InteractiveEbook;
      
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-medium text-lg">{ebookObj.title || "E-book interativo"}</h3>
              {ebookObj.description && (
                <p className="text-sm text-gray-600 mt-1">{ebookObj.description}</p>
              )}
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <Book className="h-4 w-4 mr-1" />
                <span>{getEbookTypeLabel(ebookObj.type || 'link')}</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleEditEbook(ebookObj)}
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
            {ebookObj.type === 'link' && ebookObj.url && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium">Link para conteúdo interativo</span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild
                    >
                      <a href={ebookObj.url || "#"} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Abrir em nova aba
                      </a>
                    </Button>
                  </div>
                </div>
                
                <div className="bg-gray-100 p-2 rounded-md text-xs overflow-auto mb-3">
                  <code>{ebookObj.url}</code>
                </div>
                
                <div className="border rounded p-4 bg-white">
                  <div className="text-center text-sm text-gray-500 mb-2">
                    Visualização integrada do conteúdo:
                  </div>
                  
                  {/* Debug info para ajudar a resolver problemas */}
                  <div className="text-xs text-blue-500 mb-2">
                    URL Original: {ebookObj.url || ""}
                  </div>
                  
                  {/* Usando o componente EbookViewer para renderização dinâmica */}
                  <EbookViewer url={ebookObj.url || ""} title={ebookObj.title || "Conteúdo interativo"} />
                </div>
              </div>
            )}
            
            {(ebookObj.type === 'embed' || ebookObj.type === 'iframe') && ebookObj.embedCode && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium">Código de incorporação</span>
                </div>
                
                <div className="bg-gray-100 p-3 rounded-md text-sm overflow-auto mb-4">
                  <code className="whitespace-pre-wrap">{ebookObj.embedCode}</code>
                </div>
                
                <div className="border rounded p-4 bg-white">
                  <div className="text-center text-sm text-gray-500 mb-2">
                    Pré-visualização (se disponível):
                  </div>
                  
                  <div 
                    className="w-full min-h-[300px] bg-gray-50 rounded" 
                    dangerouslySetInnerHTML={{ __html: ebookObj.embedCode || "" }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // Caso não tenha e-book interativo configurado
    return (
      <div className="text-center py-8">
        <Book className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <h3 className="text-lg font-medium text-gray-900">Nenhum e-book interativo adicionado</h3>
        <p className="text-gray-500 mt-1 mb-4">
          Adicione um e-book interativo ou conteúdo embutido nesta disciplina
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
        <CardTitle className="text-xl">E-book Interativo</CardTitle>
        <CardDescription>
          Adicione conteúdos interativos, documentos incorporados ou websites
        </CardDescription>
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
        }}
      >
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Editar E-book Interativo" : "Adicionar E-book Interativo"}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen 
                ? "Edite as informações do e-book interativo atual."
                : "Adicione um e-book interativo ou conteúdo embutido para esta disciplina."
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
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Exercícios Interativos" {...field} />
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
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Tipo de Conteúdo</FormLabel>
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
                            Link externo
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="embed" id="type-embed" />
                          <Label htmlFor="type-embed" className="flex items-center">
                            <Code className="h-4 w-4 mr-2" />
                            Código embutido
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="iframe" id="type-iframe" />
                          <Label htmlFor="type-iframe" className="flex items-center">
                            <Code className="h-4 w-4 mr-2" />
                            Frame embutido (iframe)
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {form.watch("type") === "link" && (
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL do Conteúdo</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://..." 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground mt-1">
                        Suporta links do Google Drive, Dropbox, OneDrive, YouTube, Vimeo e links diretos de PDF/MP4
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {(form.watch("type") === "embed" || form.watch("type") === "iframe") && (
                <FormField
                  control={form.control}
                  name="embedCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de Incorporação</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={form.watch("type") === "iframe" ? 
                            '<iframe src="https://..." width="100%" height="400" frameborder="0"></iframe>' : 
                            '<div class="embed-responsive">...</div>'
                          } 
                          className="min-h-[150px] font-mono text-sm"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                  disabled={ebookMutation.isPending}
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