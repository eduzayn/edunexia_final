import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Discipline } from "@shared/schema";
import { 
  updateInteractiveEbook, 
  removeInteractiveEbook 
} from "@/api/disciplines";
import { queryClient } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
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
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, ExternalLink, Plus, Trash2 } from "lucide-react";

interface InteractiveEbookManagerProps {
  discipline: Discipline;
}

// Schema de validação para o e-book
const ebookSchema = z.object({
  url: z.string().url("Informe uma URL válida"),
});

export function InteractiveEbookManager({ discipline }: InteractiveEbookManagerProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Verifica se o e-book interativo existe
  const hasEbook = Boolean(discipline.ebookInterativoUrl);

  // Inicializa o formulário
  const form = useForm<z.infer<typeof ebookSchema>>({
    resolver: zodResolver(ebookSchema),
    defaultValues: {
      url: discipline.ebookInterativoUrl || "",
    },
  });

  // Função para adicionar/atualizar e-book
  const handleSaveEbook = async (values: z.infer<typeof ebookSchema>) => {
    setIsLoading(true);
    try {
      await updateInteractiveEbook(discipline.id.toString(), values.url);
      
      queryClient.invalidateQueries({ queryKey: [`/api/admin/disciplines/${discipline.id}/content`] });
      
      toast({
        title: "E-book interativo salvo",
        description: "O e-book interativo foi salvo com sucesso.",
        variant: "default",
      });
    } catch (error) {
      console.error("Erro ao salvar e-book interativo:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o e-book interativo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para remover e-book
  const handleRemoveEbook = async () => {
    if (!window.confirm("Tem certeza que deseja remover este e-book interativo?")) {
      return;
    }

    setIsRemoving(true);
    try {
      await removeInteractiveEbook(discipline.id.toString());
      
      queryClient.invalidateQueries({ queryKey: [`/api/admin/disciplines/${discipline.id}/content`] });
      
      toast({
        title: "E-book interativo removido",
        description: "O e-book interativo foi removido com sucesso.",
        variant: "default",
      });

      // Reseta o formulário
      form.reset({
        url: "",
      });
    } catch (error) {
      console.error("Erro ao remover e-book interativo:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao remover o e-book interativo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Card className={hasEbook ? "border-green-200" : ""}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center">
          <BookOpen className="h-5 w-5 mr-2" />
          E-book Interativo
          {hasEbook && (
            <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
              Adicionado
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {hasEbook
            ? "Edite ou remova o e-book interativo desta disciplina"
            : "Adicione um e-book interativo para esta disciplina"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSaveEbook)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do E-book Interativo</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Link completo para o e-book interativo (URL externa)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between pt-2">
              {hasEbook && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(discipline.ebookInterativoUrl || "#", "_blank")}
                  disabled={isRemoving || isLoading}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Visualizar
                </Button>
              )}
              
              <div className="ml-auto flex space-x-2">
                {hasEbook && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveEbook}
                    disabled={isRemoving || isLoading}
                  >
                    {isRemoving ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                        Removendo...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </>
                    )}
                  </Button>
                )}
                <Button type="submit" size="sm" disabled={isLoading || isRemoving}>
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      {hasEbook ? (
                        <>
                          <BookOpen className="h-4 w-4 mr-1" />
                          Atualizar
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}