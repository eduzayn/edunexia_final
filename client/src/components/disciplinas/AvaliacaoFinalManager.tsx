import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { Discipline } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { buildDisciplineQuestionsApiUrl, buildDisciplineAssessmentsApiUrl } from "@/lib/api-config";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  ClipboardCheck, 
  Plus, 
  Edit, 
  Trash, 
  Loader2,
  Settings,
  CheckCircle2,
  List,
  AlertCircle,
  CheckSquare,
  Square
} from "lucide-react";

interface AvaliacaoFinalManagerProps {
  disciplineId: number;
  discipline: Discipline;
}

// Schema para validação do formulário de avaliação
const assessmentFormSchema = z.object({
  title: z.string().min(3, { message: "Título deve ter pelo menos 3 caracteres" }),
  description: z.string().min(10, { message: "Descrição deve ter pelo menos 10 caracteres" }),
  passingScore: z.coerce.number().min(0, { message: "Nota mínima deve ser maior ou igual a 0" }).max(10, { message: "Nota mínima deve ser menor ou igual a 10" }),
  questionIds: z.array(z.number()).min(1, { message: "Selecione pelo menos uma questão" }).max(10, { message: "Máximo de 10 questões permitidas" }),
});

type AssessmentFormValues = z.infer<typeof assessmentFormSchema>;

