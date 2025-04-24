import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import StudentLayout from "@/components/layout/student-layout";
import {
  ChevronLeft as ChevronLeftIcon,
  Clock as ClockIcon,
  AlertTriangle as AlertTriangleIcon,
  CheckCircle as CheckCircleIcon,
  HelpCircle as HelpCircleIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft,
  Save,
  Flag,
  Eye,
  CheckSquare,
  ChevronDown
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";

export default function DisciplineSimuladoPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [markedForReview, setMarkedForReview] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Mock data - em uma implementação real, isso viria da API
  const simuladoData = {
    id: parseInt(id || "1"),
    title: "Simulado - Fundamentos da Psicopedagogia",
    disciplineId: 1,
    disciplineName: "Fundamentos da Psicopedagogia",
    courseId: 101,
    courseName: "Pós-Graduação em Psicopedagogia Clínica e Institucional",
    description: "Este simulado contém 20 questões baseadas no conteúdo abordado nas aulas sobre os fundamentos da psicopedagogia.",
    instructions: "Você tem 60 minutos para completar este simulado. Cada questão tem apenas uma resposta correta. Você pode navegar livremente entre as questões e revisar suas respostas antes de enviar.",
    timeLimit: 60, // em minutos
    minPercentToPass: 70,
    totalQuestions: 20,
    questions: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      text: `Questão ${i + 1}: Considerando os principais autores da Psicopedagogia, quem propôs o conceito de "Epistemologia Genética"?`,
      options: [
        { id: "a", text: "Jean Piaget" },
        { id: "b", text: "Lev Vygotsky" },
        { id: "c", text: "Henri Wallon" },
        { id: "d", text: "David Ausubel" },
        { id: "e", text: "Maria Montessori" }
      ],
      correctAnswer: "a", // apenas no modo de revisão
      explanation: "Jean Piaget desenvolveu a Epistemologia Genética como uma teoria sobre a natureza e desenvolvimento do conhecimento humano." // apenas no modo de revisão
    }))
  };

  // Consulta para obter os detalhes do simulado
  const { data: simulado, isLoading, error } = useQuery({
    queryKey: ['/api-json/student/simulados', id],
    queryFn: async () => {
      try {
        const response = await fetch(`/api-json/student/simulados/${id}`);
        if (!response.ok) {
          // No ambiente de desenvolvimento, retornar dados fictícios
          return simuladoData;
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching simulado details:", error);
        // No ambiente de desenvolvimento, retornar dados fictícios
        return simuladoData;
      }
    }
  });

  // Inicializar o timer quando o simulado é carregado
  useEffect(() => {
    if (simulado && !hasSubmitted) {
      setTimeLeft(simulado.timeLimit * 60);
      
      const interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(interval);
            handleSubmitSimulado();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [simulado, hasSubmitted]);

  // Formatar o tempo restante
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours > 0 ? `${hours}h ` : ''}${minutes.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  // Navegar para a próxima questão
  const nextQuestion = () => {
    if (simulado && currentQuestion < simulado.totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  // Navegar para a questão anterior
  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Manipular a seleção de respostas
  const handleAnswerSelect = (questionIndex: number, optionId: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: optionId
    });
  };

  // Alternar marcação de revisão para uma questão
  const toggleMarkForReview = (questionIndex: number) => {
    if (markedForReview.includes(questionIndex)) {
      setMarkedForReview(markedForReview.filter(i => i !== questionIndex));
    } else {
      setMarkedForReview([...markedForReview, questionIndex]);
    }
  };

  // Contadores de progresso
  const answeredCount = Object.keys(selectedAnswers).length;
  const reviewCount = markedForReview.length;
  const progressPercentage = simulado ? (answeredCount / simulado.totalQuestions) * 100 : 0;

  // Salvar o progresso atual
  const saveProgress = () => {
    // Em uma implementação real, salvar no servidor
    toast({
      title: "Progresso salvo",
      description: "Suas respostas foram salvas com sucesso.",
    });
  };

  // Abrir diálogo de confirmação de envio
  const openSubmitDialog = () => {
    setIsSubmitDialogOpen(true);
  };

  // Enviar o simulado
  const handleSubmitSimulado = () => {
    setIsSubmitting(true);
    
    // Simular envio para o servidor
    setTimeout(() => {
      setIsSubmitting(false);
      setHasSubmitted(true);
      setIsSubmitDialogOpen(false);
      
      toast({
        title: "Simulado enviado",
        description: "Seu simulado foi enviado com sucesso. Agora você pode visualizar a correção.",
      });
    }, 1500);
  };

  // Calcular resultado após envio
  const calculateResult = () => {
    if (!simulado || !hasSubmitted) return null;
    
    let correctCount = 0;
    simulado.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correctCount++;
      }
    });
    
    const percentageCorrect = (correctCount / simulado.totalQuestions) * 100;
    const passed = percentageCorrect >= simulado.minPercentToPass;
    
    return {
      totalQuestions: simulado.totalQuestions,
      correctAnswers: correctCount,
      percentageCorrect,
      passed
    };
  };

  // Resultado do simulado
  const result = hasSubmitted ? calculateResult() : null;

  return (
    <StudentLayout
      title={simulado?.title || "Carregando..."}
      subtitle={`${simulado?.disciplineName || "Disciplina"} - ${simulado?.courseName || "Curso"}`}
      breadcrumbs={[
        { title: "Home", href: "/student" },
        { title: "Meus Cursos", href: "/student/courses" },
        { title: simulado?.courseName || "Curso", href: `/student/courses/${simulado?.courseId}` },
        { title: simulado?.disciplineName || "Disciplina", href: `/student/learning?disciplineId=${simulado?.disciplineId}` },
        { title: simulado?.title || "Simulado", href: `/student/discipline-simulado/${id}` }
      ]}
      backButton={!hasSubmitted ? {
        label: "Voltar para o curso",
        onClick: () => {
          if (answeredCount > 0) {
            if (confirm("Você tem respostas não enviadas. Deseja realmente sair?")) {
              window.history.back();
            }
          } else {
            window.history.back();
          }
        }
      } : undefined}
    >
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-8 w-2/3 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-medium text-red-800 mb-2">Erro ao carregar simulado</h3>
          <p className="text-red-600">
            Não foi possível carregar os detalhes do simulado. Por favor, tente novamente mais tarde.
          </p>
          <Button 
            variant="secondary" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </Button>
        </div>
      ) : hasSubmitted ? (
        // Tela de resultado e revisão
        <div className="space-y-6">
          {/* Painel de resultado */}
          <Card className={`p-6 ${result?.passed ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex flex-col items-center text-center py-4">
              {result?.passed ? (
                <CheckCircleIcon className="w-16 h-16 text-green-500 mb-4" />
              ) : (
                <AlertTriangleIcon className="w-16 h-16 text-amber-500 mb-4" />
              )}
              <h2 className="text-2xl font-bold mb-2">
                {result?.passed ? 'Parabéns! Você foi aprovado.' : 'Você não atingiu a pontuação mínima.'}
              </h2>
              <p className="text-gray-600 mb-4">
                Você acertou {result?.correctAnswers} de {result?.totalQuestions} questões ({result?.percentageCorrect.toFixed(1)}%).
              </p>
              <div className="w-full max-w-md">
                <Progress value={result?.percentageCorrect} className="h-3" />
                <div className="flex justify-between mt-2 text-sm">
                  <span>0%</span>
                  <span className={`${result?.passed ? 'text-green-600' : 'text-amber-600'} font-medium`}>
                    {simulado.minPercentToPass}% (Mínimo)
                  </span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Revisão de questões */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Revisão das questões</h3>
            <Accordion type="single" collapsible className="w-full">
              {simulado.questions.map((question, index) => {
                const isCorrect = selectedAnswers[index] === question.correctAnswer;
                const userAnswer = selectedAnswers[index];
                
                return (
                  <AccordionItem 
                    key={index} 
                    value={`question-${index}`}
                    className={`mb-4 border rounded-lg ${isCorrect ? 'border-green-200' : 'border-red-200'}`}
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center text-left">
                        <div className={`p-2 rounded-full mr-3 ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                          {isCorrect ? (
                            <CheckCircleIcon className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertTriangleIcon className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Questão {index + 1}</span>
                          <h4 className="font-medium text-base truncate max-w-md">
                            {question.text.length > 70 ? question.text.substring(0, 70) + '...' : question.text}
                          </h4>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="mt-2 mb-4">
                        <p className="text-gray-800">{question.text}</p>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        {question.options.map((option) => (
                          <div 
                            key={option.id} 
                            className={`p-3 rounded-lg border ${
                              option.id === question.correctAnswer ? 'bg-green-50 border-green-300' : 
                              option.id === userAnswer && option.id !== question.correctAnswer ? 'bg-red-50 border-red-300' : 
                              'border-gray-200'
                            }`}
                          >
                            <div className="flex items-center">
                              {option.id === question.correctAnswer ? (
                                <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                              ) : option.id === userAnswer && option.id !== question.correctAnswer ? (
                                <AlertTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
                              ) : (
                                <div className="w-5 h-5 mr-2" />
                              )}
                              <span className="font-medium mr-2">{option.id.toUpperCase()}.</span>
                              <span>{option.text}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h5 className="font-medium text-blue-800 mb-2">Explicação:</h5>
                        <p className="text-blue-700">{question.explanation}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
          
          {/* Botões de ação */}
          <div className="flex justify-between mt-6">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar ao curso
            </Button>
            <Button 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <CheckSquare className="w-4 h-4" />
              Tentar novamente
            </Button>
          </div>
        </div>
      ) : (
        // Tela de realização do simulado
        <div className="space-y-6">
          {/* Cabeçalho com instrução, timer e progresso */}
          <Card className="p-4 mb-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
                <span className="font-medium">Tempo restante: {formatTime(timeLeft)}</span>
              </div>
              <div className="flex items-center">
                <div className="mr-4">
                  <span className="font-medium">{answeredCount}/{simulado.totalQuestions} respondidas</span>
                </div>
                <div className="w-40">
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </div>
            </div>
          </Card>
          
          {/* Conteúdo do simulado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Navegação de questões (visível apenas em desktop) */}
            <div className="hidden md:block">
              <div className="bg-white p-4 rounded-lg border shadow-sm mb-4">
                <h3 className="font-medium text-gray-700 mb-3">Navegação</h3>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: simulado.totalQuestions }).map((_, i) => {
                    const isAnswered = selectedAnswers[i] !== undefined;
                    const isReview = markedForReview.includes(i);
                    const isCurrent = i === currentQuestion;
                    
                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentQuestion(i)}
                        className={`h-10 w-10 rounded-lg flex items-center justify-center font-medium text-sm relative ${
                          isCurrent 
                            ? 'bg-primary text-white border-2 border-primary'
                            : isAnswered && isReview
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : isAnswered
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : isReview
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}
                      >
                        {i + 1}
                        {isReview && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm">
                    <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded mr-2"></div>
                    <span>Respondida ({answeredCount})</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-4 h-4 bg-amber-50 border border-amber-200 rounded mr-2"></div>
                    <span>Marcada para revisão ({reviewCount})</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded mr-2"></div>
                    <span>Não respondida ({simulado.totalQuestions - answeredCount})</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="font-medium text-gray-700 mb-3">Instruções</h3>
                <p className="text-sm text-gray-600">{simulado.instructions}</p>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm">
                    <AlertTriangleIcon className="w-4 h-4 text-amber-500 mr-2" />
                    <span>Questões marcadas para revisão não serão enviadas automaticamente.</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <ClockIcon className="w-4 h-4 text-red-500 mr-2" />
                    <span>O simulado será enviado automaticamente quando o tempo acabar.</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Questão atual */}
            <div className="md:col-span-2">
              <Card className="p-6">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Questão {currentQuestion + 1} de {simulado.totalQuestions}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleMarkForReview(currentQuestion)}
                      className={`gap-2 ${markedForReview.includes(currentQuestion) ? 'bg-amber-50 text-amber-800 border-amber-300' : ''}`}
                    >
                      <Flag className="h-4 w-4" />
                      {markedForReview.includes(currentQuestion) ? 'Remover marcação' : 'Marcar para revisão'}
                    </Button>
                  </div>
                  
                  <p className="text-gray-800 mb-6">{simulado.questions[currentQuestion].text}</p>
                  
                  <RadioGroup 
                    value={selectedAnswers[currentQuestion] || ""}
                    onValueChange={(value) => handleAnswerSelect(currentQuestion, value)}
                    className="space-y-3"
                  >
                    {simulado.questions[currentQuestion].options.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value={option.id} id={`option-${option.id}`} />
                        <Label htmlFor={`option-${option.id}`} className="flex-1 cursor-pointer">
                          <span className="font-medium mr-2">{option.id.toUpperCase()}.</span>
                          {option.text}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                
                <div className="flex justify-between mt-6">
                  <Button 
                    variant="outline" 
                    onClick={prevQuestion}
                    disabled={currentQuestion === 0}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      onClick={saveProgress}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Salvar
                    </Button>
                    <Button 
                      variant="default" 
                      onClick={currentQuestion === simulado.totalQuestions - 1 ? openSubmitDialog : nextQuestion}
                      className="gap-2"
                    >
                      {currentQuestion === simulado.totalQuestions - 1 ? (
                        <>
                          <Eye className="h-4 w-4" />
                          Finalizar
                        </>
                      ) : (
                        <>
                          Próxima
                          <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
              
              {/* Navegação mobile */}
              <div className="md:hidden mt-4">
                <Accordion type="single" collapsible>
                  <AccordionItem value="questoes">
                    <AccordionTrigger className="py-3">Navegação de questões</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-5 gap-2">
                        {Array.from({ length: simulado.totalQuestions }).map((_, i) => {
                          const isAnswered = selectedAnswers[i] !== undefined;
                          const isReview = markedForReview.includes(i);
                          const isCurrent = i === currentQuestion;
                          
                          return (
                            <button
                              key={i}
                              onClick={() => setCurrentQuestion(i)}
                              className={`h-10 w-10 rounded-lg flex items-center justify-center font-medium text-sm relative ${
                                isCurrent 
                                  ? 'bg-primary text-white border-2 border-primary'
                                  : isAnswered && isReview
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : isAnswered
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : isReview
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-gray-100 text-gray-800 border border-gray-200'
                              }`}
                            >
                              {i + 1}
                              {isReview && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full"></span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center text-sm">
                          <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded mr-2"></div>
                          <span>Respondida ({answeredCount})</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <div className="w-4 h-4 bg-amber-50 border border-amber-200 rounded mr-2"></div>
                          <span>Marcada para revisão ({reviewCount})</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded mr-2"></div>
                          <span>Não respondida ({simulado.totalQuestions - answeredCount})</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="instrucoes">
                    <AccordionTrigger className="py-3">Instruções</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-gray-600">{simulado.instructions}</p>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center text-sm">
                          <AlertTriangleIcon className="w-4 h-4 text-amber-500 mr-2" />
                          <span>Questões marcadas para revisão não serão enviadas automaticamente.</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <ClockIcon className="w-4 h-4 text-red-500 mr-2" />
                          <span>O simulado será enviado automaticamente quando o tempo acabar.</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>
          
          {/* Diálogo de confirmação de envio */}
          <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Finalizar simulado?</DialogTitle>
                <DialogDescription>
                  Você respondeu {answeredCount} de {simulado.totalQuestions} questões.
                  {markedForReview.length > 0 && (
                    ` Você tem ${markedForReview.length} questões marcadas para revisão.`
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangleIcon className="w-5 h-5 text-amber-500 mt-0.5" />
                  <p className="text-sm text-gray-600">
                    Depois de enviado, você não poderá modificar suas respostas. Tem certeza que deseja finalizar?
                  </p>
                </div>
                {(simulado.totalQuestions - answeredCount) > 0 && (
                  <div className="bg-amber-50 p-3 rounded-md flex items-start space-x-3">
                    <AlertTriangleIcon className="w-5 h-5 text-amber-500 mt-0.5" />
                    <p className="text-sm text-amber-800">
                      Atenção! Você ainda tem {simulado.totalQuestions - answeredCount} questões não respondidas.
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
                  Continuar simulado
                </Button>
                <Button 
                  onClick={handleSubmitSimulado}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Enviando..." : "Finalizar simulado"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </StudentLayout>
  );
}