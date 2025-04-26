import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "wouter";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { type Discipline } from "@shared/schema";
import { DisciplineFormData } from "@/types/discipline";

// Esquema de validação para o formulário
const formSchema = z.object({
  code: z.string()
    .min(2, "O código deve ter pelo menos 2 caracteres")
    .max(20, "O código deve ter no máximo 20 caracteres"),
  name: z.string()
    .min(3, "O nome deve ter pelo menos 3 caracteres")
    .max(100, "O nome deve ter no máximo 100 caracteres"),
  description: z.string()
    .min(5, "A descrição deve ter pelo menos 5 caracteres")
    .max(500, "A descrição deve ter no máximo 500 caracteres"),
  workload: z.coerce.number()
    .min(1, "A carga horária deve ser maior que zero")
    .max(500, "A carga horária deve ser no máximo 500 horas"),
  syllabus: z.string()
    .min(5, "A ementa deve ter pelo menos 5 caracteres")
    .max(2000, "A ementa deve ter no máximo 2000 caracteres"),
});

interface DisciplineFormProps {
  initialData?: Discipline;
  onSubmit: (data: DisciplineFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function DisciplineForm({ initialData, onSubmit, isSubmitting }: DisciplineFormProps) {
  const { toast } = useToast();
  const [_, navigate] = useNavigate();

  // Inicializa o formulário com valores padrão ou dados existentes
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: initialData?.code || "",
      name: initialData?.name || "",
      description: initialData?.description || "",
      workload: initialData?.workload || 60,
      syllabus: initialData?.syllabus || "",
    },
  });

  // Manipulador de envio do formulário
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await onSubmit(values);
      
      toast({
        title: initialData ? "Disciplina atualizada" : "Disciplina criada",
        description: initialData
          ? "A disciplina foi atualizada com sucesso."
          : "A disciplina foi criada com sucesso.",
        variant: "default",
      });

      // Redireciona para a lista de disciplinas após o sucesso
      setTimeout(() => {
        navigate("/admin/academico/disciplines");
      }, 1000);
    } catch (error) {
      console.error("Erro ao salvar disciplina:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar a disciplina. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Código da Disciplina */}
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: MAT101" {...field} />
                    </FormControl>
                    <FormDescription>
                      Código único da disciplina no sistema
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nome da Disciplina */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Matemática Básica" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nome completo da disciplina
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Descrição da Disciplina */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Breve descrição sobre a disciplina..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Uma breve descrição da disciplina que será exibida para os alunos
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Carga Horária */}
            <FormField
              control={form.control}
              name="workload"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carga Horária (horas)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="500" {...field} />
                  </FormControl>
                  <FormDescription>
                    Quantidade total de horas da disciplina
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ementa da Disciplina */}
            <FormField
              control={form.control}
              name="syllabus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ementa</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Conteúdo programático da disciplina..." 
                      className="min-h-[150px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Ementa completa com o conteúdo programático da disciplina
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/academico/disciplines")}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    {initialData ? "Atualizando..." : "Criando..."}
                  </>
                ) : (
                  initialData ? "Atualizar Disciplina" : "Criar Disciplina"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}