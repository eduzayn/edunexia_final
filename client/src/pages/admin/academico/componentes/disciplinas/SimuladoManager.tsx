import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSimulado, saveSimulado, deleteSimulado } from "@/api/pedagogico";
import {
  Loader2,
  Plus,
  Trash2,
  Edit,
  Save,
  Pencil,
  Check,
  File,
  List,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Question, Simulado } from "@/types/pedagogico";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Schema para validar uma questão
const questionSchema = z.object({
  text: z.string().min(5, { message: "A pergunta deve ter pelo menos 5 caracteres" }),
  options: z.array(z.string()).min(2, { message: "Defina pelo menos 2 alternativas" }),
  correctOption: z.number().min(0, { message: "Selecione a alternativa correta" }),
  explanation: z.string().optional(),
});

// Schema para validar o simulado
const simuladoFormSchema = z.object({
  title: z.string().min(3, { message: "O título deve ter pelo menos 3 caracteres" }),
  description: z.string().optional(),
  timeLimit: z.number().nonnegative().optional(),
  questions: z.array(questionSchema),
});

type SimuladoFormValues = z.infer<typeof simuladoFormSchema>;
type QuestionFormValues = z.infer<typeof questionSchema>;

export function SimuladoManager({ disciplineId }: { disciplineId: number | string }) {
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionFormValues>({
    text: "",
    options: ["", "", "", ""],
    correctOption: 0,
    explanation: "",
  });
  const queryClient = useQueryClient();

  // Função para construir a URL da API de simulado para uma disciplina
  const buildDisciplineSimuladoApiUrl = (disciplineId: number | string) => {
    return `/api/disciplines/${disciplineId}/simulado`;
  };

  // Busca os dados do simulado da disciplina
  const {
    data: simulado,
    isLoading: isSimuladoLoading,
    refetch: refetchSimulado,
  } = useQuery<Simulado>({
    queryKey: [buildDisciplineSimuladoApiUrl(disciplineId)],
    queryFn: () => getSimulado(disciplineId),
    enabled: !!disciplineId,
  });

  // Mutation para salvar simulado
  const simuladoMutation = useMutation({
    mutationFn: (data: SimuladoFormValues) => {
      return saveSimulado(disciplineId, {
        id: simulado?.id,
        ...data,
      });
    },
    onSuccess: () => {
      toast({
        title: simulado?.id ? "Simulado atualizado com sucesso" : "Simulado criado com sucesso",
        description: "As alterações foram salvas.",
        variant: "default",
      });
      // Recarrega os dados do simulado
      queryClient.invalidateQueries({ queryKey: [buildDisciplineSimuladoApiUrl(disciplineId)] });
      refetchSimulado();
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar simulado",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Formulário principal para o simulado
  const form = useForm<SimuladoFormValues>({
    resolver: zodResolver(simuladoFormSchema),
    defaultValues: {
      title: simulado?.title || "Simulado da Disciplina",
      description: simulado?.description || "",
      timeLimit: simulado?.timeLimit || 30,
      questions: simulado?.questions || [],
    },
  });

  // Atualiza o formulário quando os dados do simulado são carregados
  // useState substitua por useEffect
  useEffect(() => {
    if (simulado) {
      form.reset({
        title: simulado.title,
        description: simulado.description || "",
        timeLimit: simulado.timeLimit || 30,
        questions: simulado.questions || [],
      });
    }
  }, [simulado, form]);

  // Adiciona uma nova questão ao simulado
  const handleAddQuestion = () => {
    if (!currentQuestion.text.trim() || currentQuestion.options.some(opt => !opt.trim())) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos da questão.",
        variant: "destructive",
      });
      return;
    }

    const newQuestions = [...currentQuestions];
    
    if (editingQuestionIndex !== null) {
      // Edição de questão existente
      newQuestions[editingQuestionIndex] = {
        ...currentQuestion,
        id: newQuestions[editingQuestionIndex].id
      };
      setEditingQuestionIndex(null);
    } else {
      // Nova questão
      newQuestions.push({
        ...currentQuestion,
        id: crypto.randomUUID()
      });
    }

    setCurrentQuestions(newQuestions);
    setCurrentQuestion({
      text: "",
      options: ["", "", "", ""],
      correctOption: 0,
      explanation: "",
    });
    setIsAddingQuestion(false);

    // Salva no servidor
    simuladoMutation.mutate({
      title: form.getValues().title,
      description: form.getValues().description,
      timeLimit: form.getValues().timeLimit,
      questions: newQuestions
    });
  };

  // Remove uma questão do simulado
  const handleRemoveQuestion = (index: number) => {
    if (confirm("Tem certeza que deseja remover esta questão?")) {
      const newQuestions = [...currentQuestions];
      newQuestions.splice(index, 1);
      setCurrentQuestions(newQuestions);

      // Salva no servidor
      simuladoMutation.mutate({
        title: form.getValues().title,
        description: form.getValues().description,
        timeLimit: form.getValues().timeLimit,
        questions: newQuestions
      });
    }
  };

  // Edita uma questão existente
  const handleEditQuestion = (index: number) => {
    const question = currentQuestions[index];
    setCurrentQuestion({
      text: question.text,
      options: [...question.options],
      correctOption: question.correctOption,
      explanation: question.explanation || "",
    });
    setEditingQuestionIndex(index);
    setIsAddingQuestion(true);
  };

  const onSubmit = (data: SimuladoFormValues) => {
    simuladoMutation.mutate({
      ...data,
      questions: currentQuestions,
    });
  };

  const renderQuestionsList = () => {
    if (isSimuladoLoading) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      );
    }

    if (currentQuestions.length === 0) {
      return (
        <div className="text-center py-8 border border-dashed rounded-md bg-gray-50">
          <List className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">Nenhuma questão adicionada</h3>
          <p className="text-gray-500 mt-1 mb-4">
            Adicione questões para compor o simulado
          </p>
        </div>
      );
    }

    return (
      <Accordion type="single" collapsible className="space-y-3">
        {currentQuestions.map((question, index) => (
          <AccordionItem 
            key={question.id || index} 
            value={`question-${index}`}
            className="border p-4 rounded-md bg-gray-50"
          >
            <div className="flex justify-between items-center">
              <AccordionTrigger className="text-left font-medium hover:no-underline">
                {`${index + 1}. ${question.text}`}
              </AccordionTrigger>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditQuestion(index);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveQuestion(index);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <AccordionContent>
              <div className="pl-4 mt-2 space-y-2">
                {question.options.map((option, optionIndex) => (
                  <div 
                    key={optionIndex}
                    className={optionIndex === question.correctOption ? "font-medium text-green-600" : ""}
                  >
                    <div className="flex items-center gap-2">
                      {optionIndex === question.correctOption && <Check className="h-4 w-4" />}
                      <span>{`${String.fromCharCode(65 + optionIndex)}) ${option}`}</span>
                    </div>
                  </div>
                ))}
                {question.explanation && (
                  <div className="mt-3 p-2 bg-blue-50 text-blue-800 rounded-md text-sm">
                    <strong>Explicação:</strong> {question.explanation}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  };

  const renderQuestionForm = () => (
    <div className="space-y-4 border rounded-md p-4 bg-gray-50">
      <h3 className="font-medium text-lg">
        {editingQuestionIndex !== null ? "Editar Questão" : "Nova Questão"}
      </h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="question-text">Pergunta</Label>
          <Textarea
            id="question-text"
            placeholder="Digite a pergunta aqui"
            value={currentQuestion.text}
            onChange={(e) => setCurrentQuestion({
              ...currentQuestion,
              text: e.target.value
            })}
            className="mt-1"
          />
        </div>
        
        <div className="space-y-3">
          <Label>Alternativas</Label>
          {currentQuestion.options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <RadioGroupItem
                id={`option-${index}`}
                value={index.toString()}
                checked={currentQuestion.correctOption === index}
                onClick={() => setCurrentQuestion({
                  ...currentQuestion,
                  correctOption: index
                })}
              />
              <Input
                value={option}
                onChange={(e) => {
                  const newOptions = [...currentQuestion.options];
                  newOptions[index] = e.target.value;
                  setCurrentQuestion({
                    ...currentQuestion,
                    options: newOptions
                  });
                }}
                placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                className="flex-1"
              />
            </div>
          ))}
        </div>
        
        <div>
          <Label htmlFor="explanation">Explicação (opcional)</Label>
          <Textarea
            id="explanation"
            placeholder="Explicação da resposta correta (opcional)"
            value={currentQuestion.explanation || ""}
            onChange={(e) => setCurrentQuestion({
              ...currentQuestion,
              explanation: e.target.value
            })}
            className="mt-1"
          />
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsAddingQuestion(false);
              setEditingQuestionIndex(null);
              setCurrentQuestion({
                text: "",
                options: ["", "", "", ""],
                correctOption: 0,
                explanation: "",
              });
            }}
          >
            Cancelar
          </Button>
          <Button onClick={handleAddQuestion}>
            {editingQuestionIndex !== null ? "Atualizar Questão" : "Adicionar Questão"}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Simulado</CardTitle>
        <CardDescription>
          Gerencie o simulado da disciplina
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do Simulado</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Breve descrição do simulado" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="timeLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tempo (minutos)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full">
                {simuladoMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </form>
          </Form>
          
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Questões do Simulado</h3>
              {!isAddingQuestion && (
                <Button onClick={() => setIsAddingQuestion(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Questão
                </Button>
              )}
            </div>
            
            {isAddingQuestion ? renderQuestionForm() : renderQuestionsList()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}