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
import { FileText, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  ebookFormSchema, // Reutilizando o schema de ebook para apostila (ambos são apenas URL)
  Discipline
} from "@/types/discipline";
import { z } from "zod";
import { addPdfApostila, removePdfApostila } from "@/api/disciplines";
import { queryClient } from "@/lib/queryClient";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type ApostilaManagerProps = {
  discipline: Discipline;
};

export function ApostilaManager({ discipline }: ApostilaManagerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Determinar se a apostila já existe
  const hasApostila = !!discipline.apostilaPdfUrl;
  
  const form = useForm<z.infer<typeof ebookFormSchema>>({
    resolver: zodResolver(ebookFormSchema),
    defaultValues: {
      url: discipline.apostilaPdfUrl || "",
    },
  });
  
  // Função para adicionar apostila PDF
  const handleAddApostila = async (data: z.infer<typeof ebookFormSchema>) => {
    setIsSubmitting(true);
    try {
      await addPdfApostila(discipline.id, data);
      
      toast({
        title: "Apostila adicionada",
        description: "A apostila PDF foi adicionada com sucesso à disciplina.",
        variant: "default",
      });
      
      // Atualizar os dados no cache
      queryClient.invalidateQueries({ queryKey: [`/api/admin/disciplines/${discipline.id}/content`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/disciplines/${discipline.id}`] });
    } catch (error) {
      console.error("Erro ao adicionar apostila:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a apostila PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Função para remover apostila PDF
  const handleRemoveApostila = async () => {
    setIsSubmitting(true);
    try {
      await removePdfApostila(discipline.id);
      
      toast({
        title: "Apostila removida",
        description: "A apostila PDF foi removida da disciplina.",
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
      console.error("Erro ao remover apostila:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a apostila PDF. Tente novamente.",
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
          <FileText className="h-5 w-5" />
          Apostila PDF
        </CardTitle>
        <CardDescription>
          {hasApostila 
            ? "Configure ou substitua a apostila PDF desta disciplina"
            : "Adicione uma apostila PDF para esta disciplina"}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleAddApostila)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Apostila PDF</FormLabel>
                  <FormControl>
                    <Input placeholder="https://" {...field} />
                  </FormControl>
                  <FormDescription>
                    Cole o link da apostila em formato PDF. Pode ser um link do Google Drive, OneDrive ou outro serviço de hospedagem.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            {hasApostila ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    type="button"
                    className="text-destructive"
                    disabled={isSubmitting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover Apostila
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação removerá a apostila PDF da disciplina. 
                      Isso pode afetar o acesso dos alunos ao material.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleRemoveApostila}
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
                  {hasApostila ? "Atualizar Apostila" : "Adicionar Apostila"}
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}