import React, { useState, useEffect } from "react";
import { disciplinasService } from "@/services/disciplinasService";
import { Viewer } from "@/components/disciplines/Viewer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Save, X } from "lucide-react";

interface EbookManagerProps {
  disciplinaId: string;
}

export function EbookManager({ disciplinaId }: EbookManagerProps) {
  const [ebookUrl, setEbookUrl] = useState<string>("");
  const [newEbookUrl, setNewEbookUrl] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    async function carregarEbook() {
      try {
        setIsLoading(true);
        const data = await disciplinasService.buscarEbookEstatico(disciplinaId);
        if (data?.url) {
          setEbookUrl(data.url);
          setNewEbookUrl(data.url);
        }
      } catch (error) {
        console.error("Erro ao carregar e-book estático:", error);
      } finally {
        setIsLoading(false);
      }
    }

    carregarEbook();
  }, [disciplinaId]);

  const handleSaveEbook = async () => {
    if (!newEbookUrl) {
      toast({
        title: "Erro",
        description: "O URL do e-book não pode estar vazio",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      await disciplinasService.salvarEbookEstatico(disciplinaId, { url: newEbookUrl });
      setEbookUrl(newEbookUrl);
      setIsEditing(false);
      
      toast({
        title: "Sucesso",
        description: "E-book salvo com sucesso",
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao salvar e-book:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o e-book",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveEbook = async () => {
    try {
      setIsLoading(true);
      await disciplinasService.removerEbookEstatico(disciplinaId);
      setEbookUrl("");
      setNewEbookUrl("");
      setIsEditing(false);
      
      toast({
        title: "Sucesso",
        description: "E-book removido com sucesso",
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao remover e-book:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao remover o e-book",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="border rounded-md p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">E-book Estático</h2>
        
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            disabled={isLoading}
          >
            {ebookUrl ? <Pencil className="h-4 w-4 mr-2" /> : null}
            {ebookUrl ? "Editar" : "Adicionar e-book"}
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input 
              value={newEbookUrl} 
              onChange={(e) => setNewEbookUrl(e.target.value)}
              placeholder="Cole a URL do e-book (PDF, Google Drive, etc)"
              disabled={isLoading}
              className="flex-1"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setIsEditing(false);
                setNewEbookUrl(ebookUrl);
              }}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleSaveEbook}
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-1" /> Salvar
            </Button>
            {ebookUrl && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleRemoveEbook}
                disabled={isLoading}
              >
                Remover
              </Button>
            )}
          </div>
        </div>
      ) : (
        ebookUrl ? (
          <div className="mt-4">
            <Viewer url={ebookUrl} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum e-book cadastrado ainda.</p>
        )
      )}
    </section>
  );
}