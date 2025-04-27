import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PencilIcon, TrashIcon, PlusIcon } from "lucide-react";
import { disciplinesService } from "@/services/disciplinesService";
import { useToast } from "@/hooks/use-toast";

interface QuestaoSimulado {
  id?: string;
  enunciado: string;
  alternativas: string[];
  respostaCorreta: number;
}

interface SimuladoManagerProps {
  disciplineId: string;
}

export function SimuladoManager({ disciplineId }: SimuladoManagerProps) {
  const [questoes, setQuestoes] = useState<QuestaoSimulado[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editandoQuestaoId, setEditandoQuestaoId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [enunciado, setEnunciado] = useState("");
  const [alternativas, setAlternativas] = useState<string[]>(["", "", "", ""]);
  const [respostaCorreta, setRespostaCorreta] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuestoes();
  }, [disciplineId]);

  const loadQuestoes = async () => {
    setIsLoading(true);
    try {
      const data = await disciplinesService.listSimulation(disciplineId);
      setQuestoes(mapToQuestaoSimulado(data));
    } catch (error) {
      console.error("Error loading simulation questions:", error);
      toast({
        title: "Error",
        description: "Failed to load simulation questions.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => {
    setEnunciado("");
    setAlternativas(["", "", "", ""]);
    setRespostaCorreta(0);
    setEditandoQuestaoId(null);
    setError(null);
  };

  const openModal = (questao?: QuestaoSimulado) => {
    if (questao) {
      setEnunciado(questao.enunciado);
      setAlternativas([...questao.alternativas]);
      setRespostaCorreta(questao.respostaCorreta);
      setEditandoQuestaoId(questao.id || null);
    } else {
      clearForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    clearForm();
  };

  const validateForm = () => {
    if (!enunciado.trim()) {
      setError("O enunciado da questão é obrigatório");
      return false;
    }

    if (alternativas.some(alt => !alt.trim())) {
      setError("Todas as alternativas devem ser preenchidas");
      return false;
    }

    return true;
  };

  const handleSaveQuestao = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (editandoQuestaoId) {
        await disciplinesService.updateSimulationQuestion(disciplineId, editandoQuestaoId, {
          statement: enunciado,
          alternatives: alternativas,
          correctAnswer: respostaCorreta
        });
        toast({
          title: "Success",
          description: "Question updated successfully!",
        });
      } else {
        await disciplinesService.addSimulationQuestion(disciplineId, {
          statement: enunciado,
          alternatives: alternativas,
          correctAnswer: respostaCorreta
        });
        toast({
          title: "Success",
          description: "Question added successfully!",
        });
      }
      
      closeModal();
      loadQuestoes();
    } catch (error) {
      console.error("Error updating question:", error);
      toast({
        title: "Error",
        description: "Failed to update question.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveQuestao = async (questaoId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    
    setIsLoading(true);
    try {
      await disciplinesService.removeSimulationQuestion(disciplineId, questaoId);
      toast({
        title: "Success",
        description: "Question removed successfully!",
      });
      loadQuestoes();
    } catch (error) {
      console.error("Error removing question:", error);
      toast({
        title: "Error",
        description: "Failed to remove question.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlternativaChange = (index: number, value: string) => {
    const novasAlternativas = [...alternativas];
    novasAlternativas[index] = value;
    setAlternativas(novasAlternativas);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Simulado</CardTitle>
            <Button onClick={() => openModal()}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Adicionar Questão
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : questoes.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              Nenhuma questão adicionada ao simulado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[70%]">Enunciado</TableHead>
                  <TableHead className="w-[15%]">Alternativas</TableHead>
                  <TableHead className="w-[15%]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questoes.map((questao) => (
                  <TableRow key={questao.id}>
                    <TableCell className="font-medium">
                      {questao.enunciado.length > 100
                        ? `${questao.enunciado.substring(0, 100)}...`
                        : questao.enunciado}
                    </TableCell>
                    <TableCell>{questao.alternativas.length}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openModal(questao)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => questao.id && handleRemoveQuestao(questao.id)}
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
        </CardContent>
      </Card>

      {/* Modal para adicionar/editar questão */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editandoQuestaoId ? "Editar Questão" : "Adicionar Questão"}
            </DialogTitle>
          </DialogHeader>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="enunciado">Enunciado</Label>
              <Textarea
                id="enunciado"
                value={enunciado}
                onChange={(e) => setEnunciado(e.target.value)}
                placeholder="Digite o enunciado da questão"
                className="h-24"
              />
            </div>
            
            <div className="space-y-3">
              <Label>Alternativas</Label>
              {alternativas.map((alt, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={alt}
                    onChange={(e) => handleAlternativaChange(index, e.target.value)}
                    placeholder={`Alternativa ${index + 1}`}
                  />
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id={`resp-${index}`}
                      name="respostaCorreta"
                      checked={respostaCorreta === index}
                      onChange={() => setRespostaCorreta(index)}
                      className="mr-2"
                    />
                    <Label htmlFor={`resp-${index}`} className="text-sm cursor-pointer">
                      Correta
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={closeModal} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSaveQuestao} disabled={isLoading}>
              {isLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              ) : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const mapToQuestaoSimulado = (questions: any[]): QuestaoSimulado[] => {
  return questions.map(q => ({
    id: q.id,
    enunciado: q.statement || q.enunciado,
    alternativas: q.alternatives || q.alternativas,
    respostaCorreta: q.correctAnswer || q.respostaCorreta
  }));
}; 