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
import { Book, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  ebookFormSchema, 
  Discipline
} from "@/types/discipline";
import { z } from "zod";
import { addInteractiveEbook, removeInteractiveEbook } from "@/api/disciplines";
import { queryClient } from "@/lib/queryClient";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type InteractiveEbookManagerProps = {
  discipline: Discipline;
};

export function InteractiveEbookManager({ discipline }: InteractiveEbookManagerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Determinar se o e-book já existe
  const hasEbook = !!discipline.ebookInterativoUrl;
  
  const form = useForm<z.infer<typeof ebookFormSchema>>({
    resolver: zodResolver(ebookFormSchema),
    defaultValues: {
      url: discipline.ebookInterativoUrl || "",
    },
  });
  
  // Função para adicionar e-book interativo
  const handleAddEbook = async (data: z.infer<typeof ebookFormSchema>) => {
    setIsSubmitting(true);
    try {
      await addInteractiveEbook(discipline.id, data);
      
      toast({
        title: "E-book adicionado",
        description: "O e-book interativo foi adicionado com sucesso à disciplina.",
        variant: "default",
      });
      
      // Atualizar os dados no cache
      queryClient.invalidateQueries({ queryKey: [`/api/admin/disciplines/${discipline.id}/content`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/disciplines/${discipline.id}`] });
    } catch (error) {
      console.error("Erro ao adicionar e-book:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o e-book interativo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Função para remover e-book interativo
  const handleRemoveEbook = async () => {
    setIsSubmitting(true);
    try {
      await removeInteractiveEbook(discipline.id);
      
      toast({
        title: "E-book removido",
        description: "O e-book interativo foi removido da disciplina.",
        variant: "default",
      });
      
      // Resetar formulário
      form.reset({
        url: "",
      });
      
      // Atualizar os dados no cache
      queryClient.invalidateQueries({ queryKey: [`/api/admin/disciplines/${discipline.id}/content`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/disciplines/${discipline.id}`] });
    } catch (error) {
      console.error("Erro ao remover e-book:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o e-book interativo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Book className="h-5 w-5" />
          E-book Interativo
        </CardTitle>
        <CardDescription>
          {hasEbook 
            ? "Configure ou substitua o e-book interativo desta disciplina"
            : "Adicione um e-book interativo para esta disciplina"}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleAddEbook)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do E-book Interativo</FormLabel>
                  <FormControl>
                    <Input placeholder="https://" {...field} />
                  </FormControl>
                  <FormDescription>
                    Cole o link do e-book interativo. Pode ser um link do Google Drive, OneDrive ou outro serviço de hospedagem.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            {hasEbook ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    type="button"
                    className="text-destructive"
                    disabled={isSubmitting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover E-book
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação removerá o e-book interativo da disciplina. 
                      Esta ação pode afetar o status de completude da disciplina.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleRemoveEbook}
                    >
                      Remover
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <div></div> // Espaçador para manter o layout
            )}
            
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {hasEbook ? "Atualizar E-book" : "Adicionar E-book"}
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}