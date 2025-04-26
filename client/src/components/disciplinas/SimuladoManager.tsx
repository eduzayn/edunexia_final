import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { simuladoApi } from "@/api/pedagogico";
import { Simulado, Question } from "@/types/pedagogico";
import { PlusIcon, TrashIcon, PencilIcon, PlusCircleIcon } from "@/components/ui/icons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface SimuladoManagerProps {
  disciplineId: string;
}

export function SimuladoManager({ disciplineId }: SimuladoManagerProps) {
  const [simulados, setSimulados] = useState<Simulado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSimulado, setCurrentSimulado] = useState<Partial<Simulado>>({
    title: "",
    description: "",
    duration: 60,
    totalQuestions: 0,
    questions: []
  });

  const [selectedSimuladoId, setSelectedSimuladoId] = useState<string | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    text: "",
    options: ["", "", "", ""],
    isCorrect: [false, false, false, false]
  });
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);

  const fetchSimulados = async () => {
    try {
      setLoading(true);
      const data = await simuladoApi.getAll(disciplineId);
      setSimulados(data);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar simulados:", err);
      setError("Não foi possível carregar os simulados. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSimulados();
  }, [disciplineId]);

  const handleAddSimulado = async () => {
    try {
      setLoading(true);
      await simuladoApi.create(disciplineId, {
        title: currentSimulado.title || "",
        description: currentSimulado.description || "",
        duration: currentSimulado.duration || 60,
        totalQuestions: 0
      });
      setIsAdding(false);
      resetSimuladoForm();
      await fetchSimulados();
    } catch (err) {
      console.error("Erro ao adicionar simulado:", err);
      setError("Não foi possível adicionar o simulado. Verifique os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSimulado = async () => {
    if (!selectedSimuladoId) return;

    try {
      setLoading(true);
      await simuladoApi.update(disciplineId, selectedSimuladoId, {
        title: currentSimulado.title,
        description: currentSimulado.description,
        duration: currentSimulado.duration
      });
      setIsEditing(false);
      resetSimuladoForm();
      setSelectedSimuladoId(null);
      await fetchSimulados();
    } catch (err) {
      console.error("Erro ao atualizar simulado:", err);
      setError("Não foi possível atualizar o simulado. Verifique os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSimulado = async (simuladoId: string) => {
    if (!confirm("Tem certeza que deseja excluir este simulado? Todas as questões serão perdidas.")) return;

    try {
      setLoading(true);
      await simuladoApi.delete(disciplineId, simuladoId);
      await fetchSimulados();
    } catch (err) {
      console.error("Erro ao excluir simulado:", err);
      setError("Não foi possível excluir o simulado. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (simulado: Simulado) => {
    setCurrentSimulado({
      title: simulado.title,
      description: simulado.description,
      duration: simulado.duration
    });
    setSelectedSimuladoId(simulado.id);
    setIsEditing(true);
    setIsAdding(false);
  };

  const resetSimuladoForm = () => {
    setCurrentSimulado({
      title: "",
      description: "",
      duration: 60,
      totalQuestions: 0,
      questions: []
    });
  };

  const resetQuestionForm = () => {
    setCurrentQuestion({
      text: "",
      options: ["", "", "", ""],
      isCorrect: [false, false, false, false]
    });
  };

  // Métodos para gerenciar questões
  const handleAddQuestion = () => {
    // Aqui você adicionaria a lógica para salvar a questão
    // Por ora, vamos apenas fechar o modal
    setIsAddingQuestion(false);
    resetQuestionForm();
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(currentQuestion.options || ["", "", "", ""])];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const handleCorrectOptionChange = (index: number) => {
    const newIsCorrect = [false, false, false, false];
    newIsCorrect[index] = true;
    setCurrentQuestion({ ...currentQuestion, isCorrect: newIsCorrect });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Simulados</h2>
        <Button 
          onClick={() => {
            setIsAdding(true);
            setIsEditing(false);
            resetSimuladoForm();
          }}
          disabled={isAdding || isEditing}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Adicionar simulado
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {(isAdding || isEditing) && (
        <Card>
          <CardHeader>
            <CardTitle>{isAdding ? "Adicionar novo simulado" : "Editar simulado"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título</Label>
                <Input 
                  id="title" 
                  value={currentSimulado.title} 
                  onChange={e => setCurrentSimulado({...currentSimulado, title: e.target.value})}
                  placeholder="Título do simulado"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  id="description" 
                  value={currentSimulado.description} 
                  onChange={e => setCurrentSimulado({...currentSimulado, description: e.target.value})}
                  placeholder="Descrição do simulado"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="duration">Duração (minutos)</Label>
                <Input 
                  id="duration" 
                  type="number"
                  min={10}
                  value={currentSimulado.duration} 
                  onChange={e => setCurrentSimulado({...currentSimulado, duration: parseInt(e.target.value) || 60})}
                  placeholder="Duração em minutos"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAdding(false);
                    setIsEditing(false);
                    resetSimuladoForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={isAdding ? handleAddSimulado : handleUpdateSimulado}
                  disabled={loading || !currentSimulado.title}
                >
                  {isAdding ? "Adicionar" : "Atualizar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!isAdding && !isEditing && (
        <>
          {loading ? (
            <div className="text-center py-4">Carregando simulados...</div>
          ) : simulados.length === 0 ? (
            <div className="text-center py-6 border rounded-md bg-gray-50">
              <p className="text-gray-500">Nenhum simulado adicionado ainda.</p>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => setIsAdding(true)}
              >
                Adicionar primeiro simulado
              </Button>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {simulados.map((simulado) => (
                <AccordionItem key={simulado.id} value={simulado.id}>
                  <AccordionTrigger className="px-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="text-left">
                        <h3 className="text-md font-medium">{simulado.title}</h3>
                        <p className="text-sm text-gray-500">
                          {simulado.totalQuestions} questões • {simulado.duration} minutos
                        </p>
                      </div>
                      <div className="space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => startEdit(simulado)}
                        >
                          <PencilIcon className="mr-1 h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteSimulado(simulado.id)}
                        >
                          <TrashIcon className="mr-1 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0">
                    <div className="px-4 py-2 border-t">
                      <p className="text-sm mb-4">{simulado.description}</p>

                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-semibold">Questões do simulado</h4>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            setSelectedSimuladoId(simulado.id);
                            setIsAddingQuestion(true);
                            resetQuestionForm();
                          }}
                        >
                          <PlusCircleIcon className="mr-1 h-4 w-4" />
                          Adicionar questão
                        </Button>
                      </div>

                      {/* Tabela de questões ou mensagem se não houver */}
                      {simulado.totalQuestions === 0 ? (
                        <div className="text-center py-4 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-500">Nenhuma questão adicionada ainda.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12">#</TableHead>
                                <TableHead>Questão</TableHead>
                                <TableHead className="w-20">Opções</TableHead>
                                <TableHead className="w-24">Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {/* Simulação de questões - substituir por dados reais */}
                              {Array.from({ length: simulado.totalQuestions }).map((_, index) => (
                                <TableRow key={index}>
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell className="max-w-md truncate">
                                    Questão simulada {index + 1}
                                  </TableCell>
                                  <TableCell>{4}</TableCell>
                                  <TableCell>
                                    <div className="flex space-x-1">
                                      <Button size="sm" variant="ghost">
                                        <PencilIcon className="h-4 w-4" />
                                      </Button>
                                      <Button size="sm" variant="ghost">
                                        <TrashIcon className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </>
      )}

      {/* Modal de adição/edição de questão */}
      <Dialog open={isAddingQuestion} onOpenChange={setIsAddingQuestion}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingQuestionIndex !== null ? "Editar questão" : "Adicionar nova questão"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="question-text">Texto da questão</Label>
              <Textarea 
                id="question-text" 
                value={currentQuestion.text} 
                onChange={e => setCurrentQuestion({...currentQuestion, text: e.target.value})}
                placeholder="Digite a pergunta aqui..."
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <Label>Opções de resposta</Label>
              {currentQuestion.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input 
                    value={option} 
                    onChange={e => handleOptionChange(index, e.target.value)}
                    placeholder={`Opção ${index + 1}`}
                  />
                  <div className="flex items-center space-x-1">
                    <input 
                      type="radio" 
                      id={`correct-${index}`} 
                      name="correct-option"
                      checked={currentQuestion.isCorrect?.[index] || false}
                      onChange={() => handleCorrectOptionChange(index)}
                    />
                    <Label htmlFor={`correct-${index}`} className="text-sm">Correta</Label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingQuestion(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddQuestion}
              disabled={!currentQuestion.text || currentQuestion.options?.some(opt => !opt) || !currentQuestion.isCorrect?.includes(true)}
            >
              {editingQuestionIndex !== null ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
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