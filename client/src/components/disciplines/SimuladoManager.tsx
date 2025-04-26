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
import { ClipboardList, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Discipline } from "@/types/discipline";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

// Esquema para validação do formulário de simulado
const simuladoFormSchema = z.object({
  title: z.string().min(3, { message: "O título deve ter pelo menos 3 caracteres" }),
  description: z.string().optional(),
  timeLimit: z.coerce.number().min(5, { message: "O tempo mínimo é de 5 minutos" }).optional(),
});

type SimuladoManagerProps = {
  discipline: Discipline;
};

export function SimuladoManager({ discipline }: SimuladoManagerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Determinar se o simulado já existe
  const hasSimulado = false; // Substituir por lógica real quando a API estiver pronta
  const simuladoData = null; // Substituir por dados reais quando a API estiver pronta
  
  const form = useForm<z.infer<typeof simuladoFormSchema>>({
    resolver: zodResolver(simuladoFormSchema),
    defaultValues: {
      title: simuladoData?.title || "",
      description: simuladoData?.description || "",
      timeLimit: simuladoData?.timeLimit || 60,
    },
  });
  
  // Função para adicionar simulado
  const handleAddSimulado = async (data: z.infer<typeof simuladoFormSchema>) => {
    setIsSubmitting(true);
    try {
      // Adicionar lógica real quando a API estiver pronta
      // await saveSimulado(discipline.id, data);
      
      toast({
        title: "Simulado adicionado",
        description: "O simulado foi adicionado com sucesso à disciplina.",
        variant: "default",
      });
      
      // Atualizar os dados no cache
      queryClient.invalidateQueries({ queryKey: [`/api/admin/disciplines/${discipline.id}/content`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/disciplines/${discipline.id}`] });
    } catch (error) {
      console.error("Erro ao adicionar simulado:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o simulado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Função para remover simulado
  const handleRemoveSimulado = async () => {
    setIsSubmitting(true);
    try {
      // Adicionar lógica real quando a API estiver pronta
      // await deleteSimulado(discipline.id);
      
      toast({
        title: "Simulado removido",
        description: "O simulado foi removido com sucesso da disciplina.",
        variant: "default",
      });
      
      // Atualizar os dados no cache
      queryClient.invalidateQueries({ queryKey: [`/api/admin/disciplines/${discipline.id}/content`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/disciplines/${discipline.id}`] });
    } catch (error) {
      console.error("Erro ao remover simulado:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o simulado. Tente novamente.",
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
      description: "O gerenciamento de questões do simulado será implementado em breve.",
      variant: "default",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Simulado</CardTitle>
            <CardDescription>
              Configure o simulado para esta disciplina.
            </CardDescription>
          </div>
          {hasSimulado && (
            <Badge variant="outline" className="ml-auto">
              {simuladoData?.questions?.length || 0} questões
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hasSimulado ? (
          <div className="space-y-4">
            <div className="grid gap-1">
              <h3 className="text-sm font-medium">Título</h3>
              <p className="text-sm text-muted-foreground">{simuladoData?.title}</p>
            </div>
            
            {simuladoData?.description && (
              <div className="grid gap-1">
                <h3 className="text-sm font-medium">Descrição</h3>
                <p className="text-sm text-muted-foreground">{simuladoData?.description}</p>
              </div>
            )}
            
            {simuladoData?.timeLimit && (
              <div className="grid gap-1">
                <h3 className="text-sm font-medium">Tempo limite</h3>
                <p className="text-sm text-muted-foreground">{simuladoData?.timeLimit} minutos</p>
              </div>
            )}
            
            <div className="pt-4">
              <Button variant="outline" className="w-full" onClick={handleManageQuestions}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Gerenciar Questões
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddSimulado)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Simulado de Avaliação" {...field} />
                    </FormControl>
                    <FormDescription>
                      Título do simulado visível aos alunos.
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
                        placeholder="Ex: Este simulado avalia os conceitos fundamentais da disciplina..." 
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
                      Tempo máximo para conclusão do simulado.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" disabled={isSubmitting} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Criar Simulado
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
      {hasSimulado && (
        <CardFooter className="flex justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Remover Simulado
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso removerá permanentemente o simulado e todas as suas questões da disciplina.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleRemoveSimulado}
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