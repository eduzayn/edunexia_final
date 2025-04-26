
import { useState, useEffect } from 'react';
import { 
  Button, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  Input,
  Label,
  Textarea,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
  Switch,
} from "@/components/ui";
import { PlusIcon, TrashIcon, PencilIcon, PlusCircleIcon, CheckCircleIcon } from "lucide-react";
import { AvaliacaoFinal, Question } from "@/types/pedagogico";

interface AvaliacaoFinalManagerProps {
  disciplineId: string | number;
}

export default function AvaliacaoFinalManager({ disciplineId }: AvaliacaoFinalManagerProps) {
  const [avaliacao, setAvaliacao] = useState<AvaliacaoFinal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<AvaliacaoFinal>>({
    title: '',
    description: '',
    timeLimit: 120,
    passingScore: 70,
    allowRetake: true,
    maxAttempts: 3,
    showExplanations: true,
    questions: [],
  });
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    text: '',
    options: ['', '', '', ''],
    correctOption: 0,
    explanation: '',
  });
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function fetchAvaliacaoFinal() {
      try {
        setLoading(true);
        const response = await fetch(`/api/disciplines/${disciplineId}/avaliacao_final`);
        if (!response.ok) {
          if (response.status === 404) {
            // Não existe avaliação final para esta disciplina, o que é normal
            setAvaliacao(null);
            return;
          }
          throw new Error('Falha ao carregar avaliação final');
        }
        const data = await response.json();
        setAvaliacao(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar avaliação final');
        console.error('Erro ao carregar avaliação final:', err);
      } finally {
        setLoading(false);
      }
    }

    if (disciplineId) {
      fetchAvaliacaoFinal();
    }
  }, [disciplineId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: ['timeLimit', 'passingScore', 'maxAttempts'].includes(name) ? Number(value) : value 
    }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleQuestionInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentQuestion(prev => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...currentQuestion.options!];
    newOptions[index] = value;
    setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      timeLimit: 120,
      passingScore: 70,
      allowRetake: true,
      maxAttempts: 3,
      showExplanations: true,
      questions: [],
    });
  };

  const resetQuestionForm = () => {
    setCurrentQuestion({
      text: '',
      options: ['', '', '', ''],
      correctOption: 0,
      explanation: '',
    });
    setEditingQuestionIndex(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = () => {
    if (avaliacao) {
      setFormData({
        title: avaliacao.title,
        description: avaliacao.description || '',
        timeLimit: avaliacao.timeLimit || 120,
        passingScore: avaliacao.passingScore,
        allowRetake: avaliacao.allowRetake,
        maxAttempts: avaliacao.maxAttempts || 3,
        showExplanations: avaliacao.showExplanations,
        questions: [...avaliacao.questions],
      });
    }
    setDialogOpen(true);
  };

  const openAddQuestionDialog = () => {
    resetQuestionForm();
    setQuestionDialogOpen(true);
  };

  const openEditQuestionDialog = (index: number) => {
    const question = formData.questions![index];
    setCurrentQuestion({
      text: question.text,
      options: [...question.options],
      correctOption: question.correctOption,
      explanation: question.explanation || '',
    });
    setEditingQuestionIndex(index);
    setQuestionDialogOpen(true);
  };

  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentQuestion.text || currentQuestion.options?.some(opt => !opt)) {
      setError('Preencha o texto da questão e todas as opções');
      return;
    }

    const newQuestions = [...(formData.questions || [])];
    
    if (editingQuestionIndex !== null) {
      newQuestions[editingQuestionIndex] = currentQuestion as Question;
    } else {
      newQuestions.push(currentQuestion as Question);
    }
    
    setFormData(prev => ({ ...prev, questions: newQuestions }));
    setQuestionDialogOpen(false);
    resetQuestionForm();
  };

  const removeQuestion = (index: number) => {
    const newQuestions = [...(formData.questions || [])];
    newQuestions.splice(index, 1);
    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      setError('Título é um campo obrigatório');
      return;
    }

    if (!formData.questions || formData.questions.length === 0) {
      setError('A avaliação final deve ter pelo menos uma questão');
      return;
    }

    try {
      setIsProcessing(true);
      
      const method = avaliacao ? 'PUT' : 'POST';
      const response = await fetch(`/api/disciplines/${disciplineId}/avaliacao_final`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          disciplineId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Falha ao ${avaliacao ? 'atualizar' : 'adicionar'} avaliação final`);
      }

      const updatedAvaliacao = await response.json();
      setAvaliacao(updatedAvaliacao);
      
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Erro ao ${avaliacao ? 'atualizar' : 'adicionar'} avaliação final`);
      console.error(`Erro ao ${avaliacao ? 'atualizar' : 'adicionar'} avaliação final:`, err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta avaliação final?')) {
      return;
    }

    try {
      const response = await fetch(`/api/disciplines/${disciplineId}/avaliacao_final`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Falha ao excluir avaliação final');
      }

      setAvaliacao(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir avaliação final');
      console.error('Erro ao excluir avaliação final:', err);
    }
  };

  if (loading) {
    return <div>Carregando avaliação final...</div>;
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-end mb-4">
        {!avaliacao ? (
          <Button onClick={openAddDialog}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Criar Avaliação Final
          </Button>
        ) : (
          <Button onClick={openEditDialog}>
            <PencilIcon className="h-4 w-4 mr-2" />
            Editar Avaliação Final
          </Button>
        )}
      </div>

      {!avaliacao ? (
        <div className="text-center p-8 bg-gray-50 rounded-md">
          <p className="text-gray-500">
            Nenhuma avaliação final cadastrada para esta disciplina
          </p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{avaliacao.title}</CardTitle>
            {avaliacao.description && (
              <p className="text-gray-600">{avaliacao.description}</p>
            )}
            <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
              <div>
                <p>Tempo limite: {avaliacao.timeLimit || 120} minutos</p>
                <p>Nota para aprovação: {avaliacao.passingScore}%</p>
              </div>
              <div>
                <p>Permite novas tentativas: {avaliacao.allowRetake ? 'Sim' : 'Não'}</p>
                {avaliacao.allowRetake && avaliacao.maxAttempts && (
                  <p>Máximo de tentativas: {avaliacao.maxAttempts}</p>
                )}
                <p>Exibe explicações: {avaliacao.showExplanations ? 'Sim' : 'Não'}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Questões ({avaliacao.questions.length})</h3>
            
            <div className="space-y-4 mt-4">
              {avaliacao.questions.slice(0, 3).map((question, i) => (
                <Card key={i} className="p-4">
                  <p className="font-medium mb-2">
                    {i + 1}. {question.text}
                  </p>
                  <ul className="list-disc pl-8 mb-4">
                    {question.options.map((option, j) => (
                      <li key={j} className={j === question.correctOption ? "font-medium text-green-600" : ""}>
                        {option} {j === question.correctOption && <CheckCircleIcon className="inline h-4 w-4" />}
                      </li>
                    ))}
                  </ul>
                  {question.explanation && avaliacao.showExplanations && (
                    <div className="text-sm bg-gray-50 p-3 rounded-md border-l-4 border-blue-300">
                      <p className="font-medium">Explicação:</p>
                      <p>{question.explanation}</p>
                    </div>
                  )}
                </Card>
              ))}
              
              {avaliacao.questions.length > 3 && (
                <div className="text-center p-4 bg-gray-50 rounded-md">
                  <p className="text-gray-500">
                    + {avaliacao.questions.length - 3} questões adicionais
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={openEditDialog}>
                <PencilIcon className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <TrashIcon className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog da Avaliação Final */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>
              {avaliacao ? 'Editar Avaliação Final' : 'Criar Avaliação Final'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="timeLimit">Tempo Limite (minutos)</Label>
                  <Input
                    id="timeLimit"
                    name="timeLimit"
                    type="number"
                    min="1"
                    value={formData.timeLimit}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="passingScore">Nota para Aprovação (%)</Label>
                  <Input
                    id="passingScore"
                    name="passingScore"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.passingScore}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1 flex items-center space-x-2">
                  <Switch
                    id="allowRetake"
                    checked={formData.allowRetake}
                    onCheckedChange={(checked) => handleSwitchChange('allowRetake', checked)}
                  />
                  <Label htmlFor="allowRetake">Permitir novas tentativas</Label>
                </div>
                
                {formData.allowRetake && (
                  <div className="flex-1 grid gap-2">
                    <Label htmlFor="maxAttempts">Máximo de tentativas</Label>
                    <Input
                      id="maxAttempts"
                      name="maxAttempts"
                      type="number"
                      min="1"
                      value={formData.maxAttempts}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="showExplanations"
                  checked={formData.showExplanations}
                  onCheckedChange={(checked) => handleSwitchChange('showExplanations', checked)}
                />
                <Label htmlFor="showExplanations">Exibir explicações das respostas</Label>
              </div>
              
              <Separator className="my-2" />
              
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Questões</h3>
                  <Button type="button" size="sm" onClick={openAddQuestionDialog}>
                    <PlusCircleIcon className="h-4 w-4 mr-2" />
                    Adicionar Questão
                  </Button>
                </div>
                
                {formData.questions?.length === 0 ? (
                  <div className="text-center p-4 bg-gray-50 rounded-md">
                    <p className="text-gray-500">Nenhuma questão adicionada</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nº</TableHead>
                        <TableHead>Pergunta</TableHead>
                        <TableHead>Opções</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.questions?.map((question, i) => (
                        <TableRow key={i}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {question.text}
                          </TableCell>
                          <TableCell>{question.options.length}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                type="button" 
                                size="sm" 
                                variant="outline"
                                onClick={() => openEditQuestionDialog(i)}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button 
                                type="button" 
                                size="sm" 
                                variant="destructive"
                                onClick={() => removeQuestion(i)}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing ? 'Processando...' : (avaliacao ? 'Salvar Alterações' : 'Criar Avaliação Final')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Questão */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {editingQuestionIndex !== null ? 'Editar Questão' : 'Adicionar Questão'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuestionSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="text">Pergunta</Label>
                <Textarea
                  id="text"
                  name="text"
                  value={currentQuestion.text}
                  onChange={handleQuestionInputChange}
                  rows={3}
                  required
                />
              </div>
              
              <div className="space-y-3">
                <Label>Opções de Resposta</Label>
                {currentQuestion.options?.map((option, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                      placeholder={`Opção ${i + 1}`}
                      required
                    />
                    <div className="flex-shrink-0">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="correctOption"
                          checked={currentQuestion.correctOption === i}
                          onChange={() => setCurrentQuestion(prev => ({ ...prev, correctOption: i }))}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">Correta</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="explanation">Explicação (opcional)</Label>
                <Textarea
                  id="explanation"
                  name="explanation"
                  value={currentQuestion.explanation}
                  onChange={handleQuestionInputChange}
                  rows={3}
                  placeholder="Explique por que a resposta está correta..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setQuestionDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingQuestionIndex !== null ? 'Salvar Alterações' : 'Adicionar Questão'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Edit, Trash, Plus, FileSpreadsheet } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

// Esquema de validação para avaliação final
const avaliacaoFinalSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres'),
  duration: z.number().min(1, 'A duração deve ser de pelo menos 1 minuto').or(
    z.string().refine(val => !isNaN(Number(val)), {
      message: 'A duração deve ser um número'
    }).transform(val => Number(val))
  ),
  passingScore: z.number().min(0, 'A nota mínima não pode ser negativa').max(10, 'A nota máxima é 10').or(
    z.string().refine(val => !isNaN(Number(val)), {
      message: 'A nota mínima deve ser um número'
    }).transform(val => Number(val))
  ),
  totalQuestions: z.number().min(1, 'A avaliação deve ter pelo menos 1 questão').or(
    z.string().refine(val => !isNaN(Number(val)), {
      message: 'O número de questões deve ser um número'
    }).transform(val => Number(val))
  )
});

type AvaliacaoFinalFormValues = z.infer<typeof avaliacaoFinalSchema>;

interface AvaliacaoFinal {
  id: string;
  title: string;
  description: string;
  duration: number;
  passingScore: number;
  totalQuestions: number;
  isActive: boolean;
  createdAt: string;
}

interface AvaliacaoFinalManagerProps {
  disciplineId?: string;
}

export default function AvaliacaoFinalManager({ disciplineId }: AvaliacaoFinalManagerProps) {
  const [avaliacaoFinal, setAvaliacaoFinal] = useState<AvaliacaoFinal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const form = useForm<AvaliacaoFinalFormValues>({
    resolver: zodResolver(avaliacaoFinalSchema),
    defaultValues: {
      title: '',
      description: '',
      duration: 60,
      passingScore: 7,
      totalQuestions: 10
    }
  });

  useEffect(() => {
    if (disciplineId) {
      // Aqui seria a chamada para a API para buscar a avaliação final da disciplina
      // Por enquanto, vamos simular com dados fictícios
      setTimeout(() => {
        setAvaliacaoFinal({
          id: '1',
          title: 'Avaliação Final da Disciplina',
          description: 'Avaliação completa abrangendo todo o conteúdo da disciplina',
          duration: 90,
          passingScore: 7,
          totalQuestions: 20,
          isActive: true,
          createdAt: '2023-04-15'
        });
        setIsLoading(false);
      }, 1000);
    }
  }, [disciplineId]);

  const handleAddAvaliacaoFinal = (data: AvaliacaoFinalFormValues) => {
    // Aqui seria a chamada para a API para adicionar/atualizar a avaliação final
    // Por enquanto, apenas atualizamos o estado local
    const novaAvaliacao: AvaliacaoFinal = {
      id: avaliacaoFinal ? avaliacaoFinal.id : Date.now().toString(),
      title: data.title,
      description: data.description,
      duration: data.duration,
      passingScore: data.passingScore,
      totalQuestions: data.totalQuestions,
      isActive: avaliacaoFinal ? avaliacaoFinal.isActive : true,
      createdAt: avaliacaoFinal ? avaliacaoFinal.createdAt : new Date().toISOString().split('T')[0]
    };
    
    setAvaliacaoFinal(novaAvaliacao);
    setIsAddDialogOpen(false);
    form.reset();
  };

  const handleEditAvaliacaoFinal = () => {
    if (avaliacaoFinal) {
      form.reset({
        title: avaliacaoFinal.title,
        description: avaliacaoFinal.description,
        duration: avaliacaoFinal.duration,
        passingScore: avaliacaoFinal.passingScore,
        totalQuestions: avaliacaoFinal.totalQuestions
      });
      setIsAddDialogOpen(true);
    }
  };

  const handleDeleteAvaliacaoFinal = () => {
    // Aqui seria a chamada para a API para excluir a avaliação final
    // Por enquanto, apenas atualizamos o estado local
    setAvaliacaoFinal(null);
  };

  const toggleAvaliacaoStatus = () => {
    if (avaliacaoFinal) {
      // Aqui seria a chamada para a API para alternar o status da avaliação
      // Por enquanto, apenas atualizamos o estado local
      setAvaliacaoFinal({
        ...avaliacaoFinal,
        isActive: !avaliacaoFinal.isActive
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Carregando avaliação final...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Avaliação Final</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              if (!avaliacaoFinal) {
                form.reset({
                  title: '',
                  description: '',
                  duration: 60,
                  passingScore: 7,
                  totalQuestions: 10
                });
              }
            }}>
              {avaliacaoFinal ? <Edit className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
              {avaliacaoFinal ? 'Editar Avaliação Final' : 'Adicionar Avaliação Final'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{avaliacaoFinal ? 'Editar Avaliação Final' : 'Adicionar Avaliação Final'}</DialogTitle>
              <DialogDescription>
                Preencha os dados para {avaliacaoFinal ? 'editar a' : 'adicionar uma nova'} avaliação final à disciplina.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddAvaliacaoFinal)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Título da avaliação final" {...field} />
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
                        <Textarea placeholder="Descrição da avaliação final" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duração (minutos)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
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
                        <FormLabel>Nota Mínima</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" max="10" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="totalQuestions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Questões</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">{avaliacaoFinal ? 'Salvar Alterações' : 'Adicionar Avaliação Final'}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {!avaliacaoFinal ? (
        <Card className="text-center p-6">
          <div className="flex flex-col items-center justify-center p-4">
            <FileSpreadsheet className="h-12 w-12 text-gray-400 mb-2" />
            <h3 className="text-lg font-medium">Nenhuma Avaliação Final Cadastrada</h3>
            <p className="text-sm text-gray-500 mb-4">Adicione uma avaliação final para esta disciplina.</p>
            <DialogTrigger asChild>
              <Button onClick={() => {
                form.reset({
                  title: '',
                  description: '',
                  duration: 60,
                  passingScore: 7,
                  totalQuestions: 10
                });
              }}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar Avaliação Final
              </Button>
            </DialogTrigger>
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl">{avaliacaoFinal.title}</CardTitle>
              <CardDescription className="mt-1">
                Criada em: {avaliacaoFinal.createdAt}
              </CardDescription>
            </div>
            <Badge variant={avaliacaoFinal.isActive ? "success" : "secondary"}>
              {avaliacaoFinal.isActive ? "Ativa" : "Inativa"}
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">{avaliacaoFinal.description}</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-100 p-3 rounded-md">
                <p className="text-xs text-gray-500">Duração</p>
                <p className="font-medium">{avaliacaoFinal.duration} minutos</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-md">
                <p className="text-xs text-gray-500">Nota Mínima</p>
                <p className="font-medium">{avaliacaoFinal.passingScore}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-md">
                <p className="text-xs text-gray-500">Total de Questões</p>
                <p className="font-medium">{avaliacaoFinal.totalQuestions}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant={avaliacaoFinal.isActive ? "outline" : "default"}
              onClick={toggleAvaliacaoStatus}
            >
              {avaliacaoFinal.isActive ? "Desativar" : "Ativar"}
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleEditAvaliacaoFinal}>
                <Edit className="h-4 w-4 mr-1" /> Editar
              </Button>
              <Button variant="destructive" onClick={handleDeleteAvaliacaoFinal}>
                <Trash className="h-4 w-4 mr-1" /> Excluir
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
