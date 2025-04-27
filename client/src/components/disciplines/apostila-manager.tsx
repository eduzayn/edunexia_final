import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Discipline } from "@shared/schema";
import { PlusIcon, Pencil, Save, X, ExternalLink, Upload, FileText } from "lucide-react";

interface ApostilaManagerProps {
  discipline: Discipline;
}

export function ApostilaManager({ discipline }: ApostilaManagerProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [apostilaTitle, setApostilaTitle] = useState("");
  const [apostilaDescription, setApostilaDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Verificar se já existe uma apostila salva
  const isApostilaConfigured = false; // Implementar lógica para verificar se existe apostila configurada
  
  // Função para salvar apostila
  const handleSaveApostila = async () => {
    try {
      if (!apostilaTitle) {
        toast({
          title: "Erro",
          description: "O título da apostila é obrigatório.",
          variant: "destructive",
        });
        return;
      }
      
      if (!selectedFile && !isApostilaConfigured) {
        toast({
          title: "Erro",
          description: "Selecione um arquivo PDF para upload.",
          variant: "destructive",
        });
        return;
      }
      
      // Implementar lógica para salvar apostila
      // const formData = new FormData();
      // formData.append('title', apostilaTitle);
      // formData.append('description', apostilaDescription);
      // if (selectedFile) formData.append('file', selectedFile);
      // await salvarApostila(discipline.id, formData);
      
      toast({
        title: "Apostila salva",
        description: "A apostila foi configurada com sucesso.",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao salvar apostila:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a apostila. Tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  // Função para lidar com seleção de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Verificar se o arquivo é um PDF
      if (file.type !== "application/pdf") {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Apenas arquivos PDF são aceitos.",
          variant: "destructive",
        });
        return;
      }
      
      // Verificar tamanho do arquivo (limite de 20MB)
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo permitido é 20MB.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };
  
  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">
          Apostila: {isApostilaConfigured ? apostilaTitle : "Não configurada"}
        </CardTitle>
        {!isEditing ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            {isApostilaConfigured ? <Pencil className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
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
              onClick={handleSaveApostila}
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
              <Label htmlFor="apostila-title">Título da apostila</Label>
              <Input
                id="apostila-title"
                value={apostilaTitle}
                onChange={(e) => setApostilaTitle(e.target.value)}
                placeholder="Ex: Apostila da disciplina"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="apostila-description">Descrição</Label>
              <Textarea
                id="apostila-description"
                value={apostilaDescription}
                onChange={(e) => setApostilaDescription(e.target.value)}
                placeholder="Descreva o conteúdo da apostila"
                rows={3}
              />
            </div>
            
            <div className="grid gap-2 mt-4">
              <Label>Upload do arquivo PDF</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="flex-1"
                />
              </div>
              {selectedFile && (
                <p className="text-xs mt-1">
                  Arquivo selecionado: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Apenas arquivos PDF são aceitos. Tamanho máximo: 20MB.
              </p>
            </div>
          </div>
        ) : isApostilaConfigured ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{apostilaDescription}</p>
            
            <div className="p-4 border rounded-md flex items-center">
              <FileText className="h-10 w-10 text-primary mr-3" />
              <div>
                <p className="font-medium">{apostilaTitle}</p>
                <p className="text-xs text-muted-foreground">PDF - Apostila da disciplina</p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto">
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir PDF
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma apostila configurada para esta disciplina
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setIsEditing(true)}
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Adicionar apostila
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 