import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertDisciplineSchema } from "@shared/schema";
import { Discipline } from "@/types/discipline";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Estender o esquema para uso no formulário com validações adicionais
const disciplineFormSchema = insertDisciplineSchema.extend({
  code: z.string().min(3, "O código deve ter pelo menos 3 caracteres"),
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  workload: z.number().min(1, "A carga horária deve ser maior que zero").max(1000, "A carga horária não pode ser maior que 1000 horas"),
  syllabus: z.string().min(10, "A ementa deve ter pelo menos 10 caracteres"),
});

type DisciplineFormProps = {
  initialData?: Partial<Discipline>;
  onSubmit: (data: z.infer<typeof disciplineFormSchema>) => Promise<void>;
  isSubmitting?: boolean;
};

export function DisciplineForm({ initialData, onSubmit, isSubmitting = false }: DisciplineFormProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Inicializar o formulário com dados existentes, se houver
  const form = useForm<z.infer<typeof disciplineFormSchema>>({
    resolver: zodResolver(disciplineFormSchema),
    defaultValues: {
      code: initialData?.code || "",
      name: initialData?.name || "",
      description: initialData?.description || "",
      workload: initialData?.workload || 0,
      syllabus: initialData?.syllabus || "",
    },
  });

  const handleSubmit = async (data: z.infer<typeof disciplineFormSchema>) => {
    try {
      await onSubmit(data);
      
      toast({
        title: initialData ? "Disciplina atualizada" : "Disciplina criada",
        description: initialData
          ? "A disciplina foi atualizada com sucesso."
          : "A disciplina foi criada com sucesso.",
        variant: "default",
      });
      
      // Redirecionar para a lista de disciplinas
      navigate("/admin/academico/disciplines");
    } catch (error) {
      console.error("Erro ao salvar disciplina:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a disciplina. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Editar Disciplina" : "Nova Disciplina"}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      Código único para identificar a disciplina
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="workload"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carga Horária (horas)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="1000" 
                        placeholder="Ex: 60" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        value={field.value}
                      />
                    </FormControl>
                    <FormDescription>
                      Quantidade de horas-aula da disciplina
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva a disciplina..." 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Breve descrição do que será abordado na disciplina
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="syllabus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ementa</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detalhe os tópicos que serão abordados..." 
                      rows={6}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Lista detalhada dos tópicos que serão abordados na disciplina
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate("/admin/academico/disciplines")}
            >
              Cancelar
            </Button>
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
                "Salvar"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}