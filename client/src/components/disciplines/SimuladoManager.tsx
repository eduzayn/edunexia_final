import { useState, useEffect } from "react";
import { disciplinasService } from "@/services/disciplinasService";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash, Edit, Plus } from "lucide-react";

interface Questao {
  id: string;
  enunciado: string;
  alternativas: string[];
  respostaCorreta: number;
}

export function SimuladoManager() {
  const [, params] = useParams();
  const disciplinaId = params?.id as string;

  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editandoQuestaoId, setEditandoQuestaoId] = useState<string | null>(null);
  const { toast } = useToast();

  // Campos do formulário
  const [enunciado, setEnunciado] = useState("");
  const [alternativas, setAlternativas] = useState(["", "", "", ""]);
  const [respostaCorreta, setRespostaCorreta] = useState(0);

  useEffect(() => {
    if (!disciplinaId) return;
    
    async function carregarQuestoes() {
      try {
        setIsLoading(true);
        const data = await disciplinasService.listarSimulado(disciplinaId);
        setQuestoes(data || []);
      } catch (error) {
        console.error("Erro ao carregar questões do simulado:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as questões do simulado",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }

    carregarQuestoes();
  }, [disciplinaId, toast]);

  const limparFormulario = () => {
    setEnunciado("");
    setAlternativas(["", "", "", ""]);
    setRespostaCorreta(0);
    setEditandoQuestaoId(null);
  };

  const abrirModalAdicao = () => {
    limparFormulario();
    setShowModal(true);
  };

  const abrirModalEdicao = (questao: Questao) => {
    setEnunciado(questao.enunciado);
    setAlternativas([...questao.alternativas]);
    setRespostaCorreta(questao.respostaCorreta);
    setEditandoQuestaoId(questao.id);
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
    limparFormulario();
  };

  async function handleSalvarQuestao() {
    if (!enunciado) {
      toast({
        title: "Erro",
        description: "O enunciado da questão é obrigatório",
        variant: "destructive"
      });
      return;
    }

    // Verificar se todas as alternativas estão preenchidas
    if (alternativas.some(alt => !alt.trim())) {
      toast({
        title: "Erro",
        description: "Todas as alternativas devem ser preenchidas",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const questaoData = {
        enunciado,
        alternativas,
        respostaCorreta,
      };

      let response;

      if (editandoQuestaoId) {
        // Atualização de questão existente
        response = await disciplinasService.atualizarQuestaoSimulado(
          disciplinaId, 
          editandoQuestaoId, 
          questaoData
        );
        
        setQuestoes(prevQuestoes => 
          prevQuestoes.map(q => 
            q.id === editandoQuestaoId 
              ? { ...questaoData, id: editandoQuestaoId } 
              : q
          )
        );
        
        toast({
          title: "Sucesso",
          description: "Questão atualizada com sucesso",
        });
      } else {
        // Nova questão
        response = await disciplinasService.adicionarQuestaoSimulado(
          disciplinaId, 
          questaoData
        );
        
        // Adicionamos a nova questão com o ID retornado da API
        const novaQuestao = response?.data || { 
          id: String(Date.now()), 
          ...questaoData 
        };
        
        setQuestoes(prevQuestoes => [...prevQuestoes, novaQuestao]);
        
        toast({
          title: "Sucesso",
          description: "Questão adicionada com sucesso",
        });
      }

      fecharModal();
    } catch (error) {
      console.error("Erro ao salvar questão:", error);
      toast({
        title: "Erro",
        description: `Erro ao ${editandoQuestaoId ? 'atualizar' : 'adicionar'} questão`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemoverQuestao(questaoId: string) {
    try {
      setIsLoading(true);
      await disciplinasService.removerQuestaoSimulado(disciplinaId, questaoId);
      
      setQuestoes(prevQuestoes => 
        prevQuestoes.filter(q => q.id !== questaoId)
      );
      
      toast({
        title: "Sucesso",
        description: "Questão removida com sucesso",
      });
    } catch (error) {
      console.error("Erro ao remover questão:", error);
      toast({
        title: "Erro",
        description: "Erro ao remover questão",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  function atualizarAlternativa(index: number, value: string) {
    const novasAlternativas = [...alternativas];
    novasAlternativas[index] = value;
    setAlternativas(novasAlternativas);
  }

  return (
    <section className="border rounded-md p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Simulado</h2>
        
        <Button
          onClick={abrirModalAdicao}
          disabled={isLoading}
        >
          <Plus className="h-4 w-4 mr-2" /> Adicionar questão
        </Button>
      </div>

      {/* Lista de questões */}
      {questoes.length > 0 ? (
        <div className="space-y-4 mt-4">
          {questoes.map((q, index) => (
            <div key={q.id} className="border p-4 rounded-md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{index + 1}. {q.enunciado}</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {q.alternativas.map((alt, i) => (
                      <li key={i} className={i === q.respostaCorreta ? "font-bold text-primary" : ""}>
                        {String.fromCharCode(65 + i)}) {alt}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => abrirModalEdicao(q)}
                    disabled={isLoading}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleRemoverQuestao(q.id)}
                    disabled={isLoading}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhuma questão cadastrada ainda.</p>
      )}

      {/* Modal de nova questão ou edição */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editandoQuestaoId ? "Editar Questão" : "Adicionar Nova Questão"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="enunciado" className="text-sm font-medium">
                Enunciado
              </label>
              <Textarea
                id="enunciado"
                rows={3}
                placeholder="Digite o enunciado da questão"
                value={enunciado}
                onChange={(e) => setEnunciado(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Alternativas</label>

              {alternativas.map((alt, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <Input
                    placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                    value={alt}
                    onChange={(e) => atualizarAlternativa(index, e.target.value)}
                    disabled={isLoading}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>

            <div className="grid gap-2">
              <label htmlFor="resposta-correta" className="text-sm font-medium">
                Resposta Correta
              </label>
              <div className="flex gap-2">
                {alternativas.map((_, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant={respostaCorreta === index ? "default" : "outline"}
                    onClick={() => setRespostaCorreta(index)}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {String.fromCharCode(65 + index)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-end">
            <Button 
              variant="outline" 
              onClick={fecharModal}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSalvarQuestao}
              disabled={isLoading}
            >
              {editandoQuestaoId ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}