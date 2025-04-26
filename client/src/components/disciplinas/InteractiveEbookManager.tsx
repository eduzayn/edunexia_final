
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
  Textarea,
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { PlusIcon, TrashIcon, PencilIcon, ExternalLinkIcon, BookOpenIcon, CodeIcon } from "lucide-react";

interface InteractiveEbook {
  id?: number | string;
  disciplineId?: number | string;
  title: string;
  name?: string;
  description?: string;
  url?: string;
  type: 'link' | 'embed';
  embedCode?: string;
}

interface InteractiveEbookManagerProps {
  disciplineId: string | number;
}

export default function InteractiveEbookManager({ disciplineId }: InteractiveEbookManagerProps) {
  const [ebook, setEbook] = useState<InteractiveEbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<InteractiveEbook>>({
    title: '',
    description: '',
    url: '',
    type: 'link',
    embedCode: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function fetchInteractiveEbook() {
      try {
        setLoading(true);
        const response = await fetch(`/api/disciplines/${disciplineId}/interactive-ebook`);
        if (!response.ok) {
          if (response.status === 404) {
            // Não existe e-book interativo para esta disciplina, o que é normal
            setEbook(null);
            return;
          }
          throw new Error('Falha ao carregar e-book interativo');
        }
        const data = await response.json();
        setEbook(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar e-book interativo');
        console.error('Erro ao carregar e-book interativo:', err);
      } finally {
        setLoading(false);
      }
    }

    if (disciplineId) {
      fetchInteractiveEbook();
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
      type: 'link',
      embedCode: '',
    });
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = () => {
    if (ebook) {
      setFormData({
        title: ebook.title || ebook.name || '',
        description: ebook.description || '',
        url: ebook.url || '',
        type: ebook.type || 'link',
        embedCode: ebook.embedCode || '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      setError('Título é um campo obrigatório');
      return;
    }

    if (formData.type === 'link' && !formData.url) {
      setError('URL é um campo obrigatório para e-books do tipo link');
      return;
    }

    if (formData.type === 'embed' && !formData.embedCode) {
      setError('Código de incorporação é obrigatório para e-books do tipo embed');
      return;
    }

    try {
      setIsProcessing(true);
      
      const method = ebook ? 'PUT' : 'POST';
      const response = await fetch(`/api/disciplines/${disciplineId}/interactive-ebook`, {
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
        throw new Error(`Falha ao ${ebook ? 'atualizar' : 'adicionar'} e-book interativo`);
      }

      const updatedEbook = await response.json();
      setEbook(updatedEbook);
      
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Erro ao ${ebook ? 'atualizar' : 'adicionar'} e-book interativo`);
      console.error(`Erro ao ${ebook ? 'atualizar' : 'adicionar'} e-book interativo:`, err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este e-book interativo?')) {
      return;
    }

    try {
      const response = await fetch(`/api/disciplines/${disciplineId}/interactive-ebook`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Falha ao excluir e-book interativo');
      }

      setEbook(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir e-book interativo');
      console.error('Erro ao excluir e-book interativo:', err);
    }
  };

  if (loading) {
    return <div>Carregando e-book interativo...</div>;
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-end mb-4">
        {!ebook ? (
          <Button onClick={openAddDialog}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Adicionar E-book Interativo
          </Button>
        ) : (
          <Button onClick={openEditDialog}>
            <PencilIcon className="h-4 w-4 mr-2" />
            Editar E-book Interativo
          </Button>
        )}
      </div>

      {!ebook ? (
        <div className="text-center p-8 bg-gray-50 rounded-md">
          <p className="text-gray-500">
            Nenhum e-book interativo cadastrado para esta disciplina
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start mb-4">
              <BookOpenIcon className="h-10 w-10 text-blue-500 mr-4 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{ebook.title || ebook.name}</h3>
                {ebook.description && (
                  <p className="text-gray-600 mb-2">{ebook.description}</p>
                )}
                <div className="text-sm text-gray-500 mb-4">
                  <p>Tipo: {ebook.type === 'link' ? 'Link Externo' : 'Código Incorporado'}</p>
                  {ebook.url && (
                    <p className="truncate max-w-md">URL: {ebook.url}</p>
                  )}
                </div>
              </div>
            </div>
            
            {ebook.type === 'embed' && ebook.embedCode && (
              <div className="mb-4 bg-gray-50 p-4 rounded-md border">
                <div className="aspect-video" dangerouslySetInnerHTML={{ __html: ebook.embedCode }} />
              </div>
            )}
            
            <div className="flex gap-2 mt-4">
              {ebook.url && (
                <Button asChild variant="outline">
                  <a href={ebook.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLinkIcon className="h-4 w-4 mr-2" />
                    Abrir E-book
                  </a>
                </Button>
              )}
              <Button variant="outline" onClick={openEditDialog}>
                <PencilIcon className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <TrashIcon className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {ebook ? 'Editar E-book Interativo' : 'Adicionar E-book Interativo'}
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
                <Label htmlFor="type">Tipo de E-book</Label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="link">Link Externo</option>
                  <option value="embed">Código Incorporado</option>
                </select>
              </div>
              
              {formData.type === 'link' && (
                <div className="grid gap-2">
                  <Label htmlFor="url">URL do E-book</Label>
                  <Input
                    id="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    required={formData.type === 'link'}
                  />
                  <p className="text-sm text-gray-500">
                    Insira o link para um e-book online. Suporta links do Google Docs, Canva, Issuu, entre outros.
                  </p>
                </div>
              )}
              
              {formData.type === 'embed' && (
                <div className="grid gap-2">
                  <Label htmlFor="embedCode">Código de Incorporação</Label>
                  <Textarea
                    id="embedCode"
                    name="embedCode"
                    value={formData.embedCode}
                    onChange={handleInputChange}
                    rows={5}
                    placeholder="<iframe src=... />"
                    required={formData.type === 'embed'}
                  />
                  <p className="text-sm text-gray-500">
                    Insira o código iframe para incorporar o e-book interativo.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing ? 'Processando...' : (ebook ? 'Salvar Alterações' : 'Adicionar E-book')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Edit, Trash, Plus, Layers, ExternalLink, Code } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Esquema de validação para e-book interativo
const interactiveEbookSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres'),
  type: z.enum(['link', 'embed']),
  url: z.string().url('Insira uma URL válida').optional().or(z.string().length(0)),
  embedCode: z.string().min(10, 'O código de incorporação deve ter pelo menos 10 caracteres').optional().or(z.string().length(0))
}).refine(data => {
  if (data.type === 'link') {
    return !!data.url;
  } else if (data.type === 'embed') {
    return !!data.embedCode;
  }
  return false;
}, {
  message: "Você deve fornecer uma URL ou um código de incorporação dependendo do tipo selecionado",
  path: ['url']
});

type InteractiveEbookFormValues = z.infer<typeof interactiveEbookSchema>;

interface InteractiveEbook {
  id: string;
  title: string;
  description: string;
  type: 'link' | 'embed';
  url?: string;
  embedCode?: string;
}

interface InteractiveEbookManagerProps {
  disciplineId?: string;
}

export default function InteractiveEbookManager({ disciplineId }: InteractiveEbookManagerProps) {
  const [interactiveEbook, setInteractiveEbook] = useState<InteractiveEbook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const form = useForm<InteractiveEbookFormValues>({
    resolver: zodResolver(interactiveEbookSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'link',
      url: '',
      embedCode: ''
    }
  });

  // Observa mudanças no campo 'type' para resetar campos relacionados
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'type') {
        if (value.type === 'link') {
          form.setValue('embedCode', '');
        } else if (value.type === 'embed') {
          form.setValue('url', '');
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    if (disciplineId) {
      // Aqui seria a chamada para a API para buscar o e-book interativo da disciplina
      // Por enquanto, vamos simular com dados fictícios
      setTimeout(() => {
        setInteractiveEbook({
          id: '1',
          title: 'E-book Interativo de Exemplo',
          description: 'Este é um e-book interativo com recursos avançados',
          type: 'link',
          url: 'https://example.com/interactive-ebook'
        });
        setIsLoading(false);
      }, 1000);
    }
  }, [disciplineId]);

  const handleAddInteractiveEbook = (data: InteractiveEbookFormValues) => {
    // Aqui seria a chamada para a API para adicionar o e-book interativo
    // Por enquanto, apenas atualizamos o estado local
    const newEbook: InteractiveEbook = {
      id: Date.now().toString(),
      title: data.title,
      description: data.description,
      type: data.type,
      url: data.type === 'link' ? data.url : undefined,
      embedCode: data.type === 'embed' ? data.embedCode : undefined
    };

    setInteractiveEbook(newEbook);
    setIsAddDialogOpen(false);
    form.reset();
  };

  const handleEditInteractiveEbook = () => {
    if (interactiveEbook) {
      form.reset({
        title: interactiveEbook.title,
        description: interactiveEbook.description,
        type: interactiveEbook.type,
        url: interactiveEbook.url || '',
        embedCode: interactiveEbook.embedCode || ''
      });
      setIsAddDialogOpen(true);
    }
  };

  const handleDeleteInteractiveEbook = () => {
    // Aqui seria a chamada para a API para excluir o e-book interativo
    // Por enquanto, apenas atualizamos o estado local
    setInteractiveEbook(null);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Carregando e-book interativo...</div>;
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
        <h2 className="text-xl font-semibold">E-book Interativo</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              if (!interactiveEbook) {
                form.reset({
                  title: '',
                  description: '',
                  type: 'link',
                  url: '',
                  embedCode: ''
                });
              }
            }}>
              {interactiveEbook ? <Edit className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
              {interactiveEbook ? 'Editar E-book Interativo' : 'Adicionar E-book Interativo'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{interactiveEbook ? 'Editar E-book Interativo' : 'Adicionar E-book Interativo'}</DialogTitle>
              <DialogDescription>
                Preencha os dados para {interactiveEbook ? 'editar o' : 'adicionar um novo'} e-book interativo à disciplina.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddInteractiveEbook)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Título do e-book interativo" {...field} />
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
                        <Textarea placeholder="Descrição do e-book interativo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Tipo de E-book Interativo</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="link" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Link Externo
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="embed" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Código de Incorporação
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch('type') === 'link' && (
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL do E-book Interativo</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/ebook" {...field} />
                        </FormControl>
                        <FormDescription>
                          Insira a URL completa para o e-book interativo externo
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {form.watch('type') === 'embed' && (
                  <FormField
                    control={form.control}
                    name="embedCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código de Incorporação</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="<iframe src='...' width='100%' height='600'></iframe>"
                            className="font-mono text-sm"
                            rows={5}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Cole o código HTML para incorporar o e-book interativo
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <DialogFooter>
                  <Button type="submit">{interactiveEbook ? 'Salvar Alterações' : 'Adicionar E-book Interativo'}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {!interactiveEbook ? (
        <Card className="text-center p-6">
          <div className="flex flex-col items-center justify-center p-4">
            <Layers className="h-12 w-12 text-gray-400 mb-2" />
            <h3 className="text-lg font-medium">Nenhum E-book Interativo Cadastrado</h3>
            <p className="text-sm text-gray-500 mb-4">Adicione um e-book interativo para esta disciplina.</p>
            <DialogTrigger asChild>
              <Button onClick={() => {
                form.reset({
                  title: '',
                  description: '',
                  type: 'link',
                  url: '',
                  embedCode: ''
                });
              }}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar E-book Interativo
              </Button>
            </DialogTrigger>
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{interactiveEbook.title}</CardTitle>
            <CardDescription>
              Tipo: {interactiveEbook.type === 'link' ? 'Link Externo' : 'Código Incorporado'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">{interactiveEbook.description}</p>
            {interactiveEbook.type === 'link' && interactiveEbook.url && (
              <div className="flex items-center p-3 rounded-md bg-gray-100">
                <ExternalLink className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="font-medium">Link para E-book Interativo</p>
                  <a href={interactiveEbook.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600">
                    {interactiveEbook.url}
                  </a>
                </div>
              </div>
            )}
            {interactiveEbook.type === 'embed' && interactiveEbook.embedCode && (
              <div>
                <div className="flex items-center p-3 rounded-md bg-gray-100 mb-3">
                  <Code className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <p className="font-medium">Código de Incorporação</p>
                    <p className="text-sm text-gray-500">O conteúdo será exibido abaixo</p>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                  <div dangerouslySetInnerHTML={{ __html: interactiveEbook.embedCode }} />
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleEditInteractiveEbook}>
              <Edit className="h-4 w-4 mr-1" /> Editar
            </Button>
            <Button variant="destructive" onClick={handleDeleteInteractiveEbook}>
              <Trash className="h-4 w-4 mr-1" /> Excluir
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
