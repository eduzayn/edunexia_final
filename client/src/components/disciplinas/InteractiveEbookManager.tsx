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
  Book, 
  Plus, 
  ExternalLink, 
  Upload, 
  LayoutGrid, 
  Edit, 
  Trash, 
  Loader2,
  Layers
} from "lucide-react";

interface InteractiveEbookManagerProps {
  disciplineId: number;
  discipline: Discipline;
}

// Schema para validação dos formulários
const interactiveEbookFormSchema = z.object({
  title: z.string().min(3, { message: "Título deve ter pelo menos 3 caracteres" }),
  description: z.string().min(10, { message: "Descrição deve ter pelo menos 10 caracteres" }),
  url: z.string().url({ message: "URL inválida" }),
});

type InteractiveEbookFormValues = z.infer<typeof interactiveEbookFormSchema>;

export function InteractiveEbookManager({ disciplineId, discipline }: InteractiveEbookManagerProps) {
  const { toast } = useToast();
  const [isEbookDialogOpen, setIsEbookDialogOpen] = useState(false);
  const [isEbookEditDialogOpen, setIsEbookEditDialogOpen] = useState(false);
  
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
        return data || { ebookInterativoUrl: null, id: disciplineId };
      } catch (error) {
        console.error("Erro ao buscar e-book da disciplina:", error);
        return { ebookInterativoUrl: null, id: disciplineId };
      }
    },
  });

  // Mutation para adicionar e-book interativo
  const addInteractiveEbookMutation = useMutation({
    mutationFn: async (data: InteractiveEbookFormValues) => {
      return apiRequest('POST', buildDisciplineEbookApiUrl(disciplineId), {
        ...data,
        type: 'interactive'
      });
    },
    onSuccess: () => {
      toast({
        title: "E-book interativo adicionado com sucesso",
        description: "O e-book interativo foi vinculado à disciplina.",
        variant: "default",
      });
      setIsEbookDialogOpen(false);
      // Recarrega as informações do e-book
      queryClient.invalidateQueries({ queryKey: [buildDisciplineEbookApiUrl(disciplineId)] });
      refetchEbook();
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar e-book interativo",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mutation para editar e-book interativo
  const editInteractiveEbookMutation = useMutation({
    mutationFn: async (data: InteractiveEbookFormValues) => {
      return apiRequest('PUT', buildDisciplineEbookApiUrl(disciplineId), {
        ...data,
        type: 'interactive'
      });
    },
    onSuccess: () => {
      toast({
        title: "E-book interativo atualizado com sucesso",
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
        title: "Erro ao atualizar e-book interativo",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mutation para remover e-book interativo
  const deleteInteractiveEbookMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `${buildDisciplineEbookApiUrl(disciplineId)}/interactive`);
    },
    onSuccess: () => {
      toast({
        title: "E-book interativo removido com sucesso",
        description: "O e-book interativo foi removido da disciplina.",
        variant: "default",
      });
      // Recarrega as informações do e-book
      queryClient.invalidateQueries({ queryKey: [buildDisciplineEbookApiUrl(disciplineId)] });
      refetchEbook();
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover e-book interativo",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Formulário para adicionar e-book interativo
  const form = useForm<InteractiveEbookFormValues>({
    resolver: zodResolver(interactiveEbookFormSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
    },
  });

  // Formulário para editar e-book interativo
  const editForm = useForm<InteractiveEbookFormValues>({
    resolver: zodResolver(interactiveEbookFormSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
    },
  });

  const onSubmit = (data: InteractiveEbookFormValues) => {
    addInteractiveEbookMutation.mutate(data);
  };

  const onEditSubmit = (data: InteractiveEbookFormValues) => {
    editInteractiveEbookMutation.mutate(data);
  };

  const handleEditEbook = () => {
    if (ebook && ebook.ebookInterativoUrl) {
      // Preenche o formulário com os dados do e-book interativo
      editForm.reset({
        title: ebook.interactiveTitle || "E-book interativo da disciplina",
        description: ebook.interactiveDescription || "Material interativo para a disciplina",
        url: ebook.ebookInterativoUrl || "",
      });
      
      setIsEbookEditDialogOpen(true);
    }
  };

  const handleDeleteEbook = () => {
    if (confirm("Tem certeza que deseja remover este e-book interativo da disciplina?")) {
      deleteInteractiveEbookMutation.mutate();
    }
  };

  const hasInteractiveEbook = ebook && ebook.ebookInterativoUrl;
  
  // Identifica o tipo de e-book interativo (Google Drive, link externo, etc.)
  const getEbookType = (url: string) => {
    if (url.includes('drive.google.com')) {
      return 'Google Drive';
    } else if (url.includes('scorm') || url.includes('.zip')) {
      return 'SCORM';
    } else if (url.includes('h5p')) {
      return 'H5P';
    } else {
      return 'Link externo';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl">E-book Interativo</CardTitle>
          <CardDescription>Adicione conteúdo interativo (HTML5, SCORM, H5P)</CardDescription>
        </div>
        {!hasInteractiveEbook && (
          <Button 
            size="sm" 
            onClick={() => setIsEbookDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEbookLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : hasInteractiveEbook ? (
          <div className="border rounded-md p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Layers className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <h3 className="font-medium">{ebook.interactiveTitle || "E-book interativo da disciplina"}</h3>
                  <p className="text-sm text-gray-600">{ebook.interactiveDescription || "Material interativo para a disciplina"}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  asChild
                >
                  <a href={ebook.ebookInterativoUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
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
              <span>Tipo: {getEbookType(ebook.ebookInterativoUrl)}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <LayoutGrid className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">Nenhum conteúdo interativo</h3>
            <p className="text-gray-500 mt-1">Adicione conteúdo interativo como SCORM, H5P ou plataformas externas</p>
          </div>
        )}
      </CardContent>

      {/* Diálogo para adicionar e-book interativo */}
      <Dialog open={isEbookDialogOpen} onOpenChange={setIsEbookDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar conteúdo interativo</DialogTitle>
            <DialogDescription>
              Vincule conteúdo interativo HTML5, SCORM, H5P ou outras plataformas
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do conteúdo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Material interativo da disciplina" {...field} />
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
                        placeholder="Breve descrição do conteúdo interativo" 
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
                    <FormLabel>URL do conteúdo</FormLabel>
                    <FormControl>
                      <Input placeholder="https://" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEbookDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={addInteractiveEbookMutation.isPending}>
                  {addInteractiveEbookMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Adicionar conteúdo
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar e-book interativo */}
      <Dialog open={isEbookEditDialogOpen} onOpenChange={setIsEbookEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar conteúdo interativo</DialogTitle>
            <DialogDescription>
              Modifique as informações do conteúdo interativo.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do conteúdo</FormLabel>
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
                    <FormLabel>URL do conteúdo</FormLabel>
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
                <Button type="submit" disabled={editInteractiveEbookMutation.isPending}>
                  {editInteractiveEbookMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar alterações
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}