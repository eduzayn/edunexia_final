
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { videoApi } from "@/api/pedagogico";
import { Video } from "@/types/pedagogico";
import { PlusIcon, TrashIcon, PencilIcon } from "@/components/ui/icons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface VideoManagerProps {
  disciplineId: string;
}

export function VideoManager({ disciplineId }: VideoManagerProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<Partial<Video>>({
    title: "",
    description: "",
    url: "",
    duration: ""
  });
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const data = await videoApi.getAll(disciplineId);
      setVideos(data);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar vídeos:", err);
      setError("Não foi possível carregar os vídeos. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [disciplineId]);

  const handleAddVideo = async () => {
    try {
      setLoading(true);
      await videoApi.create(disciplineId, currentVideo as Omit<Video, 'id'>);
      setIsAdding(false);
      setCurrentVideo({
        title: "",
        description: "",
        url: "",
        duration: ""
      });
      await fetchVideos();
    } catch (err) {
      console.error("Erro ao adicionar vídeo:", err);
      setError("Não foi possível adicionar o vídeo. Verifique os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVideo = async () => {
    if (!currentVideoId) return;
    
    try {
      setLoading(true);
      await videoApi.update(disciplineId, currentVideoId, currentVideo);
      setIsEditing(false);
      setCurrentVideo({
        title: "",
        description: "",
        url: "",
        duration: ""
      });
      setCurrentVideoId(null);
      await fetchVideos();
    } catch (err) {
      console.error("Erro ao atualizar vídeo:", err);
      setError("Não foi possível atualizar o vídeo. Verifique os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm("Tem certeza que deseja excluir este vídeo?")) return;
    
    try {
      setLoading(true);
      await videoApi.delete(disciplineId, videoId);
      await fetchVideos();
    } catch (err) {
      console.error("Erro ao excluir vídeo:", err);
      setError("Não foi possível excluir o vídeo. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (video: Video) => {
    setCurrentVideo({
      title: video.title,
      description: video.description,
      url: video.url,
      duration: video.duration
    });
    setCurrentVideoId(video.id);
    setIsEditing(true);
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Vídeo-aulas</h2>
        <Button 
          onClick={() => {
            setIsAdding(true);
            setIsEditing(false);
            setCurrentVideo({
              title: "",
              description: "",
              url: "",
              duration: ""
            });
          }}
          disabled={isAdding || isEditing}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Adicionar vídeo
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {(isAdding || isEditing) && (
        <Card>
          <CardHeader>
            <CardTitle>{isAdding ? "Adicionar novo vídeo" : "Editar vídeo"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título</Label>
                <Input 
                  id="title" 
                  value={currentVideo.title} 
                  onChange={e => setCurrentVideo({...currentVideo, title: e.target.value})}
                  placeholder="Título do vídeo"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  id="description" 
                  value={currentVideo.description} 
                  onChange={e => setCurrentVideo({...currentVideo, description: e.target.value})}
                  placeholder="Descrição do vídeo"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="url">URL</Label>
                <Input 
                  id="url" 
                  value={currentVideo.url} 
                  onChange={e => setCurrentVideo({...currentVideo, url: e.target.value})}
                  placeholder="URL do vídeo (YouTube, Vimeo, etc.)"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="duration">Duração (formato: HH:MM:SS)</Label>
                <Input 
                  id="duration" 
                  value={currentVideo.duration} 
                  onChange={e => setCurrentVideo({...currentVideo, duration: e.target.value})}
                  placeholder="Ex: 01:30:00"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAdding(false);
                    setIsEditing(false);
                    setCurrentVideo({
                      title: "",
                      description: "",
                      url: "",
                      duration: ""
                    });
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={isAdding ? handleAddVideo : handleUpdateVideo}
                  disabled={loading || !currentVideo.title || !currentVideo.url}
                >
                  {isAdding ? "Adicionar" : "Atualizar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!isAdding && !isEditing && (
        <>
          {loading ? (
            <div className="text-center py-4">Carregando vídeos...</div>
          ) : videos.length === 0 ? (
            <div className="text-center py-6 border rounded-md bg-gray-50">
              <p className="text-gray-500">Nenhum vídeo adicionado ainda.</p>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => setIsAdding(true)}
              >
                Adicionar primeiro vídeo
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.map((video) => (
                  <TableRow key={video.id}>
                    <TableCell>{video.title}</TableCell>
                    <TableCell>{video.duration}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(video)}>
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteVideo(video.id)}>
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}
    </div>
  );
}
