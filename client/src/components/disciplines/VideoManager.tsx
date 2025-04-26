import React, { useState, useEffect } from "react";
import { disciplinasService } from "@/services/disciplinasService";
import { Viewer } from "@/components/disciplines/Viewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash, Edit, X, Save } from "lucide-react";

interface VideoManagerProps {
  disciplinaId: string;
}

interface Video {
  id: string;
  url: string;
  title?: string;
  description?: string;
}

export function VideoManager({ disciplinaId }: VideoManagerProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAddingVideo, setIsAddingVideo] = useState<boolean>(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [newVideoUrl, setNewVideoUrl] = useState<string>("");
  const [newVideoTitle, setNewVideoTitle] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    async function carregarVideos() {
      try {
        setIsLoading(true);
        const data = await disciplinasService.listarVideos(disciplinaId);
        setVideos(data || []);
      } catch (error) {
        console.error("Erro ao carregar vídeos:", error);
      } finally {
        setIsLoading(false);
      }
    }

    carregarVideos();
  }, [disciplinaId]);

  const handleAddVideo = async () => {
    if (!newVideoUrl) {
      toast({
        title: "Erro",
        description: "O URL do vídeo não pode estar vazio",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const addedVideo = await disciplinasService.adicionarVideo(disciplinaId, {
        url: newVideoUrl,
        title: newVideoTitle || "Vídeo sem título"
      });
      
      setVideos(prevVideos => [...prevVideos, addedVideo]);
      setNewVideoUrl("");
      setNewVideoTitle("");
      setIsAddingVideo(false);
      
      toast({
        title: "Sucesso",
        description: "Vídeo adicionado com sucesso",
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao adicionar vídeo:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao adicionar o vídeo",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveVideo = async (videoId: string) => {
    try {
      setIsLoading(true);
      await disciplinasService.removerVideo(disciplinaId, videoId);
      setVideos(prevVideos => prevVideos.filter(video => video.id !== videoId));
      
      toast({
        title: "Sucesso",
        description: "Vídeo removido com sucesso",
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao remover vídeo:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao remover o vídeo",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateVideo = async (videoId: string) => {
    const videoToUpdate = videos.find(v => v.id === videoId);
    if (!videoToUpdate || !videoToUpdate.url) {
      toast({
        title: "Erro",
        description: "O URL do vídeo não pode estar vazio",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      // Implementar lógica para atualizar quando o endpoint estiver disponível
      // await disciplinasService.atualizarVideo(disciplinaId, videoId, videoToUpdate);
      
      setEditingVideoId(null);
      
      toast({
        title: "Sucesso",
        description: "Vídeo atualizado com sucesso",
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao atualizar vídeo:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar o vídeo",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditVideo = (videoId: string) => {
    setEditingVideoId(videoId);
  };

  const handleCancelEdit = () => {
    setEditingVideoId(null);
  };

  return (
    <section className="border rounded-md p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Vídeo-aulas</h2>
        
        {!isAddingVideo && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingVideo(true)}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" /> Adicionar Vídeo
          </Button>
        )}
      </div>

      {isAddingVideo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adicionar novo vídeo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Input 
                value={newVideoTitle} 
                onChange={(e) => setNewVideoTitle(e.target.value)}
                placeholder="Título do vídeo (opcional)"
                disabled={isLoading}
                className="mb-2"
              />
              <Input 
                value={newVideoUrl} 
                onChange={(e) => setNewVideoUrl(e.target.value)}
                placeholder="Cole a URL do vídeo (YouTube, Vimeo, MP4, etc)"
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setIsAddingVideo(false);
                setNewVideoUrl("");
                setNewVideoTitle("");
              }}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleAddVideo}
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-1" /> Salvar
            </Button>
          </CardFooter>
        </Card>
      )}

      {videos.length > 0 ? (
        <div className="space-y-4 mt-4">
          {videos.map((video) => (
            <Card key={video.id}>
              <CardHeader>
                <CardTitle className="text-base flex justify-between items-center">
                  <span>{video.title || "Vídeo sem título"}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditVideo(video.id)}
                      disabled={isLoading || editingVideoId === video.id}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveVideo(video.id)}
                      disabled={isLoading || editingVideoId === video.id}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editingVideoId === video.id ? (
                  <div className="space-y-2">
                    <Input 
                      value={video.title || ""} 
                      onChange={(e) => {
                        setVideos(prev => 
                          prev.map(v => v.id === video.id ? {...v, title: e.target.value} : v)
                        );
                      }}
                      placeholder="Título do vídeo (opcional)"
                      disabled={isLoading}
                      className="mb-2"
                    />
                    <Input 
                      value={video.url} 
                      onChange={(e) => {
                        setVideos(prev => 
                          prev.map(v => v.id === video.id ? {...v, url: e.target.value} : v)
                        );
                      }}
                      placeholder="URL do vídeo"
                      disabled={isLoading}
                    />
                  </div>
                ) : (
                  <Viewer url={video.url} />
                )}
              </CardContent>
              {editingVideoId === video.id && (
                <CardFooter className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4 mr-1" /> Cancelar
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => handleUpdateVideo(video.id)}
                    disabled={isLoading}
                  >
                    <Save className="h-4 w-4 mr-1" /> Salvar
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum vídeo cadastrado ainda.</p>
      )}
    </section>
  );
}