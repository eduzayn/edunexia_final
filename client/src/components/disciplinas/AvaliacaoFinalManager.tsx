
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
