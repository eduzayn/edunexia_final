import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { avaliacaoFinalApi } from "@/api/pedagogico";
import { AvaliacaoFinal, Question } from "@/types/pedagogico";
import { PlusIcon, TrashIcon, PencilIcon, PlusCircleIcon, CheckCircleIcon } from "@/components/ui/icons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AvaliacaoFinalManagerProps {
  disciplineId: string;
}

export function AvaliacaoFinalManager({ disciplineId }: AvaliacaoFinalManagerProps) {
  const [avaliacao, setAvaliacao] = useState<AvaliacaoFinal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAvaliacao, setCurrentAvaliacao] = useState<Partial<AvaliacaoFinal>>({
    title: "",
    description: "",
    duration: 60,
    passingScore: 70,
    totalQuestions: 0,
    isActive: false
  });

  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    text: "",
    options: ["", "", "", ""],
    isCorrect: [false, false, false, false]
  });
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);

  const fetchAvaliacao = async () => {
    try {
      setLoading(true);
      const data = await avaliacaoFinalApi.get(disciplineId);
      setAvaliacao(data);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar avaliação final:", err);
      setError("Não foi possível carregar a avaliação final. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvaliacao();
  }, [disciplineId]);

  const handleAddAvaliacao = async () => {
    try {
      setLoading(true);
      await avaliacaoFinalApi.create(disciplineId, {
        title: currentAvaliacao.title || "",
        description: currentAvaliacao.description || "",
        duration: currentAvaliacao.duration || 60,
        passingScore: currentAvaliacao.passingScore || 70,
        totalQuestions: 0
      });
      setIsAdding(false);
      resetAvaliacaoForm();
      await fetchAvaliacao();
    } catch (err) {
      console.error("Erro ao adicionar avaliação final:", err);
      setError("Não foi possível adicionar a avaliação final. Verifique os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAvaliacao = async () => {
    if (!avaliacao?.id) return;

    try {
      setLoading(true);
      await avaliacaoFinalApi.update(disciplineId, {
        id: avaliacao.id,
        title: currentAvaliacao.title,
        description: currentAvaliacao.description,
        duration: currentAvaliacao.duration,
        passingScore: currentAvaliacao.passingScore
      });
      setIsEditing(false);
      resetAvaliacaoForm();
      await fetchAvaliacao();
    } catch (err) {
      console.error("Erro ao atualizar avaliação final:", err);
      setError("Não foi possível atualizar a avaliação final. Verifique os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAvaliacao = async () => {
    if (!confirm("Tem certeza que deseja excluir esta avaliação final? Todas as questões serão perdidas.")) return;

    try {
      setLoading(true);
      await avaliacaoFinalApi.delete(disciplineId);
      setAvaliacao(null);
      setError(null);
    } catch (err) {
      console.error("Erro ao excluir avaliação final:", err);
      setError("Não foi possível excluir a avaliação final. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  const toggleAvaliacaoStatus = async () => {
    try {
      setLoading(true);
      const updatedAvaliacao = await avaliacaoFinalApi.toggleStatus(disciplineId);
      setAvaliacao(updatedAvaliacao);
    } catch (err) {
      console.error("Erro ao alterar status da avaliação final:", err);
      setError("Não foi possível alterar o status da avaliação final. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = () => {
    if (avaliacao) {
      setCurrentAvaliacao({
        title: avaliacao.title,
        description: avaliacao.description,
        duration: avaliacao.duration,
        passingScore: avaliacao.passingScore
      });
      setIsEditing(true);
      setIsAdding(false);
    }
  };

  const resetAvaliacaoForm = () => {
    setCurrentAvaliacao({
      title: "",
      description: "",
      duration: 60,
      passingScore: 70,
      totalQuestions: 0,
      isActive: false
    });
  };

  const resetQuestionForm = () => {
    setCurrentQuestion({
      text: "",
      options: ["", "", "", ""],
      isCorrect: [false, false, false, false]
    });
    setEditingQuestionIndex(null);
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
        <h2 className="text-xl font-bold">Avaliação Final</h2>
        {!avaliacao && !isAdding && (
          <Button 
            onClick={() => {
              setIsAdding(true);
              setIsEditing(false);
              resetAvaliacaoForm();
            }}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Criar avaliação final
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {(isAdding || isEditing) && (
        <Card>
          <CardHeader>
            <CardTitle>{isAdding ? "Criar avaliação final" : "Editar avaliação final"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título</Label>
                <Input 
                  id="title" 
                  value={currentAvaliacao.title} 
                  onChange={e => setCurrentAvaliacao({...currentAvaliacao, title: e.target.value})}
                  placeholder="Título da avaliação"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  id="description" 
                  value={currentAvaliacao.description} 
                  onChange={e => setCurrentAvaliacao({...currentAvaliacao, description: e.target.value})}
                  placeholder="Descrição da avaliação"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duração (minutos)</Label>
                  <Input 
                    id="duration" 
                    type="number"
                    min={10}
                    value={currentAvaliacao.duration} 
                    onChange={e => setCurrentAvaliacao({...currentAvaliacao, duration: parseInt(e.target.value) || 60})}
                    placeholder="Duração em minutos"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="passingScore">Nota para aprovação (%)</Label>
                  <Input 
                    id="passingScore" 
                    type="number"
                    min={0}
                    max={100}
                    value={currentAvaliacao.passingScore} 
                    onChange={e => setCurrentAvaliacao({...currentAvaliacao, passingScore: parseInt(e.target.value) || 70})}
                    placeholder="Ex: 70"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAdding(false);
                    setIsEditing(false);
                    resetAvaliacaoForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={isAdding ? handleAddAvaliacao : handleUpdateAvaliacao}
                  disabled={loading || !currentAvaliacao.title}
                >
                  {isAdding ? "Criar" : "Atualizar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!isAdding && !isEditing && (
        <>
          {loading ? (
            <div className="text-center py-4">Carregando avaliação final...</div>
          ) : !avaliacao ? (
            <div className="text-center py-6 border rounded-md bg-gray-50">
              <p className="text-gray-500">Nenhuma avaliação final criada ainda.</p>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => setIsAdding(true)}
              >
                Criar avaliação final
              </Button>
            </div>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>{avaliacao.title}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="avaliacao-status" className="text-sm">
                    {avaliacao.isActive ? "Ativa" : "Inativa"}
                  </Label>
                  <Switch
                    id="avaliacao-status"
                    checked={avaliacao.isActive}
                    onCheckedChange={toggleAvaliacaoStatus}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p>{avaliacao.description}</p>

                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
                    <div>
                      <p className="text-sm text-gray-500">Duração</p>
                      <p className="font-medium">{avaliacao.duration} minutos</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Nota para aprovação</p>
                      <p className="font-medium">{avaliacao.passingScore}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total de questões</p>
                      <p className="font-medium">{avaliacao.totalQuestions}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Criada em</p>
                      <p className="font-medium">{new Date(avaliacao.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {avaliacao.totalQuestions < 5 && (
                    <Alert variant="warning">
                      <AlertDescription>
                        Recomendamos adicionar pelo menos 5 questões para a avaliação final.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-between items-center mt-6 mb-2">
                    <h3 className="text-md font-semibold">Questões da avaliação</h3>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setIsAddingQuestion(true);
                        resetQuestionForm();
                      }}
                      disabled={avaliacao.isActive}
                    >
                      <PlusCircleIcon className="mr-1 h-4 w-4" />
                      Adicionar questão
                    </Button>
                  </div>

                  {/* Tabela de questões ou mensagem se não houver */}
                  {avaliacao.totalQuestions === 0 ? (
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
                          {Array.from({ length: avaliacao.totalQuestions }).map((_, index) => (
                            <TableRow key={index}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell className="max-w-md truncate">
                                Questão simulada {index + 1}
                              </TableCell>
                              <TableCell>{4}</TableCell>
                              <TableCell>
                                <div className="flex space-x-1">
                                  <Button size="sm" variant="ghost" disabled={avaliacao.isActive}>
                                    <PencilIcon className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" disabled={avaliacao.isActive}>
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

                  <div className="flex justify-end space-x-2 mt-4">
                    <Button 
                      variant="outline" 
                      onClick={startEdit}
                      disabled={avaliacao.isActive}
                    >
                      <PencilIcon className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteAvaliacao}
                      disabled={avaliacao.isActive}
                    >
                      <TrashIcon className="mr-2 h-4 w-4" />
                      Excluir
                    </Button>
                  </div>

                  {avaliacao.isActive && (
                    <Alert>
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      <AlertDescription>
                        A avaliação está ativa e não pode ser editada. Desative-a para fazer alterações.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
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