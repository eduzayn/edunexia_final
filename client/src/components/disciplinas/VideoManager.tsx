
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Edit, Trash, Plus, Video } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Esquema de validação para vídeos
const videoSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres'),
  url: z.string().url('Insira uma URL válida'),
  duration: z.string().min(1, 'Insira a duração do vídeo')
});

type VideoFormValues = z.infer<typeof videoSchema>;

interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  duration: string;
}

interface VideoManagerProps {
  disciplineId?: string;
}

export default function VideoManager({ disciplineId }: VideoManagerProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  const form = useForm<VideoFormValues>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      title: '',
      description: '',
      url: '',
      duration: ''
    }
  });

  useEffect(() => {
    if (disciplineId) {
      // Aqui seria a chamada para a API para buscar os vídeos da disciplina
      // Por enquanto, vamos simular com dados fictícios
      setTimeout(() => {
        setVideos([
          {
            id: '1',
            title: 'Introdução à Disciplina',
            description: 'Vídeo introdutório sobre os principais conceitos da disciplina',
            url: 'https://www.youtube.com/watch?v=example1',
            duration: '10:30'
          },
          {
            id: '2',
            title: 'Conceitos Fundamentais',
            description: 'Explicação detalhada sobre os conceitos fundamentais',
            url: 'https://www.youtube.com/watch?v=example2',
            duration: '15:45'
          }
        ]);
        setIsLoading(false);
      }, 1000);
    }
  }, [disciplineId]);

  const handleAddVideo = (data: VideoFormValues) => {
    const newVideo: Video = {
      id: Date.now().toString(),
      ...data
    };

    // Aqui seria a chamada para a API para adicionar o vídeo
    // Por enquanto, apenas atualizamos o estado local
    setVideos([...videos, newVideo]);
    setIsAddDialogOpen(false);
    form.reset();
  };

  const handleEditVideo = (video: Video) => {
    setEditingVideo(video);
    form.reset({
      title: video.title,
      description: video.description,
      url: video.url,
      duration: video.duration
    });
    setIsAddDialogOpen(true);
  };

  const handleSaveEdit = (data: VideoFormValues) => {
    if (editingVideo) {
      // Aqui seria a chamada para a API para editar o vídeo
      // Por enquanto, apenas atualizamos o estado local
      const updatedVideos = videos.map(v => 
        v.id === editingVideo.id ? { ...v, ...data } : v
      );
      setVideos(updatedVideos);
      setEditingVideo(null);
      setIsAddDialogOpen(false);
      form.reset();
    }
  };

  const handleDeleteVideo = (id: string) => {
    // Aqui seria a chamada para a API para excluir o vídeo
    // Por enquanto, apenas atualizamos o estado local
    const updatedVideos = videos.filter(v => v.id !== id);
    setVideos(updatedVideos);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Carregando vídeos...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Vídeos da Disciplina</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingVideo(null);
              form.reset({
                title: '',
                description: '',
                url: '',
                duration: ''
              });
            }}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Vídeo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{editingVideo ? 'Editar Vídeo' : 'Adicionar Novo Vídeo'}</DialogTitle>
              <DialogDescription>
                Preencha os dados para {editingVideo ? 'editar o' : 'adicionar um novo'} vídeo à disciplina.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(editingVideo ? handleSaveEdit : handleAddVideo)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Título do vídeo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descrição do vídeo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL do Vídeo</FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.youtube.com/watch?v=..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Insira o link do YouTube ou Vimeo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração</FormLabel>
                      <FormControl>
                        <Input placeholder="10:30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">{editingVideo ? 'Salvar Alterações' : 'Adicionar Vídeo'}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {videos.length === 0 ? (
        <Card className="text-center p-6">
          <div className="flex flex-col items-center justify-center p-4">
            <Video className="h-12 w-12 text-gray-400 mb-2" />
            <h3 className="text-lg font-medium">Nenhum Vídeo Cadastrado</h3>
            <p className="text-sm text-gray-500 mb-4">Adicione vídeos para esta disciplina.</p>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingVideo(null);
                form.reset({
                  title: '',
                  description: '',
                  url: '',
                  duration: ''
                });
              }}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar Primeiro Vídeo
              </Button>
            </DialogTrigger>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {videos.map((video) => (
            <Card key={video.id}>
              <CardHeader>
                <CardTitle className="text-lg">{video.title}</CardTitle>
                <CardDescription>Duração: {video.duration}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{video.description}</p>
                <div className="mt-2 text-sm text-blue-600 truncate">
                  <a href={video.url} target="_blank" rel="noopener noreferrer">
                    {video.url}
                  </a>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleEditVideo(video)}>
                  <Edit className="h-4 w-4 mr-1" /> Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteVideo(video.id)}>
                  <Trash className="h-4 w-4 mr-1" /> Excluir
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
