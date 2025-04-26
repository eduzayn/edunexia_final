import { useState } from "react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  CheckCircle2,
  ClipboardCheck,
  PlusCircle,
  Trash2,
  Edit,
  HelpCircle,
  Circle,
  Check,
  Loader2,
  AlertCircle,
  BadgeCheck,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Esquema para uma única questão da avaliação final
const assessmentQuestionSchema = z.object({
  statement: z.string().min(5, { message: "O enunciado deve ter pelo menos 5 caracteres" }),
  optionA: z.string().min(1, { message: "A opção A é obrigatória" }),
  optionB: z.string().min(1, { message: "A opção B é obrigatória" }),
  optionC: z.string().min(1, { message: "A opção C é obrigatória" }),
  optionD: z.string().min(1, { message: "A opção D é obrigatória" }),
  optionE: z.string().optional(),
  correctOption: z.enum(["A", "B", "C", "D", "E"], {
    required_error: "Selecione a opção correta",
  }),
  explanation: z.string().optional(),
  weight: z.number().min(1).max(10).default(1),
});

type AssessmentQuestionFormValues = z.infer<typeof assessmentQuestionSchema>;

// Interface para representar uma questão da avaliação final
interface AssessmentQuestion {
  id?: number;
  disciplineId?: number;
  statement: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE?: string;
  correctOption: "A" | "B" | "C" | "D" | "E";
  explanation?: string;
  weight: number;
}

// Esquema para configuração da avaliação final
const assessmentConfigSchema = z.object({
  passingScore: z.number().min(60).max(100).default(70),
  showExplanations: z.boolean().default(true),
  allowRetake: z.boolean().default(true),
  maxAttempts: z.number().min(1).max(10).default(3),
});

type AssessmentConfigFormValues = z.infer<typeof assessmentConfigSchema>;

