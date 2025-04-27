import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Discipline } from "@shared/schema";
import { PlusIcon, Pencil, Save, X, ExternalLink } from "lucide-react";

interface VideoManagerProps {
  discipline: Discipline;
  videoNumber: number;
}

export function VideoManager({ discipline, videoNumber }: VideoManagerProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  
  // Verificar se já existe um vídeo salvo
  const isVideoConfigured = false; // Implementar lógica para verificar se existe vídeo configurado
  
  // Função para salvar vídeo
  const handleSaveVideo = async () => {
    try {
      // Implementar lógica para salvar o vídeo
      // await salvarVideo(discipline.id, videoNumber, { title: videoTitle, description: videoDescription, url: videoUrl });
      
      toast({
        title: "Vídeo salvo",
        description: "O vídeo foi configurado com sucesso.",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao salvar vídeo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o vídeo. Tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  // Função para obter ID do vídeo do YouTube a partir da URL
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  
  // Função para renderizar o preview do vídeo
  const renderVideoPreview = () => {
    if (!videoUrl) return null;
    
    const videoId = getYouTubeVideoId(videoUrl);
    if (!videoId) return (
      <div className="bg-muted p-4 rounded text-center">
        URL de vídeo inválida. Insira uma URL do YouTube válida.
      </div>
    );
    
    return (
      <div className="aspect-video">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">
          Vídeo {videoNumber}: {isVideoConfigured ? videoTitle : `Aula ${videoNumber}`}
        </CardTitle>
        {!isEditing ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            {isVideoConfigured ? <Pencil className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
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
              onClick={handleSaveVideo}
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
              <Label htmlFor={`title-${videoNumber}`}>Título do vídeo</Label>
              <Input
                id={`title-${videoNumber}`}
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Ex: Introdução à disciplina"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor={`description-${videoNumber}`}>Descrição</Label>
              <Textarea
                id={`description-${videoNumber}`}
                value={videoDescription}
                onChange={(e) => setVideoDescription(e.target.value)}
                placeholder="Descreva o conteúdo do vídeo"
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor={`url-${videoNumber}`}>URL do vídeo (YouTube)</Label>
              <Input
                id={`url-${videoNumber}`}
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Ex: https://www.youtube.com/watch?v=..."
              />
            </div>
            
            {videoUrl && renderVideoPreview()}
          </div>
        ) : isVideoConfigured ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{videoDescription}</p>
            {/* Preview do vídeo aqui */}
            <div className="flex justify-end">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver aula
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum vídeo configurado para esta aula
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setIsEditing(true)}
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Adicionar vídeo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 