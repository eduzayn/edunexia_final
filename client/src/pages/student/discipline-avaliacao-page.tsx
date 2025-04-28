import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  PauseCircle,
  PlayCircle,
  Upload,
  FileText,
  Paperclip,
  X,
  Clock
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function DisciplineAvaliacaoPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [writtenAnswers, setWrittenAnswers] = useState<Record<number, string>>({});
  const [markedForReview, setMarkedForReview] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isPauseDialogOpen, setIsPauseDialogOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<number, File[]>>({});
  const [activeTab, setActiveTab] = useState("objetivas");
  
  // Mock data - em uma implementação real, isso viria da API
  const avaliacaoData = {
    id: parseInt(id || "1"),
    title: "Avaliação Final - Psicopedagogia Clínica",
    disciplineId: 1,
    disciplineName: "Fundamentos da Psicopedagogia Clínica",
    courseId: 101,
    courseName: "Pós-Graduação em Psicopedagogia Clínica e Institucional",
    description: "Esta é a avaliação final da disciplina de Fundamentos da Psicopedagogia Clínica.",
    instructions: "A avaliação está dividida em questões objetivas e dissertativas. Você tem 120 minutos para completar todas as questões. Você pode pausar a avaliação uma vez, mas o tempo continuará correndo em segundo plano.",
    timeLimit: 120, // em minutos
    canPause: true,
    minPercentToPass: 70,
    status: "not_started", // not_started, in_progress, paused, completed
    grade: null,
    startedAt: null,
    submittedAt: null,
    objective: {
      totalQuestions: 10,
      questions: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        text: `Questão ${i + 1}: Considerando os princípios da Psicopedagogia Clínica, qual abordagem é mais adequada para a intervenção em casos de dislexia?`,
        options: [
          { id: "a", text: "Abordagem comportamental, focada na repetição e memorização." },
          { id: "b", text: "Abordagem construtivista, baseada na construção ativa do conhecimento." },
          { id: "c", text: "Abordagem psicanalítica, centrada nos conflitos emocionais subjacentes." },
          { id: "d", text: "Abordagem médica, com ênfase na medicação e tratamento neurológico." },
          { id: "e", text: "Abordagem sociointeracionista, priorizando o contexto cultural e social." }
        ],
        correctAnswer: "b", // apenas no modo de revisão
        explanation: "A abordagem construtivista é mais adequada para casos de dislexia, pois permite que o indivíduo construa seu próprio conhecimento respeitando seu ritmo e estilo de aprendizagem." // apenas no modo de revisão
      })),
      weight: 60 // porcentagem da nota total
    },
    essay: {
      totalQuestions: 2,
      questions: [
        {
          id: 1,
          text: "Descreva o processo de avaliação psicopedagógica em um caso de dificuldade de aprendizagem na matemática (discalculia). Explique as etapas, os instrumentos utilizados e como elaborar um plano de intervenção adequado.",
          minWords: 200,
          maxWords: 500,
          teacherFeedback: "Resposta bem estruturada, abordando todas as etapas da avaliação psicopedagógica. Faltou aprofundar nos instrumentos específicos para avaliação da discalculia." // apenas no modo de revisão
        },
        {
          id: 2,
          text: "Analise o papel da família no processo de intervenção psicopedagógica. Como o psicopedagogo deve orientar os pais para que contribuam positivamente no tratamento de crianças com transtornos de aprendizagem?",
          minWords: 200,
          maxWords: 500,
          attachments: true,
          attachmentInstructions: "Faça upload de um modelo de orientação para pais que você desenvolveria como parte do plano de intervenção.",
          teacherFeedback: "Análise aprofundada sobre o papel da família, com boas estratégias práticas. O material anexado está bem elaborado e pode ser utilizado na prática profissional." // apenas no modo de revisão
        }
      ],
      weight: 40 // porcentagem da nota total
    }
  };

  // Consulta para obter os detalhes da avaliação
  const { data: avaliacao, isLoading, error } = useQuery({
    queryKey: ['/api-json/student/avaliacoes', id],
    queryFn: async () => {
      try {
        const response = await fetch(`/api-json/student/avaliacoes/${id}`);
        if (!response.ok) {
          // No ambiente de desenvolvimento, retornar dados fictícios
          return avaliacaoData;
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching avaliacao details:", error);
        // No ambiente de desenvolvimento, retornar dados fictícios
        return avaliacaoData;
      }
    }
  });

  // Inicializar o timer quando a avaliação é carregada
  useEffect(() => {
    if (avaliacao && !isPaused && !showResults) {
      // Em uma aplicação real, o tempo restante viria do backend
      // considerando quando a avaliação foi iniciada
      setTimeLeft(avaliacao.timeLimit * 60);
      
      const interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(interval);
            handleSubmitAvaliacao();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [avaliacao, isPaused, showResults]);

  // Formatar o tempo restante
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours > 0 ? `${hours}h ` : ''}${minutes.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  // Navegar para a próxima questão
  const nextQuestion = () => {
    if (avaliacao) {
      if (activeTab === "objetivas") {
        if (currentQuestion < avaliacao.objective.totalQuestions - 1) {
          setCurrentQuestion(currentQuestion + 1);
        } else {
          // Se estiver na última questão objetiva, mudar para a primeira dissertativa
          setActiveTab("dissertativas");
          setCurrentQuestion(0);
        }
      } else {
        if (currentQuestion < avaliacao.essay.totalQuestions - 1) {
          setCurrentQuestion(currentQuestion + 1);
        }
      }
    }
  };

  // Navegar para a questão anterior
  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else if (activeTab === "dissertativas") {
      // Se estiver na primeira questão dissertativa, voltar para a última objetiva
      setActiveTab("objetivas");
      setCurrentQuestion(avaliacao?.objective.totalQuestions ? avaliacao.objective.totalQuestions - 1 : 0);
    }
  };

  // Manipular a seleção de respostas objetivas
  const handleAnswerSelect = (questionIndex: number, optionId: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: optionId
    });
  };

  // Manipular respostas dissertativas
  const handleWrittenAnswerChange = (questionIndex: number, text: string) => {
    setWrittenAnswers({
      ...writtenAnswers,
      [questionIndex]: text
    });
  };

  // Alternar marcação de revisão para uma questão
  const toggleMarkForReview = (questionIndex: number, questionType: 'objective' | 'essay') => {
    const markerKey = questionType === 'objective' ? questionIndex : `essay_${questionIndex}`;
    if (markedForReview.includes(questionIndex)) {
      setMarkedForReview(markedForReview.filter(i => i !== questionIndex));
    } else {
      setMarkedForReview([...markedForReview, questionIndex]);
    }
  };

  // Manipular upload de arquivos
  const handleFileUpload = (questionIndex: number, files: FileList) => {
    const fileArray = Array.from(files);
    setUploadedFiles({
      ...uploadedFiles,
      [questionIndex]: [...(uploadedFiles[questionIndex] || []), ...fileArray]
    });
  };

  // Remover arquivo
  const removeFile = (questionIndex: number, fileIndex: number) => {
    if (uploadedFiles[questionIndex]) {
      const updatedFiles = [...uploadedFiles[questionIndex]];
      updatedFiles.splice(fileIndex, 1);
      setUploadedFiles({
        ...uploadedFiles,
        [questionIndex]: updatedFiles
      });
    }
  };

  // Contadores de progresso
  const answeredObjectiveCount = Object.keys(selectedAnswers).length;
  const answeredEssayCount = Object.keys(writtenAnswers).filter(key => 
    writtenAnswers[parseInt(key)]?.trim().length > 0
  ).length;
  
  const totalObjectiveQuestions = avaliacao?.objective.totalQuestions || 0;
  const totalEssayQuestions = avaliacao?.essay.totalQuestions || 0;
  
  const totalQuestions = totalObjectiveQuestions + totalEssayQuestions;
  const totalAnswered = answeredObjectiveCount + answeredEssayCount;
  
  const progressPercentage = (totalAnswered / totalQuestions) * 100;

  // Salvar o progresso atual
  const saveProgress = () => {
    // Em uma implementação real, salvar no servidor
    toast({
      title: "Progresso salvo",
      description: "Suas respostas foram salvas com sucesso.",
    });
  };

  // Pausar a avaliação
  const pauseAvaliacao = () => {
    if (avaliacao?.canPause) {
      setIsPaused(true);
      setIsPauseDialogOpen(false);
      
      // Em uma implementação real, notificar o servidor
      toast({
        title: "Avaliação pausada",
        description: "Sua avaliação foi pausada com sucesso. Você pode retornar mais tarde para continuá-la.",
      });
    }
  };

  // Retomar a avaliação
  const resumeAvaliacao = () => {
    setIsPaused(false);
    
    // Em uma implementação real, notificar o servidor
    toast({
      title: "Avaliação retomada",
      description: "Você retomou sua avaliação. O tempo continua correndo.",
    });
  };

  // Abrir diálogo de confirmação de envio
  const openSubmitDialog = () => {
    setIsSubmitDialogOpen(true);
  };

  // Enviar a avaliação
  const handleSubmitAvaliacao = () => {
    setIsSubmitting(true);
    
    // Simular envio para o servidor
    setTimeout(() => {
      setIsSubmitting(false);
      setShowResults(true);
      setIsSubmitDialogOpen(false);
      
      toast({
        title: "Avaliação enviada",
        description: "Sua avaliação foi enviada com sucesso e será corrigida pelo professor.",
      });
    }, 1500);
  };

  // Contar palavras em um texto
  const countWords = (text?: string) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Verificar se o número de palavras está dentro dos limites
  const isWordCountValid = (questionIndex: number) => {
    if (!avaliacao || !writtenAnswers[questionIndex]) return true;
    
    const question = avaliacao.essay.questions[questionIndex];
    const wordCount = countWords(writtenAnswers[questionIndex]);
    
    return wordCount >= question.minWords && wordCount <= question.maxWords;
  };

  // Calcular nota (somente para questões objetivas neste exemplo)
  const calculateGrade = () => {
    if (!avaliacao || !showResults) return null;
    
    let correctCount = 0;
    avaliacao.objective.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correctCount++;
      }
    });
    
    const objectiveScore = (correctCount / avaliacao.objective.totalQuestions) * avaliacao.objective.weight;
    
    // Em uma implementação real, a nota das questões dissertativas viria do professor
    const essayScore = 32; // exemplo: 80% de 40 (peso das dissertativas)
    
    const totalScore = objectiveScore + essayScore;
    const passed = totalScore >= avaliacao.minPercentToPass;
    
    return {
      objectiveScore,
      essayScore,
      totalScore,
      passed
    };
  };

  const grade = showResults ? calculateGrade() : null;

  return (
    <StudentLayout
      title={avaliacao?.title || "Carregando..."}
      subtitle={`${avaliacao?.disciplineName || "Disciplina"} - ${avaliacao?.courseName || "Curso"}`}
      breadcrumbs={[
        { title: "Home", href: "/student" },
        { title: "Meus Cursos", href: "/student/courses" },
        { title: avaliacao?.courseName || "Curso", href: `/student/courses/${avaliacao?.courseId}` },
        { title: avaliacao?.disciplineName || "Disciplina", href: `/student/learning?disciplineId=${avaliacao?.disciplineId}` },
        { title: avaliacao?.title || "Avaliação", href: `/student/discipline-avaliacao/${id}` }
      ]}
      backButton={(showResults || isPaused) ? {
        label: "Voltar para o curso",
        onClick: () => window.history.back()
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
          <h3 className="text-lg font-medium text-red-800 mb-2">Erro ao carregar avaliação</h3>
          <p className="text-red-600">
            Não foi possível carregar os detalhes da avaliação. Por favor, tente novamente mais tarde.
          </p>
          <Button 
            variant="secondary" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </Button>
        </div>
      ) : isPaused ? (
        // Tela de avaliação pausada
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-full p-8 mb-6">
            <PauseCircle className="h-16 w-16 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Avaliação pausada</h2>
          <p className="text-gray-600 mb-8 text-center max-w-md">
            Sua avaliação está pausada. O tempo continua correndo em segundo plano.
            Retome a avaliação para continuar respondendo às questões.
          </p>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar ao curso
            </Button>
            <Button 
              onClick={resumeAvaliacao}
              className="gap-2"
            >
              <PlayCircle className="h-4 w-4" />
              Retomar avaliação
            </Button>
          </div>
        </div>
      ) : showResults ? (
        // Tela de resultados (parciais, aguardando correção do professor)
        <div className="space-y-6">
          {/* Painel de resultado parcial */}
          <Card className="p-6">
            <div className="flex flex-col items-center text-center py-4">
              <ClockIcon className="w-16 h-16 text-blue-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">
                Avaliação enviada com sucesso
              </h2>
              <p className="text-gray-600 mb-6">
                Suas respostas foram registradas. As questões dissertativas serão corrigidas pelo professor.
              </p>
              
              <div className="w-full max-w-md mb-6">
                <h3 className="font-medium text-gray-700 mb-2">Resultado parcial (apenas questões objetivas)</h3>
                <div className="grid grid-cols-2 gap-4 text-left mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Acertos em objetivas</p>
                    <p className="font-medium">{Math.round(grade?.objectiveScore || 0) / (avaliacao?.objective.weight / 100)} de {avaliacao?.objective.totalQuestions}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nota parcial (objetivas)</p>
                    <p className="font-medium">{grade?.objectiveScore.toFixed(1)}% de {avaliacao?.objective.weight}%</p>
                  </div>
                </div>
                <Progress value={grade?.objectiveScore} className="h-3" />
                <p className="text-sm text-gray-500 mt-2">
                  A nota final será calculada após a correção das questões dissertativas.
                </p>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => window.history.back()}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar ao curso
              </Button>
            </div>
          </Card>
          
          {/* Revisão das questões objetivas */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Revisão das questões objetivas</h3>
            <Accordion type="single" collapsible className="w-full">
              {avaliacao.objective.questions.map((question, index) => {
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
          
          {/* Visão das questões dissertativas */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Suas respostas dissertativas</h3>
            <Accordion type="single" collapsible className="w-full">
              {avaliacao.essay.questions.map((question, index) => (
                <AccordionItem 
                  key={index} 
                  value={`essay-${index}`}
                  className="mb-4 border rounded-lg border-gray-200"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center text-left">
                      <div className="p-2 rounded-full mr-3 bg-blue-100">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Questão Dissertativa {index + 1}</span>
                        <h4 className="font-medium text-base truncate max-w-md">
                          {question.text.length > 70 ? question.text.substring(0, 70) + '...' : question.text}
                        </h4>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="mt-2 mb-4">
                      <p className="text-gray-800">{question.text}</p>
                      <div className="mt-2 text-sm text-gray-500">
                        <span>Limite de palavras: {question.minWords} - {question.maxWords}</span>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                      <h5 className="font-medium text-gray-800 mb-2">Sua resposta:</h5>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {writtenAnswers[index] || "Nenhuma resposta fornecida."}
                      </p>
                      
                      {question.attachments && uploadedFiles[index]?.length > 0 && (
                        <div className="mt-4">
                          <h6 className="font-medium text-gray-700 mb-2">Seus anexos:</h6>
                          <div className="space-y-2">
                            {uploadedFiles[index].map((file, fileIndex) => (
                              <div key={fileIndex} className="flex items-center p-2 bg-white rounded border border-gray-200">
                                <Paperclip className="h-4 w-4 text-gray-500 mr-2" />
                                <span className="text-sm">{file.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h5 className="font-medium text-blue-800 mb-2">Status:</h5>
                      <p className="text-blue-700">
                        Sua resposta foi registrada e está aguardando correção do professor.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      ) : (
        // Tela de realização da avaliação
        <div className="space-y-6">
          {/* Cabeçalho com instrução, timer e progresso */}
          <Card className="p-4 mb-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
                <span className="font-medium">Tempo restante: {formatTime(timeLeft)}</span>
                
                {avaliacao?.canPause && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-4"
                    onClick={() => setIsPauseDialogOpen(true)}
                  >
                    <PauseCircle className="h-4 w-4 mr-1" />
                    Pausar
                  </Button>
                )}
              </div>
              <div className="flex items-center">
                <div className="mr-4">
                  <span className="font-medium">{totalAnswered}/{totalQuestions} respondidas</span>
                </div>
                <div className="w-40">
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </div>
            </div>
          </Card>
          
          {/* Conteúdo da avaliação */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="objetivas">Questões Objetivas ({answeredObjectiveCount}/{totalObjectiveQuestions})</TabsTrigger>
              <TabsTrigger value="dissertativas">Questões Dissertativas ({answeredEssayCount}/{totalEssayQuestions})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="objetivas" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Navegação de questões (visível apenas em desktop) */}
                <div className="hidden md:block">
                  <div className="bg-white p-4 rounded-lg border shadow-sm mb-4">
                    <h3 className="font-medium text-gray-700 mb-3">Navegação</h3>
                    <div className="grid grid-cols-5 gap-2">
                      {Array.from({ length: avaliacao.objective.totalQuestions }).map((_, i) => {
                        const isAnswered = selectedAnswers[i] !== undefined;
                        const isReview = markedForReview.includes(i);
                        const isCurrent = i === currentQuestion && activeTab === "objetivas";
                        
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              setActiveTab("objetivas");
                              setCurrentQuestion(i);
                            }}
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
                        <span>Respondida ({answeredObjectiveCount})</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <div className="w-4 h-4 bg-amber-50 border border-amber-200 rounded mr-2"></div>
                        <span>Marcada para revisão ({markedForReview.filter(i => typeof i === 'number').length})</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded mr-2"></div>
                        <span>Não respondida ({avaliacao.objective.totalQuestions - answeredObjectiveCount})</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <h3 className="font-medium text-gray-700 mb-3">Instruções</h3>
                    <p className="text-sm text-gray-600">{avaliacao.instructions}</p>
                  </div>
                </div>
                
                {/* Questão objetiva atual */}
                <div className="md:col-span-2">
                  <Card className="p-6">
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Questão {currentQuestion + 1} de {avaliacao.objective.totalQuestions}</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleMarkForReview(currentQuestion, 'objective')}
                          className={`gap-2 ${markedForReview.includes(currentQuestion) ? 'bg-amber-50 text-amber-800 border-amber-300' : ''}`}
                        >
                          <Flag className="h-4 w-4" />
                          {markedForReview.includes(currentQuestion) ? 'Remover marcação' : 'Marcar para revisão'}
                        </Button>
                      </div>
                      
                      <p className="text-gray-800 mb-6">{avaliacao.objective.questions[currentQuestion].text}</p>
                      
                      <RadioGroup 
                        value={selectedAnswers[currentQuestion] || ""}
                        onValueChange={(value) => handleAnswerSelect(currentQuestion, value)}
                        className="space-y-3"
                      >
                        {avaliacao.objective.questions[currentQuestion].options.map((option) => (
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
                        disabled={currentQuestion === 0 && activeTab === "objetivas"}
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
                          onClick={nextQuestion}
                          className="gap-2"
                        >
                          Próxima
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="dissertativas" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Navegação de questões dissertativas (visível apenas em desktop) */}
                <div className="hidden md:block">
                  <div className="bg-white p-4 rounded-lg border shadow-sm mb-4">
                    <h3 className="font-medium text-gray-700 mb-3">Navegação</h3>
                    <div className="grid grid-cols-5 gap-2">
                      {Array.from({ length: avaliacao.essay.totalQuestions }).map((_, i) => {
                        const hasAnswer = writtenAnswers[i] && writtenAnswers[i].trim().length > 0;
                        const isReview = markedForReview.includes(`essay_${i}`);
                        const isCurrent = i === currentQuestion && activeTab === "dissertativas";
                        
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              setActiveTab("dissertativas");
                              setCurrentQuestion(i);
                            }}
                            className={`h-10 w-10 rounded-lg flex items-center justify-center font-medium text-sm relative ${
                              isCurrent 
                                ? 'bg-primary text-white border-2 border-primary'
                                : hasAnswer && isReview
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : hasAnswer
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
                        <span>Respondida ({answeredEssayCount})</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <div className="w-4 h-4 bg-amber-50 border border-amber-200 rounded mr-2"></div>
                        <span>Marcada para revisão ({markedForReview.filter(i => typeof i === 'string').length})</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded mr-2"></div>
                        <span>Não respondida ({avaliacao.essay.totalQuestions - answeredEssayCount})</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <h3 className="font-medium text-gray-700 mb-3">Instruções</h3>
                    <p className="text-sm text-gray-600">{avaliacao.instructions}</p>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center text-sm">
                        <Clock className="w-4 h-4 text-amber-500 mr-2" />
                        <span>As questões dissertativas serão corrigidas pelo professor.</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Questão dissertativa atual */}
                <div className="md:col-span-2">
                  <Card className="p-6">
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Questão Dissertativa {currentQuestion + 1}</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleMarkForReview(`essay_${currentQuestion}`, 'essay')}
                          className={`gap-2 ${markedForReview.includes(`essay_${currentQuestion}`) ? 'bg-amber-50 text-amber-800 border-amber-300' : ''}`}
                        >
                          <Flag className="h-4 w-4" />
                          {markedForReview.includes(`essay_${currentQuestion}`) ? 'Remover marcação' : 'Marcar para revisão'}
                        </Button>
                      </div>
                      
                      <p className="text-gray-800 mb-2">{avaliacao.essay.questions[currentQuestion].text}</p>
                      
                      <div className="mb-4 flex items-center text-sm">
                        <ClockIcon className="h-4 w-4 text-gray-500 mr-1" />
                        <span>
                          Limite de palavras: {avaliacao.essay.questions[currentQuestion].minWords} - {avaliacao.essay.questions[currentQuestion].maxWords}
                        </span>
                        
                        <div className="ml-auto">
                          <span className={`font-medium ${!isWordCountValid(currentQuestion) && writtenAnswers[currentQuestion] ? 'text-red-600' : 'text-gray-600'}`}>
                            {countWords(writtenAnswers[currentQuestion]) || 0} palavras
                          </span>
                        </div>
                      </div>
                      
                      <Textarea 
                        placeholder="Digite sua resposta aqui..."
                        value={writtenAnswers[currentQuestion] || ''}
                        onChange={(e) => handleWrittenAnswerChange(currentQuestion, e.target.value)}
                        className="min-h-[200px]"
                      />
                      
                      {avaliacao.essay.questions[currentQuestion].attachments && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Anexos</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            {avaliacao.essay.questions[currentQuestion].attachmentInstructions}
                          </p>
                          
                          <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-3 text-gray-500" />
                                <p className="text-sm text-gray-500">
                                  <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
                                </p>
                                <p className="text-xs text-gray-500">PDF, DOCX, JPG, PNG (máx. 10MB)</p>
                              </div>
                              <input 
                                type="file" 
                                className="hidden" 
                                onChange={(e) => e.target.files && handleFileUpload(currentQuestion, e.target.files)}
                                multiple 
                              />
                            </label>
                          </div>
                          
                          {uploadedFiles[currentQuestion]?.length > 0 && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium mb-2">Arquivos anexados:</h5>
                              <div className="space-y-2">
                                {uploadedFiles[currentQuestion].map((file, fileIndex) => (
                                  <div key={fileIndex} className="flex justify-between items-center p-2 bg-gray-50 rounded border">
                                    <div className="flex items-center">
                                      <Paperclip className="h-4 w-4 text-gray-500 mr-2" />
                                      <span className="text-sm">{file.name}</span>
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => removeFile(currentQuestion, fileIndex)}
                                    >
                                      <X className="h-4 w-4 text-gray-500" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between mt-6">
                      <Button 
                        variant="outline" 
                        onClick={prevQuestion}
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
                        {currentQuestion < avaliacao.essay.totalQuestions - 1 ? (
                          <Button 
                            variant="default" 
                            onClick={nextQuestion}
                            className="gap-2"
                          >
                            Próxima
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            variant="default" 
                            onClick={openSubmitDialog}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Finalizar
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Diálogo de confirmação de envio */}
          <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Finalizar avaliação?</DialogTitle>
                <DialogDescription>
                  Você respondeu {totalAnswered} de {totalQuestions} questões.
                  {markedForReview.length > 0 && (
                    ` Você tem ${markedForReview.length} questões marcadas para revisão.`
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangleIcon className="w-5 h-5 text-amber-500 mt-0.5" />
                  <p className="text-sm text-gray-600">
                    Depois de enviada, você não poderá modificar suas respostas. Tem certeza que deseja finalizar?
                  </p>
                </div>
                {(totalQuestions - totalAnswered) > 0 && (
                  <div className="bg-amber-50 p-3 rounded-md flex items-start space-x-3">
                    <AlertTriangleIcon className="w-5 h-5 text-amber-500 mt-0.5" />
                    <p className="text-sm text-amber-800">
                      Atenção! Você ainda tem {totalQuestions - totalAnswered} questões não respondidas.
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
                  Continuar avaliação
                </Button>
                <Button 
                  onClick={handleSubmitAvaliacao}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Enviando..." : "Finalizar avaliação"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Diálogo de confirmação de pausa */}
          <Dialog open={isPauseDialogOpen} onOpenChange={setIsPauseDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Pausar avaliação?</DialogTitle>
                <DialogDescription>
                  Você deseja pausar a avaliação? O tempo continuará correndo em segundo plano.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangleIcon className="w-5 h-5 text-amber-500 mt-0.5" />
                  <p className="text-sm text-gray-600">
                    Ao pausar, você poderá retomar a avaliação mais tarde. Suas respostas já preenchidas serão salvas.
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-md flex items-start space-x-3">
                  <ClockIcon className="w-5 h-5 text-blue-500 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    O tempo continuará correndo! Certifique-se de retornar antes que o tempo termine.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPauseDialogOpen(false)}>
                  Continuar avaliação
                </Button>
                <Button onClick={pauseAvaliacao}>
                  Pausar avaliação
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </StudentLayout>
  );
}