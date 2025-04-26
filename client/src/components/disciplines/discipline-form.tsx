import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { DisciplineFormData } from "@/types/discipline";
import { Discipline } from "@shared/schema";

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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, BookOpen, ChevronLeft, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Schema de validação para o formulário de disciplina
const disciplineSchema = z.object({
  code: z.string().min(2, "Código deve ter pelo menos 2 caracteres"),
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  workload: z.coerce.number().min(1, "Carga horária deve ser maior que zero"),
  syllabus: z.string().min(10, "Ementa deve ter pelo menos 10 caracteres"),
});

interface DisciplineFormProps {
  initialData?: Discipline;
  onSubmit: (data: DisciplineFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function DisciplineForm({ initialData, onSubmit, isSubmitting }: DisciplineFormProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  
  const isEditMode = Boolean(initialData);

  // Inicializa formulário com dados de disciplina ou valores padrão
  const form = useForm<z.infer<typeof disciplineSchema>>({
    resolver: zodResolver(disciplineSchema),
    defaultValues: {
      code: initialData?.code || "",
      name: initialData?.name || "",
      description: initialData?.description || "",
      workload: initialData?.workload || 30,
      syllabus: initialData?.syllabus || "",
    },
  });

  // Função para lidar com o envio do formulário
  const handleSubmit = async (values: z.infer<typeof disciplineSchema>) => {
    setError(null);
    
    try {
      await onSubmit({
        ...values,
      });
      
      toast({
        title: isEditMode ? "Disciplina atualizada" : "Disciplina criada",
        description: isEditMode 
          ? `A disciplina "${values.name}" foi atualizada com sucesso.` 
          : `A disciplina "${values.name}" foi criada com sucesso.`,
        variant: "default",
      });
      
      // Redireciona para a lista de disciplinas ou página de conteúdo
      setLocation(isEditMode 
        ? `/admin/academico/disciplines/${initialData?.id}/content` 
        : "/admin/academico/disciplines"
      );
    } catch (err) {
      console.error("Erro ao salvar disciplina:", err);
      setError(isEditMode 
        ? "Ocorreu um erro ao atualizar a disciplina. Tente novamente." 
        : "Ocorreu um erro ao criar a disciplina. Tente novamente."
      );
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código da Disciplina</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: PROG101" {...field} />
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
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Duração total da disciplina em horas
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
                  <FormLabel>Nome da Disciplina</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Programação Orientada a Objetos" {...field} />
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
                      placeholder="Descreva brevemente a disciplina..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Uma breve descrição do conteúdo da disciplina
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
                      placeholder="Detalhe os tópicos abordados na disciplina..." 
                      className="min-h-[150px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Tópicos que serão abordados durante a disciplina
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-between pt-4">
              <Link href="/admin/academico/disciplines">
                <Button type="button" variant="outline">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Voltar para Disciplinas
                </Button>
              </Link>
              
              <div className="space-x-2">
                {isEditMode && (
                  <Link href={`/admin/academico/disciplines/${initialData?.id}/content`}>
                    <Button type="button" variant="outline">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Gerenciar Conteúdo
                    </Button>
                  </Link>
                )}
                
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                      {isEditMode ? "Atualizando..." : "Criando..."}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isEditMode ? "Atualizar Disciplina" : "Criar Disciplina"}
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