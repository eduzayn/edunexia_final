import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { Discipline } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { buildDisciplineQuestionsApiUrl } from "@/lib/api-config";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  List, 
  Plus, 
  CheckCircle,
  Edit, 
  Trash, 
  Loader2,
  Eye
} from "lucide-react";

interface SimuladoManagerProps {
  disciplineId: number;
  discipline: Discipline;
}

// Schema para validação do formulário de questão
const questionFormSchema = z.object({
  statement: z.string().min(5, { message: "Enunciado deve ter pelo menos 5 caracteres" }),
  options: z.array(z.string()).min(4, { message: "Deve ter pelo menos 4 opções" }).max(5, { message: "Deve ter no máximo 5 opções" }),
  correctOption: z.number().min(0, { message: "Selecione a opção correta" }),
  explanation: z.string().min(5, { message: "Explicação deve ter pelo menos 5 caracteres" }),
  simuladoType: z.enum(["simulado", "exercicio", "revisao"]).default("simulado"),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

export function SimuladoManager({ disciplineId, discipline }: SimuladoManagerProps) {
  const { toast } = useToast();
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [isQuestionEditDialogOpen, setIsQuestionEditDialogOpen] = useState(false);
  const [isQuestionPreviewDialogOpen, setIsQuestionPreviewDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);
  const [questionOptions, setQuestionOptions] = useState<string[]>(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState<number>(0);

  // Consulta para obter as questões da disciplina
  const { 
    data: questions, 
    isLoading: isQuestionsLoading,
    refetch: refetchQuestions
  } = useQuery({
    queryKey: [buildDisciplineQuestionsApiUrl(disciplineId)],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", buildDisciplineQuestionsApiUrl(disciplineId));
        const data = await response.json();
        // Filtra apenas questões do tipo simulado
        return Array.isArray(data) 
          ? data.filter((q: any) => q.questionType === 'simulado')
          : [];
      } catch (error) {
        console.error("Erro ao buscar questões:", error);
        return [];
      }
    },
  });

  // Mutation para adicionar questão
  const addQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormValues) => {
      return apiRequest('POST', buildDisciplineQuestionsApiUrl(disciplineId), {
        ...data,
        questionType: 'simulado'
      });
    },
    onSuccess: () => {
      toast({
        title: "Questão adicionada com sucesso",
        description: "A questão foi adicionada ao simulado.",
        variant: "default",
      });
      setIsQuestionDialogOpen(false);
      // Recarrega a lista de questões
      queryClient.invalidateQueries({ queryKey: [buildDisciplineQuestionsApiUrl(disciplineId)] });
      refetchQuestions();
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar questão",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mutation para editar questão
  const editQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormValues & { id: number }) => {
      const { id, ...questionData } = data;
      return apiRequest('PUT', `${buildDisciplineQuestionsApiUrl(disciplineId)}/${id}`, {
        ...questionData,
        questionType: 'simulado'
      });
    },
    onSuccess: () => {
      toast({
        title: "Questão atualizada com sucesso",
        description: "As alterações foram salvas.",
        variant: "default",
      });
      setIsQuestionEditDialogOpen(false);
      // Recarrega a lista de questões
      queryClient.invalidateQueries({ queryKey: [buildDisciplineQuestionsApiUrl(disciplineId)] });
      refetchQuestions();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar questão",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mutation para excluir questão
  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      return apiRequest('DELETE', `${buildDisciplineQuestionsApiUrl(disciplineId)}/${questionId}`);
    },
    onSuccess: () => {
      toast({
        title: "Questão excluída com sucesso",
        description: "A questão foi removida do simulado.",
        variant: "default",
      });
      // Recarrega a lista de questões
      queryClient.invalidateQueries({ queryKey: [buildDisciplineQuestionsApiUrl(disciplineId)] });
      refetchQuestions();
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir questão",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Formulário para adicionar questão
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      statement: "",
      options: ["", "", "", ""],
      correctOption: 0,
      explanation: "",
      simuladoType: "simulado",
    },
  });

  // Formulário para editar questão
  const editForm = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      statement: "",
      options: ["", "", "", ""],
      correctOption: 0,
      explanation: "",
      simuladoType: "simulado",
    },
  });

  const onSubmit = (data: QuestionFormValues) => {
    addQuestionMutation.mutate(data);
  };

  const onEditSubmit = (data: QuestionFormValues) => {
    if (selectedQuestion?.id) {
      editQuestionMutation.mutate({ ...data, id: selectedQuestion.id });
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...questionOptions];
    newOptions[index] = value;
    setQuestionOptions(newOptions);
    form.setValue('options', newOptions);
  };

  const handleEditOptionChange = (index: number, value: string) => {
    const options = editForm.getValues('options');
    const newOptions = [...options];
    newOptions[index] = value;
    editForm.setValue('options', newOptions);
  };

  const handleAddOption = () => {
    if (questionOptions.length < 5) {
      const newOptions = [...questionOptions, ""];
      setQuestionOptions(newOptions);
      form.setValue('options', newOptions);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (questionOptions.length > 4) {
      const newOptions = [...questionOptions];
      newOptions.splice(index, 1);
      setQuestionOptions(newOptions);
      form.setValue('options', newOptions);
      
      // Ajusta a opção correta se necessário
      if (correctOption >= index && correctOption > 0) {
        setCorrectOption(correctOption - 1);
        form.setValue('correctOption', correctOption - 1);
      }
    }
  };

  const handleEditQuestion = (question: any) => {
    setSelectedQuestion(question);
    
    // Preenche o formulário com os dados da questão
    editForm.reset({
      statement: question.statement || "",
      options: question.options || ["", "", "", ""],
      correctOption: question.correctOption || 0,
      explanation: question.explanation || "",
      simuladoType: question.simuladoType || "simulado",
    });
    
    setIsQuestionEditDialogOpen(true);
  };

  const handlePreviewQuestion = (question: any) => {
    setSelectedQuestion(question);
    setIsQuestionPreviewDialogOpen(true);
  };

  const handleDeleteQuestion = (questionId: number) => {
    if (confirm("Tem certeza que deseja excluir esta questão?")) {
      deleteQuestionMutation.mutate(questionId);
    }
  };

  const getLetterForIndex = (index: number) => {
    return String.fromCharCode(65 + index); // Retorna A, B, C, D, E...
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl">Simulado</CardTitle>
          <CardDescription>Crie um simulado com até 30 questões para os alunos praticarem</CardDescription>
        </div>
        <Button 
          size="sm" 
          onClick={() => {
            setQuestionOptions(["", "", "", ""]);
            setCorrectOption(0);
            form.reset();
            setIsQuestionDialogOpen(true);
          }}
          disabled={questions && questions.length >= 30}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar questão
        </Button>
      </CardHeader>
      <CardContent>
        {isQuestionsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : questions && questions.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 mb-2">
              {questions.length} {questions.length === 1 ? 'questão' : 'questões'} cadastradas
            </p>
            <Accordion type="single" collapsible className="w-full">
              {questions.map((question: any, index: number) => (
                <AccordionItem key={question.id} value={`question-${question.id}`}>
                  <AccordionTrigger className="hover:bg-gray-50 px-4 py-2 rounded-md">
                    <div className="flex items-center text-left">
                      <Badge variant="outline" className="mr-3">
                        {index + 1}
                      </Badge>
                      <div className="truncate max-w-lg">
                        {question.statement}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 border-t">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        {question.options.map((option: string, optionIndex: number) => (
                          <div 
                            key={`q-${question.id}-option-${optionIndex}`}
                            className={`flex items-start p-2 rounded-md ${
                              optionIndex === question.correctOption ? 'bg-green-50 border border-green-200' : ''
                            }`}
                          >
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                              optionIndex === question.correctOption ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {getLetterForIndex(optionIndex)}
                            </div>
                            <div className="flex-1">
                              {option}
                            </div>
                            {optionIndex === question.correctOption && (
                              <CheckCircle className="h-4 w-4 text-green-500 ml-2 flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 bg-gray-50 p-3 rounded-md">
                        <p className="text-sm font-medium mb-1">Explicação da resposta:</p>
                        <p className="text-sm text-gray-600">{question.explanation}</p>
                      </div>
                      
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePreviewQuestion(question)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Visualizar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditQuestion(question)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash className="h-4 w-4 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ) : (
          <div className="text-center py-6">
            <List className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">Nenhuma questão cadastrada</h3>
            <p className="text-gray-500 mt-1">Adicione questões para criar o simulado da disciplina</p>
          </div>
        )}
      </CardContent>

      {/* Diálogo para adicionar questão */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar questão ao simulado</DialogTitle>
            <DialogDescription>
              Crie uma nova questão para o simulado da disciplina
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="statement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enunciado da questão</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Digite o enunciado da questão..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-4">
                <FormLabel>Alternativas</FormLabel>
                {questionOptions.map((option, index) => (
                  <div key={`option-${index}`} className="flex items-center space-x-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      {getLetterForIndex(index)}
                    </div>
                    <Input 
                      placeholder={`Alternativa ${getLetterForIndex(index)}`}
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="flex-1"
                    />
                    {index === correctOption && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Correta
                      </Badge>
                    )}
                    {questionOptions.length > 4 && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="flex-shrink-0 text-red-500 hover:text-red-700"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                {questionOptions.length < 5 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    type="button"
                    onClick={handleAddOption}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar alternativa
                  </Button>
                )}
              </div>
              
              <FormField
                control={form.control}
                name="correctOption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alternativa correta</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value.toString()}
                        onValueChange={(value) => {
                          const index = parseInt(value);
                          setCorrectOption(index);
                          field.onChange(index);
                        }}
                        className="flex flex-col space-y-1"
                      >
                        {questionOptions.map((option, index) => (
                          <div key={`radio-${index}`} className="flex items-center space-x-2">
                            <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                            <Label htmlFor={`option-${index}`} className="flex items-center">
                              <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                                {getLetterForIndex(index)}
                              </span>
                              <span className="truncate">{option}</span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="explanation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Explicação da resposta</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Explique por que esta é a resposta correta..." 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={addQuestionMutation.isPending}>
                  {addQuestionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Adicionar questão
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar questão */}
      <Dialog open={isQuestionEditDialogOpen} onOpenChange={setIsQuestionEditDialogOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar questão</DialogTitle>
            <DialogDescription>
              Modifique a questão do simulado
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="statement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enunciado da questão</FormLabel>
                    <FormControl>
                      <Textarea 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-4">
                <FormLabel>Alternativas</FormLabel>
                {editForm.watch('options').map((option, index) => (
                  <div key={`edit-option-${index}`} className="flex items-center space-x-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      {getLetterForIndex(index)}
                    </div>
                    <Input 
                      value={option}
                      onChange={(e) => handleEditOptionChange(index, e.target.value)}
                      className="flex-1"
                    />
                    {index === editForm.watch('correctOption') && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Correta
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
              
              <FormField
                control={editForm.control}
                name="correctOption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alternativa correta</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value.toString()}
                        onValueChange={(value) => {
                          field.onChange(parseInt(value));
                        }}
                        className="flex flex-col space-y-1"
                      >
                        {editForm.watch('options').map((option, index) => (
                          <div key={`edit-radio-${index}`} className="flex items-center space-x-2">
                            <RadioGroupItem value={index.toString()} id={`edit-option-${index}`} />
                            <Label htmlFor={`edit-option-${index}`} className="flex items-center">
                              <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                                {getLetterForIndex(index)}
                              </span>
                              <span className="truncate">{option}</span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="explanation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Explicação da resposta</FormLabel>
                    <FormControl>
                      <Textarea 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsQuestionEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={editQuestionMutation.isPending}>
                  {editQuestionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar alterações
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para visualizar questão */}
      <Dialog open={isQuestionPreviewDialogOpen} onOpenChange={setIsQuestionPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Visualizar questão</DialogTitle>
            <DialogDescription>
              Veja como a questão será exibida para o aluno
            </DialogDescription>
          </DialogHeader>
          
          {selectedQuestion && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-900">{selectedQuestion.statement}</p>
              </div>
              
              <div className="space-y-2">
                {selectedQuestion.options.map((option: string, index: number) => (
                  <div 
                    key={`preview-${index}`}
                    className="flex items-start p-3 border rounded-md hover:bg-gray-50"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                      {getLetterForIndex(index)}
                    </div>
                    <div className="flex-1">
                      {option}
                    </div>
                  </div>
                ))}
              </div>
              
              <DialogFooter>
                <Button onClick={() => setIsQuestionPreviewDialogOpen(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}