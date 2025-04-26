import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardCheck, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Discipline } from "@/types/discipline";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

// Esquema para validação do formulário de avaliação final
const avaliacaoFinalFormSchema = z.object({
  title: z.string().min(3, { message: "O título deve ter pelo menos 3 caracteres" }),
  description: z.string().optional(),
  timeLimit: z.coerce.number().min(5, { message: "O tempo mínimo é de 5 minutos" }).optional(),
  passingScore: z.coerce.number().min(0, { message: "A nota mínima não pode ser negativa" }).max(100, { message: "A nota máxima é 100" }),
  allowRetake: z.boolean().default(false),
  maxAttempts: z.coerce.number().min(1, { message: "O número mínimo de tentativas é 1" }).optional(),
  showExplanations: z.boolean().default(true),
});

type AvaliacaoFinalManagerProps = {
  discipline: Discipline;
};

export function AvaliacaoFinalManager({ discipline }: AvaliacaoFinalManagerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Determinar se a avaliação final já existe
  const hasAvaliacaoFinal = false; // Substituir por lógica real quando a API estiver pronta
  const avaliacaoData = null; // Substituir por dados reais quando a API estiver pronta
  
  const form = useForm<z.infer<typeof avaliacaoFinalFormSchema>>({
    resolver: zodResolver(avaliacaoFinalFormSchema),
    defaultValues: {
      title: avaliacaoData?.title || "",
      description: avaliacaoData?.description || "",
      timeLimit: avaliacaoData?.timeLimit || 60,
      passingScore: avaliacaoData?.passingScore || 70,
      allowRetake: avaliacaoData?.allowRetake !== undefined ? avaliacaoData?.allowRetake : true,
      maxAttempts: avaliacaoData?.maxAttempts || 3,
      showExplanations: avaliacaoData?.showExplanations !== undefined ? avaliacaoData?.showExplanations : true,
    },
  });
  
  // Função para adicionar avaliação final
  const handleAddAvaliacaoFinal = async (data: z.infer<typeof avaliacaoFinalFormSchema>) => {
    setIsSubmitting(true);
    try {
      // Adicionar lógica real quando a API estiver pronta
      // await saveAvaliacaoFinal(discipline.id, data);
      
      toast({
        title: "Avaliação final adicionada",
        description: "A avaliação final foi adicionada com sucesso à disciplina.",
        variant: "default",
      });
      
      // Atualizar os dados no cache
      queryClient.invalidateQueries({ queryKey: [`/api/admin/disciplines/${discipline.id}/content`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/disciplines/${discipline.id}`] });
    } catch (error) {
      console.error("Erro ao adicionar avaliação final:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a avaliação final. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Função para remover avaliação final
  const handleRemoveAvaliacaoFinal = async () => {
    setIsSubmitting(true);
    try {
      // Adicionar lógica real quando a API estiver pronta
      // await deleteAvaliacaoFinal(discipline.id);
      
      toast({
        title: "Avaliação final removida",
        description: "A avaliação final foi removida com sucesso da disciplina.",
        variant: "default",
      });
      
      // Atualizar os dados no cache
      queryClient.invalidateQueries({ queryKey: [`/api/admin/disciplines/${discipline.id}/content`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/disciplines/${discipline.id}`] });
    } catch (error) {
      console.error("Erro ao remover avaliação final:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a avaliação final. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Função para gerenciar questões (redirecionar para página de questões)
  const handleManageQuestions = () => {
    // Adicionar navegação para a página de gerenciamento de questões quando implementada
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "O gerenciamento de questões da avaliação final será implementado em breve.",
      variant: "default",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Avaliação Final</CardTitle>
            <CardDescription>
              Configure a avaliação final para esta disciplina.
            </CardDescription>
          </div>
          {hasAvaliacaoFinal && (
            <Badge variant="outline" className="ml-auto">
              {avaliacaoData?.questions?.length || 0} questões
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hasAvaliacaoFinal ? (
          <div className="space-y-4">
            <div className="grid gap-1">
              <h3 className="text-sm font-medium">Título</h3>
              <p className="text-sm text-muted-foreground">{avaliacaoData?.title}</p>
            </div>
            
            {avaliacaoData?.description && (
              <div className="grid gap-1">
                <h3 className="text-sm font-medium">Descrição</h3>
                <p className="text-sm text-muted-foreground">{avaliacaoData?.description}</p>
              </div>
            )}
            
            <div className="grid gap-1">
              <h3 className="text-sm font-medium">Nota para aprovação</h3>
              <p className="text-sm text-muted-foreground">{avaliacaoData?.passingScore}%</p>
            </div>
            
            {avaliacaoData?.timeLimit && (
              <div className="grid gap-1">
                <h3 className="text-sm font-medium">Tempo limite</h3>
                <p className="text-sm text-muted-foreground">{avaliacaoData?.timeLimit} minutos</p>
              </div>
            )}
            
            <div className="grid gap-1">
              <h3 className="text-sm font-medium">Configurações adicionais</h3>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-1">
                <li>
                  {avaliacaoData?.allowRetake 
                    ? `Permite ${avaliacaoData?.maxAttempts} tentativas` 
                    : "Não permite novas tentativas"
                  }
                </li>
                <li>
                  {avaliacaoData?.showExplanations 
                    ? "Exibe explicações após a conclusão" 
                    : "Não exibe explicações"
                  }
                </li>
              </ul>
            </div>
            
            <div className="pt-4">
              <Button variant="outline" className="w-full" onClick={handleManageQuestions}>
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Gerenciar Questões
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddAvaliacaoFinal)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Avaliação Final da Disciplina" {...field} />
                    </FormControl>
                    <FormDescription>
                      Título da avaliação visível aos alunos.
                    </FormDescription>
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
                        placeholder="Ex: Esta avaliação aborda todo o conteúdo da disciplina..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Descrição ou instruções para os alunos.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="timeLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tempo limite (em minutos)</FormLabel>
                      <FormControl>
                        <Input type="number" min="5" {...field} />
                      </FormControl>
                      <FormDescription>
                        Tempo máximo para conclusão.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="passingScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nota para aprovação (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" {...field} />
                      </FormControl>
                      <FormDescription>
                        Nota mínima para aprovação.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormField
                    control={form.control}
                    name="allowRetake"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Permitir novas tentativas
                          </FormLabel>
                          <FormDescription>
                            O aluno poderá refazer a avaliação caso não atinja a nota mínima.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                {form.watch("allowRetake") && (
                  <FormField
                    control={form.control}
                    name="maxAttempts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número máximo de tentativas</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormDescription>
                          Quantidade máxima de vezes que o aluno pode realizar a avaliação.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              <FormField
                control={form.control}
                name="showExplanations"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Exibir explicações
                      </FormLabel>
                      <FormDescription>
                        Mostra explicações das respostas corretas após a conclusão da avaliação.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <Button type="submit" disabled={isSubmitting} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Criar Avaliação Final
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
      {hasAvaliacaoFinal && (
        <CardFooter className="flex justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Remover Avaliação Final
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso removerá permanentemente a avaliação final e todas as suas questões da disciplina.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleRemoveAvaliacaoFinal}
                  disabled={isSubmitting}
                  className="bg-destructive text-destructive-foreground"
                >
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      )}
    </Card>
  );
}