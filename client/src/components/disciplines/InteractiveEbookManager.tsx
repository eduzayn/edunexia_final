import { useState, useEffect } from "react";
import { disciplinasService } from "@/services/disciplinasService";
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
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Plus, Edit, Trash, BookOpen } from "lucide-react";

interface InteractiveEbookData {
  id?: string;
  url: string;
  title: string;
  description: string;
}

export function InteractiveEbookManager({ disciplinaId }: { disciplinaId: string }) {
  const [ebookData, setEbookData] = useState<InteractiveEbookData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // Form states
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!disciplinaId) return;
    
    async function loadEbook() {
      try {
        setIsLoading(true);
        const data = await disciplinasService.buscarConteudoInterativo(disciplinaId);
        setEbookData(data);
      } catch (error) {
        console.error("Erro ao carregar e-book interativo:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o e-book interativo",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadEbook();
  }, [disciplinaId, toast]);

  const resetForm = () => {
    setUrl("");
    setTitle("");
    setDescription("");
    setIsEditing(false);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = () => {
    if (ebookData) {
      setUrl(ebookData.url);
      setTitle(ebookData.title);
      setDescription(ebookData.description);
      setIsEditing(true);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const isValidUrl = (urlString: string) => {
    try {
      new URL(urlString);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleSubmit = async () => {
    // Validações básicas
    if (!url || !title) {
      toast({
        title: "Campos obrigatórios",
        description: "URL e título são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (!isValidUrl(url)) {
      toast({
        title: "URL inválida",
        description: "Por favor, informe uma URL válida",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const newEbookData = {
        url,
        title,
        description
      };

      const response = await disciplinasService.salvarConteudoInterativo(
        disciplinaId, 
        newEbookData
      );

      setEbookData(response?.data || { ...newEbookData, id: String(Date.now()) });
      
      toast({
        title: "Sucesso",
        description: isEditing 
          ? "E-book interativo atualizado com sucesso" 
          : "E-book interativo adicionado com sucesso",
      });
      
      closeModal();
    } catch (error) {
      console.error("Erro ao salvar e-book interativo:", error);
      toast({
        title: "Erro",
        description: `Erro ao ${isEditing ? 'atualizar' : 'adicionar'} e-book interativo`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm("Tem certeza que deseja remover este e-book interativo?")) {
      return;
    }

    try {
      setIsLoading(true);
      await disciplinasService.removerConteudoInterativo(disciplinaId);
      
      setEbookData(null);
      
      toast({
        title: "Sucesso",
        description: "E-book interativo removido com sucesso",
      });
    } catch (error) {
      console.error("Erro ao remover e-book interativo:", error);
      toast({
        title: "Erro",
        description: "Erro ao remover e-book interativo",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenViewer = () => {
    if (ebookData?.url) {
      window.open(ebookData.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">E-book Interativo</h2>
        
        <div>
          {!ebookData ? (
            <Button 
              onClick={openAddModal}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" /> Adicionar E-book Interativo
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={openEditModal}
                disabled={isLoading}
              >
                <Edit className="h-4 w-4 mr-1" /> Editar
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleRemove}
                disabled={isLoading}
              >
                <Trash className="h-4 w-4 mr-1" /> Remover
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Exibição do E-book interativo */}
      {ebookData ? (
        <Card className="overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="text-xl font-medium">{ebookData.title}</h3>
                {ebookData.description && (
                  <p className="text-muted-foreground">{ebookData.description}</p>
                )}
                <p className="text-sm flex items-center text-muted-foreground">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  <a 
                    href={ebookData.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {ebookData.url}
                  </a>
                </p>
              </div>
              
              <Button onClick={handleOpenViewer}>
                <BookOpen className="h-4 w-4 mr-2" /> Visualizar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-md p-6 text-center">
          <p className="text-muted-foreground">
            Nenhum e-book interativo cadastrado para esta disciplina.
          </p>
        </div>
      )}
      
      {/* Modal para adicionar/editar e-book interativo */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar E-book Interativo" : "Adicionar E-book Interativo"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">
                Título *
              </label>
              <Input 
                id="title"
                placeholder="Ex: Gestão Estratégica Interativa"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="url" className="text-sm font-medium">
                URL do E-book Interativo *
              </label>
              <Input 
                id="url"
                type="url"
                placeholder="https://docs.google.com/document/d/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Insira um link para um documento interativo (Google Docs, Notion, etc)
              </p>
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Descrição
              </label>
              <Textarea 
                id="description"
                placeholder="Uma breve descrição sobre o conteúdo do e-book..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter className="sm:justify-end">
            <Button 
              variant="outline" 
              onClick={closeModal}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isEditing ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}