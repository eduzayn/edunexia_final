import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Discipline } from "@shared/schema";
import { PlusIcon, Pencil, Save, X, ExternalLink, Upload } from "lucide-react";

interface InteractiveEbookManagerProps {
  discipline: Discipline;
}

export function InteractiveEbookManager({ discipline }: InteractiveEbookManagerProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [ebookTitle, setEbookTitle] = useState("");
  const [ebookDescription, setEbookDescription] = useState("");
  const [ebookUrl, setEbookUrl] = useState("");
  
  // Verificar se já existe um e-book interativo salvo
  const isEbookConfigured = false; // Implementar lógica para verificar se existe e-book configurado
  
  // Função para salvar e-book
  const handleSaveEbook = async () => {
    try {
      // Implementar lógica para salvar o e-book
      // await salvarEbookInterativo(discipline.id, { title: ebookTitle, description: ebookDescription, url: ebookUrl });
      
      toast({
        title: "E-book salvo",
        description: "O e-book interativo foi configurado com sucesso.",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao salvar e-book:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o e-book. Tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  // Função para fazer upload de arquivo
  const handleFileUpload = async () => {
    try {
      // Implementar lógica para upload de arquivo
      toast({
        title: "Upload em andamento",
        description: "Aguarde enquanto processamos seu arquivo...",
      });
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer o upload do arquivo. Tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">
          E-book Interativo: {isEbookConfigured ? ebookTitle : "Não configurado"}
        </CardTitle>
        {!isEditing ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            {isEbookConfigured ? <Pencil className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveEbook}
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="ebook-title">Título do e-book</Label>
              <Input
                id="ebook-title"
                value={ebookTitle}
                onChange={(e) => setEbookTitle(e.target.value)}
                placeholder="Ex: Material interativo da disciplina"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="ebook-description">Descrição</Label>
              <Textarea
                id="ebook-description"
                value={ebookDescription}
                onChange={(e) => setEbookDescription(e.target.value)}
                placeholder="Descreva o conteúdo do e-book"
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="ebook-url">URL do e-book (opcional)</Label>
              <Input
                id="ebook-url"
                value={ebookUrl}
                onChange={(e) => setEbookUrl(e.target.value)}
                placeholder="Ex: https://..."
              />
            </div>
            
            <div className="grid gap-2 mt-4">
              <Label>Upload de arquivo</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".pdf,.html,.h5p"
                  className="flex-1"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleFileUpload}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Formatos aceitos: PDF, HTML, H5P
              </p>
            </div>
          </div>
        ) : isEbookConfigured ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{ebookDescription}</p>
            
            <div className="aspect-video bg-muted flex items-center justify-center rounded-md">
              <p className="text-muted-foreground">Preview do e-book interativo</p>
            </div>
            
            <div className="flex justify-end">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir e-book
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum e-book interativo configurado para esta disciplina
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setIsEditing(true)}
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Adicionar e-book
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 