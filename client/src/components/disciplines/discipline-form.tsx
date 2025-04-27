import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "wouter";
import { DisciplineFormData } from "@/types/discipline";

// Schema de validação para o formulário
const disciplineFormSchema = z.object({
  code: z.string().min(3, "O código deve ter pelo menos 3 caracteres").max(20, "O código não pode exceder 20 caracteres"),
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres").max(100, "O nome não pode exceder 100 caracteres"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  workload: z.coerce.number().min(1, "A carga horária deve ser um número positivo"),
  syllabus: z.string().optional()
});

interface DisciplineFormProps {
  initialData?: DisciplineFormData;
  onSubmit: (data: DisciplineFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function DisciplineForm({
  initialData,
  onSubmit,
  isSubmitting
}: DisciplineFormProps) {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Definir valores padrão
  const defaultValues: DisciplineFormData = initialData || {
    code: "",
    name: "",
    description: "",
    workload: 60,
    syllabus: ""
  };

  // Inicializar formulário com React Hook Form
  const form = useForm<DisciplineFormData>({
    resolver: zodResolver(disciplineFormSchema),
    defaultValues
  });

  // Função para manipular o envio do formulário
  const handleSubmit = async (data: DisciplineFormData) => {
    try {
      await onSubmit(data);
      
      toast({
        title: initialData ? "Disciplina atualizada" : "Disciplina criada",
        description: initialData 
          ? "A disciplina foi atualizada com sucesso."
          : "A nova disciplina foi criada com sucesso.",
        variant: "default"
      });

      // Navegar de volta para a lista após o sucesso
      navigate("/admin/academic/disciplines");
    } catch (error) {
      console.error("Erro ao salvar disciplina:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar a disciplina. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="bg-card rounded-md shadow-sm p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Código da Disciplina */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código da Disciplina</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: MAT101" {...field} />
                  </FormControl>
                  <FormDescription>
                    Código único para identificar a disciplina
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
                  <FormLabel>Nome da Disciplina</FormLabel>
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

            {/* Carga Horária */}
            <FormField
              control={form.control}
              name="workload"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carga Horária (horas)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" placeholder="Ex: 60" {...field} />
                  </FormControl>
                  <FormDescription>
                    Quantidade de horas da disciplina
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Descrição */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição da Disciplina</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Descreva a disciplina, seus objetivos e público-alvo" 
                    rows={4} 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Breve descrição do conteúdo e objetivos da disciplina
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Ementa */}
          <FormField
            control={form.control}
            name="syllabus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ementa</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Liste os tópicos que serão abordados na disciplina" 
                    rows={6} 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Tópicos e conteúdos programáticos que serão abordados
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Botões de ação */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/academic/disciplines")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : initialData ? "Atualizar Disciplina" : "Salvar Disciplina"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}