import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Discipline } from "@shared/schema";
import { updateApostila, removeApostila } from "@/api/disciplines";
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
import { AlertCircle, ExternalLink, FileText, Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Schema de validação para a apostila
const apostilaSchema = z.object({
  url: z.string().url("Informe uma URL válida para a apostila"),
});

interface ApostilaManagerProps {
  discipline: Discipline;
}

export function ApostilaManager({ discipline }: ApostilaManagerProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verifica se a apostila existe
  const hasApostila = Boolean(discipline.apostilaUrl);

  // Inicializa o formulário
  const form = useForm<z.infer<typeof apostilaSchema>>({
    resolver: zodResolver(apostilaSchema),
    defaultValues: {
      url: discipline.apostilaUrl || "",
    },
  });

  // Função para adicionar/atualizar apostila
  const handleSaveApostila = async (values: z.infer<typeof apostilaSchema>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await updateApostila(discipline.id.toString(), values.url);
      
      // Invalida o cache para atualizar os dados
      queryClient.invalidateQueries({ queryKey: [`/api/admin/disciplines/${discipline.id}/content`] });
      
      toast({
        title: "Apostila salva",
        description: "A apostila foi salva com sucesso.",
        variant: "default",
      });
    } catch (error) {
      console.error("Erro ao salvar apostila:", error);
      setError("Ocorreu um erro ao salvar a apostila. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Função para remover apostila
  const handleRemoveApostila = async () => {
    if (!window.confirm("Tem certeza que deseja remover esta apostila?")) {
      return;
    }

    setIsRemoving(true);
    setError(null);
    
    try {
      await removeApostila(discipline.id.toString());
      
      // Invalida o cache para atualizar os dados
      queryClient.invalidateQueries({ queryKey: [`/api/admin/disciplines/${discipline.id}/content`] });
      
      toast({
        title: "Apostila removida",
        description: "A apostila foi removida com sucesso.",
        variant: "default",
      });

      // Reseta o formulário
      form.reset({
        url: "",
      });
    } catch (error) {
      console.error("Erro ao remover apostila:", error);
      setError("Ocorreu um erro ao remover a apostila. Tente novamente.");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Card className={hasApostila ? "border-amber-200" : ""}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Apostila (PDF)
          {hasApostila && (
            <span className="ml-2 text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
              Adicionada
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {hasApostila
            ? "Edite ou remova a apostila desta disciplina"
            : "Adicione uma apostila para esta disciplina"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSaveApostila)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Apostila (PDF)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Link completo para o arquivo PDF da apostila
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between pt-2">
              {hasApostila && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(discipline.apostilaUrl || "#", "_blank")}
                  disabled={isRemoving || isLoading}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Visualizar
                </Button>
              )}
              
              <div className="ml-auto flex space-x-2">
                {hasApostila && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveApostila}
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
                      {hasApostila ? (
                        <>
                          <FileText className="h-4 w-4 mr-1" />
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