export function AvaliacaoFinalManager({ disciplineId, discipline }: AvaliacaoFinalManagerProps) {
  const { toast } = useToast();
  const [isAssessmentDialogOpen, setIsAssessmentDialogOpen] = useState(false);
  const [isAssessmentEditDialogOpen, setIsAssessmentEditDialogOpen] = useState(false);
  const [isQuestionsSelectionDialogOpen, setIsQuestionsSelectionDialogOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<any | null>(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [isViewQuestionsDialogOpen, setIsViewQuestionsDialogOpen] = useState(false);
  const [assessmentQuestionsWithDetails, setAssessmentQuestionsWithDetails] = useState<any[]>([]);
  
  // Consulta para obter as avaliações da disciplina
  const { 
    data: assessments, 
    isLoading: isAssessmentsLoading,
    refetch: refetchAssessments
  } = useQuery({
    queryKey: [buildDisciplineAssessmentsApiUrl(disciplineId)],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", buildDisciplineAssessmentsApiUrl(disciplineId));
        const data = await response.json();
        // Filtra apenas avaliações do tipo avaliacao_final
        return Array.isArray(data) 
          ? data.filter((a: any) => a.type === 'avaliacao_final')
          : [];
      } catch (error) {
        console.error("Erro ao buscar avaliações:", error);
        return [];
      }
    },
  });

  // Consulta para obter todas as questões disponíveis
  const { 
    data: availableQuestions,
    isLoading: isQuestionsLoading
  } = useQuery({
    queryKey: [buildDisciplineQuestionsApiUrl(disciplineId)],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", buildDisciplineQuestionsApiUrl(disciplineId));
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Erro ao buscar questões:", error);
        return [];
      }
    },
  });

  // Mutation para adicionar avaliação
  const addAssessmentMutation = useMutation({
    mutationFn: async (data: AssessmentFormValues) => {
      return apiRequest('POST', buildDisciplineAssessmentsApiUrl(disciplineId), {
        ...data,
        type: 'avaliacao_final'
      });
    },
    onSuccess: () => {
      toast({
        title: "Avaliação final criada com sucesso",
        description: "A avaliação foi adicionada à disciplina.",
        variant: "default",
      });
      setIsAssessmentDialogOpen(false);
      // Recarrega a lista de avaliações
      queryClient.invalidateQueries({ queryKey: [buildDisciplineAssessmentsApiUrl(disciplineId)] });
      refetchAssessments();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar avaliação",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mutation para editar avaliação
  const editAssessmentMutation = useMutation({
    mutationFn: async (data: AssessmentFormValues & { id: number }) => {
      const { id, ...assessmentData } = data;
      return apiRequest('PUT', `${buildDisciplineAssessmentsApiUrl(disciplineId)}/${id}`, {
        ...assessmentData,
        type: 'avaliacao_final'
      });
    },
    onSuccess: () => {
      toast({
        title: "Avaliação atualizada com sucesso",
        description: "As alterações foram salvas.",
        variant: "default",
      });
      setIsAssessmentEditDialogOpen(false);
      // Recarrega a lista de avaliações
      queryClient.invalidateQueries({ queryKey: [buildDisciplineAssessmentsApiUrl(disciplineId)] });
      refetchAssessments();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar avaliação",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mutation para excluir avaliação
  const deleteAssessmentMutation = useMutation({
    mutationFn: async (assessmentId: number) => {
      return apiRequest('DELETE', `${buildDisciplineAssessmentsApiUrl(disciplineId)}/${assessmentId}`);
    },
    onSuccess: () => {
      toast({
        title: "Avaliação excluída com sucesso",
        description: "A avaliação foi removida da disciplina.",
        variant: "default",
      });
      // Recarrega a lista de avaliações
      queryClient.invalidateQueries({ queryKey: [buildDisciplineAssessmentsApiUrl(disciplineId)] });
      refetchAssessments();
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir avaliação",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Formulário para criar avaliação
  const form = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      passingScore: 7,
      questionIds: [],
    },
  });

  // Formulário para editar avaliação
  const editForm = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      passingScore: 7,
      questionIds: [],
    },
  });

  const onSubmit = (data: AssessmentFormValues) => {
    addAssessmentMutation.mutate(data);
  };

  const onEditSubmit = (data: AssessmentFormValues) => {
    if (selectedAssessment?.id) {
      editAssessmentMutation.mutate({ ...data, id: selectedAssessment.id });
    }
  };

  const handleEditAssessment = (assessment: any) => {
    setSelectedAssessment(assessment);
    
    // Preenche o formulário com os dados da avaliação
    editForm.reset({
      title: assessment.title || "",
      description: assessment.description || "",
      passingScore: assessment.passingScore || 7,
      questionIds: assessment.questionIds || [],
    });
    
    setSelectedQuestionIds(assessment.questionIds || []);
    setIsAssessmentEditDialogOpen(true);
  };

  const handleDeleteAssessment = (assessmentId: number) => {
    if (confirm("Tem certeza que deseja excluir esta avaliação final?")) {
      deleteAssessmentMutation.mutate(assessmentId);
    }
  };

  const handleOpenQuestionSelection = (isEdit: boolean = false) => {
    // Se for edição, usa os IDs já selecionados
    if (isEdit) {
      const questionIds = editForm.getValues('questionIds');
      setSelectedQuestionIds(questionIds);
    } else {
      // Se for criação, reinicia a seleção
      setSelectedQuestionIds([]);
    }
    
    setIsQuestionsSelectionDialogOpen(true);
  };

  const handleConfirmQuestionSelection = (isEdit: boolean = false) => {
    if (isEdit) {
      editForm.setValue('questionIds', selectedQuestionIds);
    } else {
      form.setValue('questionIds', selectedQuestionIds);
    }
    
    setIsQuestionsSelectionDialogOpen(false);
  };

  const toggleQuestionSelection = (questionId: number) => {
    if (selectedQuestionIds.includes(questionId)) {
      // Remove da seleção
      setSelectedQuestionIds(selectedQuestionIds.filter(id => id !== questionId));
    } else {
      // Verifica se já atingiu o limite de 10 questões
      if (selectedQuestionIds.length < 10) {
        // Adiciona à seleção
        setSelectedQuestionIds([...selectedQuestionIds, questionId]);
      } else {
        toast({
          title: "Limite de questões atingido",
          description: "Uma avaliação final pode ter no máximo 10 questões.",
          variant: "destructive",
        });
      }
    }
  };

  const handleViewQuestions = async (assessment: any) => {
    if (!assessment.questionIds || assessment.questionIds.length === 0) {
      toast({
        title: "Nenhuma questão selecionada",
        description: "Esta avaliação não possui questões.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedAssessment(assessment);
    
    try {
      // Busca detalhes de cada questão
      const questionsWithDetails = [];
      
      for (const questionId of assessment.questionIds) {
        // Busca a questão na lista de questões disponíveis
        const question = availableQuestions?.find((q: any) => q.id === questionId);
        
        if (question) {
          questionsWithDetails.push(question);
        }
      }
      
      setAssessmentQuestionsWithDetails(questionsWithDetails);
      setIsViewQuestionsDialogOpen(true);
    } catch (error) {
      toast({
        title: "Erro ao buscar detalhes das questões",
        description: `Ocorreu um erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    }
  };

  const getLetterForIndex = (index: number) => {
    return String.fromCharCode(65 + index); // Retorna A, B, C, D, E...
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl">Avaliação Final</CardTitle>
          <CardDescription>Configure a avaliação final obrigatória da disciplina</CardDescription>
        </div>
        {(!assessments || assessments.length === 0) && (
          <Button 
            size="sm" 
            onClick={() => {
              form.reset({
                title: "",
                description: "",
                passingScore: 7,
                questionIds: [],
              });
              setSelectedQuestionIds([]);
              setIsAssessmentDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Criar avaliação
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isAssessmentsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : assessments && assessments.length > 0 ? (
          <div className="space-y-4">
            {assessments.map((assessment: any) => (
              <div 
                key={assessment.id} 
                className="border rounded-lg overflow-hidden"
              >
                <div className="p-4 bg-gray-50 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        <ClipboardCheck className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{assessment.title}</h3>
                        <p className="text-sm text-gray-600">{assessment.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {assessment.questionIds?.length || 0} {assessment.questionIds?.length === 1 ? 'questão' : 'questões'}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                      <span>Nota mínima: {assessment.passingScore}/10</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewQuestions(assessment)}
                    >
                      <List className="h-4 w-4 mr-1" />
                      Ver questões
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditAssessment(assessment)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteAssessment(assessment.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <ClipboardCheck className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">Nenhuma avaliação final configurada</h3>
            <p className="text-gray-500 mt-1">Configure a avaliação final para a disciplina</p>
          </div>
        )}
      </CardContent>

      {/* Diálogo para criar avaliação */}
      <Dialog open={isAssessmentDialogOpen} onOpenChange={setIsAssessmentDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Criar avaliação final</DialogTitle>
            <DialogDescription>
              Configure a avaliação final da disciplina
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título da avaliação</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Avaliação Final da Disciplina" {...field} />
                    </FormControl>
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
                        placeholder="Descrição da avaliação final..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="passingScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nota mínima para aprovação (0-10)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="10" step="0.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="questionIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Questões selecionadas</FormLabel>
                    <div className="border rounded-md p-3">
                      {field.value.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm">
                            {field.value.length} {field.value.length === 1 ? 'questão selecionada' : 'questões selecionadas'}
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            type="button"
                            onClick={() => handleOpenQuestionSelection(false)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modificar seleção
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-3">
                          <p className="text-sm text-gray-500 mb-2">Nenhuma questão selecionada</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            type="button"
                            onClick={() => handleOpenQuestionSelection(false)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Selecionar questões
                          </Button>
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAssessmentDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={addAssessmentMutation.isPending}>
                  {addAssessmentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar avaliação
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar avaliação */}
      <Dialog open={isAssessmentEditDialogOpen} onOpenChange={setIsAssessmentEditDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Editar avaliação final</DialogTitle>
            <DialogDescription>
              Modifique as configurações da avaliação
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título da avaliação</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="passingScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nota mínima para aprovação (0-10)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="10" step="0.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="questionIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Questões selecionadas</FormLabel>
                    <div className="border rounded-md p-3">
                      {field.value.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm">
                            {field.value.length} {field.value.length === 1 ? 'questão selecionada' : 'questões selecionadas'}
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            type="button"
                            onClick={() => handleOpenQuestionSelection(true)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modificar seleção
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-3">
                          <p className="text-sm text-gray-500 mb-2">Nenhuma questão selecionada</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            type="button"
                            onClick={() => handleOpenQuestionSelection(true)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Selecionar questões
                          </Button>
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAssessmentEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={editAssessmentMutation.isPending}>
                  {editAssessmentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar alterações
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para seleção de questões */}
      <Dialog open={isQuestionsSelectionDialogOpen} onOpenChange={setIsQuestionsSelectionDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Selecionar questões</DialogTitle>
            <DialogDescription>
              Escolha até 10 questões para incluir na avaliação final (selecionadas: {selectedQuestionIds.length}/10)
            </DialogDescription>
          </DialogHeader>
          
          {isQuestionsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : availableQuestions && availableQuestions.length > 0 ? (
            <div className="space-y-2">
              {availableQuestions.map((question: any) => (
                <div 
                  key={question.id}
                  className={`flex items-start p-3 border rounded-md ${
                    selectedQuestionIds.includes(question.id) ? 'border-blue-200 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <Checkbox
                    id={`question-${question.id}`}
                    checked={selectedQuestionIds.includes(question.id)}
                    onCheckedChange={() => toggleQuestionSelection(question.id)}
                    className="mr-3 mt-1"
                  />
                  <div className="flex-1">
                    <Label 
                      htmlFor={`question-${question.id}`}
                      className="font-medium cursor-pointer"
                    >
                      {question.statement}
                    </Label>
                    <div className="mt-2 text-xs text-gray-500">
                      {question.options?.length} alternativas • 
                      {question.questionType === 'simulado' ? ' Tipo: Simulado' : 
                       question.questionType === 'avaliacao_final' ? ' Tipo: Avaliação Final' : 
                       ' Tipo: Exercício'}
                    </div>
                  </div>
                  {selectedQuestionIds.includes(question.id) && (
                    <CheckSquare className="h-5 w-5 text-blue-500 ml-2" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border rounded-md">
              <AlertCircle className="h-10 w-10 mx-auto text-gray-300 mb-2" />
              <h3 className="text-base font-medium text-gray-900">Nenhuma questão disponível</h3>
              <p className="text-gray-500 mt-1 text-sm">Adicione questões no Simulado primeiro</p>
            </div>
          )}
          
          <DialogFooter className="flex justify-between">
            <div>
              {selectedQuestionIds.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedQuestionIds([])}
                  className="mr-2"
                >
                  Limpar seleção
                </Button>
              )}
            </div>
            <div>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsQuestionsSelectionDialogOpen(false)}
                className="mr-2"
              >
                Cancelar
              </Button>
              <Button 
                type="button"
                onClick={() => handleConfirmQuestionSelection(isAssessmentEditDialogOpen)}
                disabled={selectedQuestionIds.length === 0}
              >
                Confirmar seleção
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para visualizar questões da avaliação */}
      <Dialog open={isViewQuestionsDialogOpen} onOpenChange={setIsViewQuestionsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Questões da avaliação</DialogTitle>
            <DialogDescription>
              {selectedAssessment?.title} - {assessmentQuestionsWithDetails.length} questões
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-2">
            {assessmentQuestionsWithDetails.map((question, index) => (
              <div key={question.id} className="border rounded-md p-4">
                <div className="flex items-center mb-3">
                  <Badge variant="outline" className="mr-3">
                    Q{index + 1}
                  </Badge>
                  <p className="font-medium">{question.statement}</p>
                </div>
                
                <div className="space-y-2 pl-4">
                  {question.options.map((option: string, optIndex: number) => (
                    <div 
                      key={`q${index}-opt${optIndex}`}
                      className={`flex items-start p-2 rounded-md ${
                        optIndex === question.correctOption ? 'bg-green-50 border border-green-200' : ''
                      }`}
                    >
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mr-2 ${
                        optIndex === question.correctOption ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {getLetterForIndex(optIndex)}
                      </div>
                      <div className="flex-1 text-sm">
                        {option}
                      </div>
                      {optIndex === question.correctOption && (
                        <CheckCircle2 className="h-4 w-4 text-green-500 ml-2 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsViewQuestionsDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}