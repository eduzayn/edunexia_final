
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
  TableBody
} from "@/components/ui";
import { PlusIcon, TrashIcon, PencilIcon, PlusCircleIcon, MinusCircleIcon, CheckCircleIcon } from "lucide-react";
import { Simulado, Question } from "@/types/pedagogico";

interface SimuladoManagerProps {
  disciplineId: string | number;
}

export default function SimuladoManager({ disciplineId }: SimuladoManagerProps) {
  const [simulado, setSimulado] = useState<Simulado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Simulado>>({
    title: '',
    description: '',
    timeLimit: 60,
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
    async function fetchSimulado() {
      try {
        setLoading(true);
        const response = await fetch(`/api/disciplines/${disciplineId}/simulado`);
        if (!response.ok) {
          if (response.status === 404) {
            // Não existe simulado para esta disciplina, o que é normal
            setSimulado(null);
            return;
          }
          throw new Error('Falha ao carregar simulado');
        }
        const data = await response.json();
        setSimulado(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar simulado');
        console.error('Erro ao carregar simulado:', err);
      } finally {
        setLoading(false);
      }
    }

    if (disciplineId) {
      fetchSimulado();
    }
  }, [disciplineId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'timeLimit' ? Number(value) : value 
    }));
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
      timeLimit: 60,
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
    if (simulado) {
      setFormData({
        title: simulado.title,
        description: simulado.description || '',
        timeLimit: simulado.timeLimit || 60,
        questions: [...simulado.questions],
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
      setError('O simulado deve ter pelo menos uma questão');
      return;
    }

    try {
      setIsProcessing(true);
      
      const method = simulado ? 'PUT' : 'POST';
      const response = await fetch(`/api/disciplines/${disciplineId}/simulado`, {
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
        throw new Error(`Falha ao ${simulado ? 'atualizar' : 'adicionar'} simulado`);
      }

      const updatedSimulado = await response.json();
      setSimulado(updatedSimulado);
      
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Erro ao ${simulado ? 'atualizar' : 'adicionar'} simulado`);
      console.error(`Erro ao ${simulado ? 'atualizar' : 'adicionar'} simulado:`, err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este simulado?')) {
      return;
    }

    try {
      const response = await fetch(`/api/disciplines/${disciplineId}/simulado`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Falha ao excluir simulado');
      }

      setSimulado(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir simulado');
      console.error('Erro ao excluir simulado:', err);
    }
  };

  if (loading) {
    return <div>Carregando simulado...</div>;
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-end mb-4">
        {!simulado ? (
          <Button onClick={openAddDialog}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Criar Simulado
          </Button>
        ) : (
          <Button onClick={openEditDialog}>
            <PencilIcon className="h-4 w-4 mr-2" />
            Editar Simulado
          </Button>
        )}
      </div>

      {!simulado ? (
        <div className="text-center p-8 bg-gray-50 rounded-md">
          <p className="text-gray-500">
            Nenhum simulado cadastrado para esta disciplina
          </p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{simulado.title}</CardTitle>
            {simulado.description && (
              <p className="text-gray-600">{simulado.description}</p>
            )}
            <div className="text-sm text-gray-500">
              <p>Tempo limite: {simulado.timeLimit || 60} minutos</p>
              <p>Quantidade de questões: {simulado.questions.length}</p>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="text-lg font-medium mb-4">Questões</h3>
            <div className="space-y-4">
              {simulado.questions.map((question, i) => (
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
                  {question.explanation && (
                    <div className="text-sm bg-gray-50 p-3 rounded-md border-l-4 border-blue-300">
                      <p className="font-medium">Explicação:</p>
                      <p>{question.explanation}</p>
                    </div>
                  )}
                </Card>
              ))}
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

      {/* Dialog do Simulado */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>
              {simulado ? 'Editar Simulado' : 'Criar Simulado'}
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
                {isProcessing ? 'Processando...' : (simulado ? 'Salvar Alterações' : 'Criar Simulado')}
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
import { AlertCircle, Edit, Trash, Plus, ClipboardList } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Esquema de validação para simulados
const simuladoSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres'),
  duration: z.number().min(1, 'A duração deve ser de pelo menos 1 minuto').or(
    z.string().refine(val => !isNaN(Number(val)), {
      message: 'A duração deve ser um número'
    }).transform(val => Number(val))
  ),
  totalQuestions: z.number().min(1, 'O simulado deve ter pelo menos 1 questão').or(
    z.string().refine(val => !isNaN(Number(val)), {
      message: 'O número de questões deve ser um número'
    }).transform(val => Number(val))
  )
});

type SimuladoFormValues = z.infer<typeof simuladoSchema>;

interface Simulado {
  id: string;
  title: string;
  description: string;
  duration: number;
  totalQuestions: number;
  createdAt: string;
}

interface SimuladoManagerProps {
  disciplineId?: string;
}

export default function SimuladoManager({ disciplineId }: SimuladoManagerProps) {
  const [simulados, setSimulados] = useState<Simulado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSimulado, setEditingSimulado] = useState<Simulado | null>(null);

  const form = useForm<SimuladoFormValues>({
    resolver: zodResolver(simuladoSchema),
    defaultValues: {
      title: '',
      description: '',
      duration: 30,
      totalQuestions: 10
    }
  });

  useEffect(() => {
    if (disciplineId) {
      // Aqui seria a chamada para a API para buscar os simulados da disciplina
      // Por enquanto, vamos simular com dados fictícios
      setTimeout(() => {
        setSimulados([
          {
            id: '1',
            title: 'Simulado de Avaliação 1',
            description: 'Simulado com questões sobre os primeiros módulos da disciplina',
            duration: 60,
            totalQuestions: 20,
            createdAt: '2023-04-10'
          }
        ]);
        setIsLoading(false);
      }, 1000);
    }
  }, [disciplineId]);

  const handleAddSimulado = (data: SimuladoFormValues) => {
    if (editingSimulado) {
      // Editar simulado existente
      const updatedSimulados = simulados.map(s => 
        s.id === editingSimulado.id ? 
        { 
          ...s, 
          title: data.title,
          description: data.description,
          duration: data.duration,
          totalQuestions: data.totalQuestions
        } : s
      );
      setSimulados(updatedSimulados);
    } else {
      // Adicionar novo simulado
      const newSimulado: Simulado = {
        id: Date.now().toString(),
        title: data.title,
        description: data.description,
        duration: data.duration,
        totalQuestions: data.totalQuestions,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setSimulados([...simulados, newSimulado]);
    }
    
    setIsAddDialogOpen(false);
    setEditingSimulado(null);
    form.reset();
  };

  const handleEditSimulado = (simulado: Simulado) => {
    setEditingSimulado(simulado);
    form.reset({
      title: simulado.title,
      description: simulado.description,
      duration: simulado.duration,
      totalQuestions: simulado.totalQuestions
    });
    setIsAddDialogOpen(true);
  };

  const handleDeleteSimulado = (id: string) => {
    // Aqui seria a chamada para a API para excluir o simulado
    // Por enquanto, apenas atualizamos o estado local
    const updatedSimulados = simulados.filter(s => s.id !== id);
    setSimulados(updatedSimulados);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Carregando simulados...</div>;
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
        <h2 className="text-xl font-semibold">Simulados da Disciplina</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingSimulado(null);
              form.reset({
                title: '',
                description: '',
                duration: 30,
                totalQuestions: 10
              });
            }}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Simulado
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{editingSimulado ? 'Editar Simulado' : 'Adicionar Novo Simulado'}</DialogTitle>
              <DialogDescription>
                Preencha os dados para {editingSimulado ? 'editar o' : 'adicionar um novo'} simulado à disciplina.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddSimulado)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Título do simulado" {...field} />
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
                        <Textarea placeholder="Descrição do simulado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
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
                  <Button type="submit">{editingSimulado ? 'Salvar Alterações' : 'Adicionar Simulado'}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {simulados.length === 0 ? (
        <Card className="text-center p-6">
          <div className="flex flex-col items-center justify-center p-4">
            <ClipboardList className="h-12 w-12 text-gray-400 mb-2" />
            <h3 className="text-lg font-medium">Nenhum Simulado Cadastrado</h3>
            <p className="text-sm text-gray-500 mb-4">Adicione simulados para esta disciplina.</p>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingSimulado(null);
                form.reset({
                  title: '',
                  description: '',
                  duration: 30,
                  totalQuestions: 10
                });
              }}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar Primeiro Simulado
              </Button>
            </DialogTrigger>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {simulados.map((simulado) => (
            <Card key={simulado.id}>
              <CardHeader>
                <CardTitle className="text-lg">{simulado.title}</CardTitle>
                <CardDescription>
                  Criado em: {simulado.createdAt}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{simulado.description}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-100 p-2 rounded-md">
                    <span className="font-medium">Duração:</span> {simulado.duration} minutos
                  </div>
                  <div className="bg-gray-100 p-2 rounded-md">
                    <span className="font-medium">Questões:</span> {simulado.totalQuestions}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">
                  Ver Questões
                </Button>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditSimulado(simulado)}>
                    <Edit className="h-4 w-4 mr-1" /> Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteSimulado(simulado.id)}>
                    <Trash className="h-4 w-4 mr-1" /> Excluir
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
