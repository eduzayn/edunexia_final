
import { useState, useEffect } from 'react';
import { 
  Button, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  Input,
  Label,
  Select,
  Textarea,
  Card,
  CardContent
} from "@/components/ui";
import { PlusIcon, TrashIcon, PencilIcon } from "lucide-react";
import { Video, VideoSource } from "@/types/pedagogico";

interface VideoManagerProps {
  disciplineId: string | number;
}

export default function VideoManager({ disciplineId }: VideoManagerProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [formData, setFormData] = useState<Partial<Video>>({
    title: '',
    description: '',
    url: '',
    source: 'youtube' as VideoSource,
  });

  useEffect(() => {
    async function fetchVideos() {
      try {
        setLoading(true);
        const response = await fetch(`/api/disciplines/${disciplineId}/videos`);
        if (!response.ok) {
          throw new Error('Falha ao carregar vídeos');
        }
        const data = await response.json();
        setVideos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar vídeos');
        console.error('Erro ao carregar vídeos:', err);
      } finally {
        setLoading(false);
      }
    }

    if (disciplineId) {
      fetchVideos();
    }
  }, [disciplineId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      url: '',
      source: 'youtube',
    });
    setEditingVideo(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (video: Video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description || '',
      url: video.url,
      source: video.source,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.url) {
      setError('Título e URL são campos obrigatórios');
      return;
    }

    try {
      const method = editingVideo ? 'PUT' : 'POST';
      const url = editingVideo 
        ? `/api/disciplines/${disciplineId}/videos/${editingVideo.id}`
        : `/api/disciplines/${disciplineId}/videos`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          disciplineId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Falha ao ${editingVideo ? 'atualizar' : 'adicionar'} vídeo`);
      }

      const updatedVideo = await response.json();
      
      if (editingVideo) {
        setVideos(videos.map(v => v.id === editingVideo.id ? updatedVideo : v));
      } else {
        setVideos([...videos, updatedVideo]);
      }
      
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Erro ao ${editingVideo ? 'atualizar' : 'adicionar'} vídeo`);
      console.error(`Erro ao ${editingVideo ? 'atualizar' : 'adicionar'} vídeo:`, err);
    }
  };

  const handleDelete = async (videoId: string | number) => {
    if (!confirm('Tem certeza que deseja excluir este vídeo?')) {
      return;
    }

    try {
      const response = await fetch(`/api/disciplines/${disciplineId}/videos/${videoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Falha ao excluir vídeo');
      }

      setVideos(videos.filter(v => v.id !== videoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir vídeo');
      console.error('Erro ao excluir vídeo:', err);
    }
  };

  if (loading) {
    return <div>Carregando vídeos...</div>;
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-end mb-4">
        <Button onClick={openAddDialog}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Adicionar Vídeo
        </Button>
      </div>

      {videos.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-md">
          <p className="text-gray-500">
            Nenhum vídeo cadastrado para esta disciplina
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {videos.map((video) => (
            <Card key={video.id} className="overflow-hidden">
              <div className="aspect-video bg-gray-100 relative">
                {video.source === 'youtube' && (
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeId(video.url)}`}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                )}
                {video.source === 'vimeo' && (
                  <iframe
                    src={`https://player.vimeo.com/video/${getVimeoId(video.url)}`}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                  ></iframe>
                )}
                {video.source !== 'youtube' && video.source !== 'vimeo' && (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <span>Prévia não disponível</span>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-1">{video.title}</h3>
                {video.description && (
                  <p className="text-gray-600 text-sm mb-2">{video.description}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => openEditDialog(video)}
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDelete(video.id!)}
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {editingVideo ? 'Editar Vídeo' : 'Adicionar Vídeo'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="source">Fonte do Vídeo</Label>
                <select
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="youtube">YouTube</option>
                  <option value="vimeo">Vimeo</option>
                  <option value="onedrive">OneDrive</option>
                  <option value="other">Outro</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="url">URL do Vídeo</Label>
                <Input
                  id="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingVideo ? 'Salvar Alterações' : 'Adicionar Vídeo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getYouTubeId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : '';
}

function getVimeoId(url: string): string {
  const regExp = /vimeo\.com\/(?:video\/)?([0-9]+)/;
  const match = url.match(regExp);
  return match ? match[1] : '';
}