export function AvaliacaoFinalManager({ disciplineId }: { disciplineId: number | string }) {
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [isEditQuestionOpen, setIsEditQuestionOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<AssessmentQuestion | null>(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Função para construir a URL da API de questões da avaliação para uma disciplina
  const buildDisciplineAssessmentsApiUrl = (disciplineId: number | string) => {
    return `/api/disciplines/${disciplineId}/assessments`;
  };

  // Função para construir a URL da API de configuração da avaliação para uma disciplina
  const buildDisciplineAssessmentConfigApiUrl = (disciplineId: number | string) => {
    return `/api/disciplines/${disciplineId}/assessment-config`;
  };

  // Busca as questões da avaliação final da disciplina
  const {
    data: assessmentQuestions,
    isLoading: isQuestionsLoading,
    refetch: refetchQuestions,
  } = useQuery({
    queryKey: [buildDisciplineAssessmentsApiUrl(disciplineId)],
    enabled: !!disciplineId,
  });

  // Busca a configuração da avaliação final da disciplina
  const {
    data: assessmentConfig,
    isLoading: isConfigLoading,
    refetch: refetchConfig,
  } = useQuery({
    queryKey: [buildDisciplineAssessmentConfigApiUrl(disciplineId)],
    enabled: !!disciplineId,
  });

  // Mutation para adicionar questão à avaliação final
  const addQuestionMutation = useMutation({
    mutationFn: (data: AssessmentQuestionFormValues) => {
      return apiRequest('POST', buildDisciplineAssessmentsApiUrl(disciplineId), data);
    },
    onSuccess: () => {
      toast({
        title: "Questão adicionada com sucesso",
        description: "A questão foi adicionada à avaliação final da disciplina.",
        variant: "default",
      });
      setIsAddQuestionOpen(false);
      form.reset();
      // Recarrega as questões
      queryClient.invalidateQueries({ queryKey: [buildDisciplineAssessmentsApiUrl(disciplineId)] });
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

  // Mutation para editar questão da avaliação final
  const editQuestionMutation = useMutation({
    mutationFn: (data: AssessmentQuestionFormValues & { id: number }) => {
      const { id, ...questionData } = data;
      return apiRequest('PUT', `${buildDisciplineAssessmentsApiUrl(disciplineId)}/${id}`, questionData);
    },
    onSuccess: () => {
      toast({
        title: "Questão atualizada com sucesso",
        description: "As alterações foram salvas.",
        variant: "default",
      });
      setIsEditQuestionOpen(false);
      // Recarrega as questões
      queryClient.invalidateQueries({ queryKey: [buildDisciplineAssessmentsApiUrl(disciplineId)] });
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

  // Mutation para excluir questão da avaliação final
  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: number) => {
      return apiRequest('DELETE', `${buildDisciplineAssessmentsApiUrl(disciplineId)}/${questionId}`);
    },
    onSuccess: () => {
      toast({
        title: "Questão excluída com sucesso",
        description: "A questão foi removida da avaliação final.",
        variant: "default",
      });
      // Recarrega as questões
      queryClient.invalidateQueries({ queryKey: [buildDisciplineAssessmentsApiUrl(disciplineId)] });
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

  // Mutation para atualizar configuração da avaliação final
  const updateConfigMutation = useMutation({
    mutationFn: (data: AssessmentConfigFormValues) => {
      return apiRequest('PUT', buildDisciplineAssessmentConfigApiUrl(disciplineId), data);
    },
    onSuccess: () => {
      toast({
        title: "Configuração atualizada com sucesso",
        description: "As configurações da avaliação final foram salvas.",
        variant: "default",
      });
      setIsConfigOpen(false);
      // Recarrega a configuração
      queryClient.invalidateQueries({ queryKey: [buildDisciplineAssessmentConfigApiUrl(disciplineId)] });
      refetchConfig();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar configuração",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Formulário para adição de questão
  const form = useForm<AssessmentQuestionFormValues>({
    resolver: zodResolver(assessmentQuestionSchema),
    defaultValues: {
      statement: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      optionE: "",
      correctOption: "A",
      explanation: "",
      weight: 1,
    },
  });

  // Formulário para edição de questão
  const editForm = useForm<AssessmentQuestionFormValues>({
    resolver: zodResolver(assessmentQuestionSchema),
    defaultValues: {
      statement: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      optionE: "",
      correctOption: "A",
      explanation: "",
      weight: 1,
    },
  });

  // Formulário para configuração da avaliação final
  const configForm = useForm<AssessmentConfigFormValues>({
    resolver: zodResolver(assessmentConfigSchema),
    defaultValues: {
      passingScore: 70,
      showExplanations: true,
      allowRetake: true,
      maxAttempts: 3,
    },
  });

  // Quando abrir o dialog de configuração, carrega os dados existentes
  const handleOpenConfig = () => {
    if (assessmentConfig) {
      configForm.reset({
        passingScore: assessmentConfig.passingScore || 70,
        showExplanations: assessmentConfig.showExplanations || true,
        allowRetake: assessmentConfig.allowRetake || true,
        maxAttempts: assessmentConfig.maxAttempts || 3,
      });
    }
    setIsConfigOpen(true);
  };

  const onSubmit = (data: AssessmentQuestionFormValues) => {
    addQuestionMutation.mutate(data);
  };

  const onEditSubmit = (data: AssessmentQuestionFormValues) => {
    if (selectedQuestion && selectedQuestion.id) {
      editQuestionMutation.mutate({ ...data, id: selectedQuestion.id });
    }
  };

  const onConfigSubmit = (data: AssessmentConfigFormValues) => {
    updateConfigMutation.mutate(data);
  };

  const handleDeleteQuestion = (questionId: number) => {
    if (confirm("Tem certeza que deseja excluir esta questão?")) {
      deleteQuestionMutation.mutate(questionId);
    }
  };

  const handleEditQuestion = (question: AssessmentQuestion) => {
    setSelectedQuestion(question);
    
    // Preenche o formulário com os dados da questão
    editForm.reset({
      statement: question.statement || "",
      optionA: question.optionA || "",
      optionB: question.optionB || "",
      optionC: question.optionC || "",
      optionD: question.optionD || "",
      optionE: question.optionE || "",
      correctOption: question.correctOption || "A",
      explanation: question.explanation || "",
      weight: question.weight || 1,
    });
    
    setIsEditQuestionOpen(true);
  };

  const handlePreviewQuestion = (question: AssessmentQuestion, index: number) => {
    setSelectedQuestion(question);
    setSelectedQuestionIndex(index);
    setIsPreviewOpen(true);
  };

  const renderQuestionList = () => {
    if (isQuestionsLoading) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }

    if (!assessmentQuestions || assessmentQuestions.length === 0) {
      return (
        <div className="text-center py-8">
          <ClipboardCheck className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">Nenhuma questão adicionada</h3>
          <p className="text-gray-500 mt-1 mb-4">
            Adicione até 10 questões para compor a avaliação final da disciplina
          </p>
          <div className="flex justify-center gap-2">
            <Button onClick={() => setIsAddQuestionOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Adicionar Questão
            </Button>
            <Button variant="outline" onClick={handleOpenConfig}>
              <BadgeCheck className="h-4 w-4 mr-2" />
              Configurar Avaliação
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Questões da Avaliação Final</h3>
            <p className="text-sm text-gray-500">
              {assessmentQuestions.length} {assessmentQuestions.length === 1 ? "questão" : "questões"} adicionadas
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleOpenConfig}
            >
              <BadgeCheck className="h-4 w-4 mr-2" />
              Configurações
            </Button>
            
            <Button 
              onClick={() => setIsAddQuestionOpen(true)}
              disabled={assessmentQuestions.length >= 10}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Adicionar Questão
            </Button>
          </div>
        </div>
        
        {assessmentConfig && (
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md text-sm">
            <div className="flex gap-6">
              <div>
                <span className="font-medium">Nota mínima:</span> {assessmentConfig.passingScore}%
              </div>
              <div>
                <span className="font-medium">Tentativas:</span> {assessmentConfig.allowRetake ? `${assessmentConfig.maxAttempts}x` : "1x"}
              </div>
              <div>
                <span className="font-medium">Explicações:</span> {assessmentConfig.showExplanations ? "Sim" : "Não"}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleOpenConfig}>
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
          </div>
        )}
        
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Enunciado</TableHead>
                <TableHead className="w-24 text-center">Gabarito</TableHead>
                <TableHead className="w-24 text-center">Peso</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessmentQuestions.map((question: AssessmentQuestion, index: number) => (
                <TableRow key={question.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <div className="truncate max-w-md" title={question.statement}>
                      {question.statement}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">
                      {question.correctOption}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={question.weight > 1 ? "default" : "outline"}>
                      {question.weight}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handlePreviewQuestion(question, index)}
                      >
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditQuestion(question)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteQuestion(question.id as number)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {assessmentQuestions.length >= 10 && (
          <Alert variant="warning" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Você atingiu o limite máximo de 10 questões para a avaliação final.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  // Renderiza o formulário para adicionar/editar questão
  const renderQuestionForm = (formType: "add" | "edit") => {
    const currentForm = formType === "add" ? form : editForm;
    const onFormSubmit = formType === "add" ? onSubmit : onEditSubmit;
    const isPending = formType === "add" ? addQuestionMutation.isPending : editQuestionMutation.isPending;
    
    return (
      <Form {...currentForm}>
        <form onSubmit={currentForm.handleSubmit(onFormSubmit)} className="space-y-4">
          <FormField
            control={currentForm.control}
            name="statement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Enunciado da Questão*</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Digite o enunciado completo da questão..." 
                    {...field} 
                    className="min-h-[100px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="space-y-4">
            <FormLabel>Alternativas*</FormLabel>
            
            <FormField
              control={currentForm.control}
              name="optionA"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormLabel className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    A
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Alternativa A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={currentForm.control}
              name="optionB"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormLabel className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center">
                    B
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Alternativa B" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={currentForm.control}
              name="optionC"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormLabel className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center">
                    C
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Alternativa C" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={currentForm.control}
              name="optionD"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormLabel className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center">
                    D
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Alternativa D" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={currentForm.control}
              name="optionE"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormLabel className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center">
                    E
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Alternativa E (opcional)" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={currentForm.control}
              name="correctOption"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Alternativa Correta*</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-2"
                    >
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="A" id="option-a" />
                        <Label htmlFor="option-a">A</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="B" id="option-b" />
                        <Label htmlFor="option-b">B</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="C" id="option-c" />
                        <Label htmlFor="option-c">C</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="D" id="option-d" />
                        <Label htmlFor="option-d">D</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem 
                          value="E" 
                          id="option-e" 
                          disabled={!currentForm.watch("optionE")}
                        />
                        <Label 
                          htmlFor="option-e" 
                          className={!currentForm.watch("optionE") ? "text-gray-400" : ""}
                        >
                          E
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={currentForm.control}
              name="weight"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Peso da Questão</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1" 
                      max="10" 
                      placeholder="1"
                      {...field}
                      value={field.value}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={currentForm.control}
            name="explanation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Explicação da Resposta (opcional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Explique por que a alternativa selecionada é a correta..." 
                    {...field} 
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                if (formType === "add") {
                  setIsAddQuestionOpen(false);
                } else {
                  setIsEditQuestionOpen(false);
                }
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {formType === "add" ? "Adicionar Questão" : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    );
  };

  // Renderiza o formulário de configuração da avaliação
  const renderConfigForm = () => {
    return (
      <Form {...configForm}>
        <form onSubmit={configForm.handleSubmit(onConfigSubmit)} className="space-y-6">
          <FormField
            control={configForm.control}
            name="passingScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nota mínima para aprovação (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="60" 
                    max="100"
                    {...field}
                    value={field.value}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 70)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={configForm.control}
            name="showExplanations"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Mostrar explicações após a resposta
                  </FormLabel>
                  <FormDescription>
                    Exibir a explicação da resposta correta para o aluno
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={configForm.control}
            name="allowRetake"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Permitir refazer a avaliação
                  </FormLabel>
                  <FormDescription>
                    O aluno poderá tentar novamente caso não atinja a nota mínima
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          {configForm.watch("allowRetake") && (
            <FormField
              control={configForm.control}
              name="maxAttempts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número máximo de tentativas</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1" 
                      max="10"
                      {...field}
                      value={field.value}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 3)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsConfigOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={updateConfigMutation.isPending}
            >
              {updateConfigMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar Configurações
            </Button>
          </DialogFooter>
        </form>
      </Form>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Avaliação Final</CardTitle>
        <CardDescription>
          Questões para avaliação final do aluno na disciplina
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {renderQuestionList()}
      </CardContent>
      
      {/* Diálogo para adicionar questão */}
      <Dialog open={isAddQuestionOpen} onOpenChange={setIsAddQuestionOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Questão à Avaliação Final</DialogTitle>
            <DialogDescription>
              Crie uma questão de múltipla escolha para a avaliação final da disciplina.
            </DialogDescription>
          </DialogHeader>
          
          {renderQuestionForm("add")}
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para editar questão */}
      <Dialog open={isEditQuestionOpen} onOpenChange={setIsEditQuestionOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Questão</DialogTitle>
            <DialogDescription>
              Modifique os dados da questão selecionada.
            </DialogDescription>
          </DialogHeader>
          
          {renderQuestionForm("edit")}
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para configurações da avaliação */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configurações da Avaliação Final</DialogTitle>
            <DialogDescription>
              Configure os parâmetros para aplicação da avaliação final aos alunos.
            </DialogDescription>
          </DialogHeader>
          
          {renderConfigForm()}
        </DialogContent>
      </Dialog>
      
      {/* Visualização da questão */}
      <Sheet open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Visualização da Questão</SheetTitle>
            <SheetDescription>
              Questão {selectedQuestionIndex !== null ? selectedQuestionIndex + 1 : ""} 
              {selectedQuestion?.weight && selectedQuestion.weight > 1 ? 
                ` (Peso ${selectedQuestion.weight})` : ''}
            </SheetDescription>
          </SheetHeader>
          
          {selectedQuestion && (
            <div className="mt-6 space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Enunciado</h3>
                <p className="text-base">{selectedQuestion.statement}</p>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-500">Alternativas</h3>
                
                <div className="flex items-start gap-2">
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                    selectedQuestion.correctOption === "A" 
                      ? "bg-green-100 text-green-700" 
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {selectedQuestion.correctOption === "A" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={selectedQuestion.correctOption === "A" ? "font-medium" : ""}>
                      {selectedQuestion.optionA}
                    </p>
                    {selectedQuestion.correctOption === "A" && (
                      <p className="text-xs text-green-600 mt-1">Resposta correta</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                    selectedQuestion.correctOption === "B" 
                      ? "bg-green-100 text-green-700" 
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {selectedQuestion.correctOption === "B" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={selectedQuestion.correctOption === "B" ? "font-medium" : ""}>
                      {selectedQuestion.optionB}
                    </p>
                    {selectedQuestion.correctOption === "B" && (
                      <p className="text-xs text-green-600 mt-1">Resposta correta</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                    selectedQuestion.correctOption === "C" 
                      ? "bg-green-100 text-green-700" 
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {selectedQuestion.correctOption === "C" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={selectedQuestion.correctOption === "C" ? "font-medium" : ""}>
                      {selectedQuestion.optionC}
                    </p>
                    {selectedQuestion.correctOption === "C" && (
                      <p className="text-xs text-green-600 mt-1">Resposta correta</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                    selectedQuestion.correctOption === "D" 
                      ? "bg-green-100 text-green-700" 
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {selectedQuestion.correctOption === "D" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={selectedQuestion.correctOption === "D" ? "font-medium" : ""}>
                      {selectedQuestion.optionD}
                    </p>
                    {selectedQuestion.correctOption === "D" && (
                      <p className="text-xs text-green-600 mt-1">Resposta correta</p>
                    )}
                  </div>
                </div>
                
                {selectedQuestion.optionE && (
                  <div className="flex items-start gap-2">
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                      selectedQuestion.correctOption === "E" 
                        ? "bg-green-100 text-green-700" 
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {selectedQuestion.correctOption === "E" ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={selectedQuestion.correctOption === "E" ? "font-medium" : ""}>
                        {selectedQuestion.optionE}
                      </p>
                      {selectedQuestion.correctOption === "E" && (
                        <p className="text-xs text-green-600 mt-1">Resposta correta</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {selectedQuestion.explanation && (
                <div className="space-y-2 p-4 bg-gray-50 rounded-md">
                  <h3 className="text-sm font-medium text-gray-500">Explicação da Resposta</h3>
                  <p className="text-sm">{selectedQuestion.explanation}</p>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                  Fechar
                </Button>
                <Button variant="default" onClick={() => {
                  setIsPreviewOpen(false);
                  handleEditQuestion(selectedQuestion);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Questão
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}