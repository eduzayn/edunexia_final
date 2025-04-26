
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
