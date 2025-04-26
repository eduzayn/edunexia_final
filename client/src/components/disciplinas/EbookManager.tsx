
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
  CardContent
} from "@/components/ui";
import { PlusIcon, TrashIcon, PencilIcon, UploadIcon, FileIcon, ExternalLinkIcon } from "lucide-react";

interface Ebook {
  id?: number | string;
  disciplineId?: number | string;
  title: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  uploadedAt?: string;
}

interface EbookManagerProps {
  disciplineId: string | number;
}

export default function EbookManager({ disciplineId }: EbookManagerProps) {
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Ebook>>({
    title: '',
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function fetchEbook() {
      try {
        setLoading(true);
        const response = await fetch(`/api/disciplines/${disciplineId}/ebook`);
        if (!response.ok) {
          if (response.status === 404) {
            // Não existe e-book para esta disciplina, o que é normal
            setEbook(null);
            return;
          }
          throw new Error('Falha ao carregar e-book');
        }
        const data = await response.json();
        setEbook(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar e-book');
        console.error('Erro ao carregar e-book:', err);
      } finally {
        setLoading(false);
      }
    }

    if (disciplineId) {
      fetchEbook();
    }
  }, [disciplineId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
    });
    setSelectedFile(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = () => {
    if (ebook) {
      setFormData({
        title: ebook.title,
        description: ebook.description || '',
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

    if (!ebook && !selectedFile) {
      setError('É necessário selecionar um arquivo PDF');
      return;
    }

    try {
      setUploading(true);
      
      const formDataObj = new FormData();
      formDataObj.append('title', formData.title || '');
      formDataObj.append('description', formData.description || '');
      
      if (selectedFile) {
        formDataObj.append('file', selectedFile);
      }

      const method = ebook ? 'PUT' : 'POST';
      const response = await fetch(`/api/disciplines/${disciplineId}/ebook`, {
        method,
        body: formDataObj,
      });

      if (!response.ok) {
        throw new Error(`Falha ao ${ebook ? 'atualizar' : 'adicionar'} e-book`);
      }

      const updatedEbook = await response.json();
      setEbook(updatedEbook);
      
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Erro ao ${ebook ? 'atualizar' : 'adicionar'} e-book`);
      console.error(`Erro ao ${ebook ? 'atualizar' : 'adicionar'} e-book:`, err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este e-book?')) {
      return;
    }

    try {
      const response = await fetch(`/api/disciplines/${disciplineId}/ebook`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Falha ao excluir e-book');
      }

      setEbook(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir e-book');
      console.error('Erro ao excluir e-book:', err);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Tamanho desconhecido';
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  if (loading) {
    return <div>Carregando e-book...</div>;
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
            Adicionar E-book
          </Button>
        ) : (
          <Button onClick={openEditDialog}>
            <PencilIcon className="h-4 w-4 mr-2" />
            Editar E-book
          </Button>
        )}
      </div>

      {!ebook ? (
        <div className="text-center p-8 bg-gray-50 rounded-md">
          <p className="text-gray-500">
            Nenhum e-book cadastrado para esta disciplina
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <FileIcon className="h-10 w-10 text-blue-500 mr-4" />
              <div>
                <h3 className="font-semibold text-lg">{ebook.title}</h3>
                {ebook.description && (
                  <p className="text-gray-600">{ebook.description}</p>
                )}
                <div className="text-sm text-gray-500 mt-1">
                  {ebook.fileName && (
                    <p>{ebook.fileName} ({formatFileSize(ebook.fileSize)})</p>
                  )}
                  {ebook.uploadedAt && (
                    <p>Adicionado em: {new Date(ebook.uploadedAt).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button asChild variant="outline">
                <a href={ebook.fileUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLinkIcon className="h-4 w-4 mr-2" />
                  Visualizar
                </a>
              </Button>
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
              {ebook ? 'Editar E-book' : 'Adicionar E-book'}
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
                <Label htmlFor="file">Arquivo PDF</Label>
                {ebook && !selectedFile && (
                  <div className="mb-2 text-sm">
                    Arquivo atual: {ebook.fileName} ({formatFileSize(ebook.fileSize)})
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file')?.click()}
                  >
                    <UploadIcon className="h-4 w-4 mr-2" />
                    {selectedFile ? 'Alterar arquivo' : 'Selecionar arquivo'}
                  </Button>
                  {selectedFile && (
                    <span className="text-sm">
                      {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </span>
                  )}
                </div>
                {!ebook && (
                  <p className="text-sm text-gray-500 mt-1">
                    Selecione um arquivo PDF para upload
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? 'Enviando...' : (ebook ? 'Salvar Alterações' : 'Adicionar E-book')}
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Edit, Trash, Plus, FileText, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Esquema de validação para e-book
const ebookSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres'),
  // Por enquanto, não validamos o arquivo, pois isso seria feito no upload real
  file: z.any().optional()
});

type EbookFormValues = z.infer<typeof ebookSchema>;

interface Ebook {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  uploadDate: string;
}

interface EbookManagerProps {
  disciplineId?: string;
}

export default function EbookManager({ disciplineId }: EbookManagerProps) {
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<EbookFormValues>({
    resolver: zodResolver(ebookSchema),
    defaultValues: {
      title: '',
      description: ''
    }
  });

  useEffect(() => {
    if (disciplineId) {
      // Aqui seria a chamada para a API para buscar o e-book da disciplina
      // Por enquanto, vamos simular com dados fictícios
      setTimeout(() => {
        setEbook({
          id: '1',
          title: 'Material Completo da Disciplina',
          description: 'Este é o material completo que cobre todos os tópicos da disciplina',
          fileUrl: 'https://example.com/ebooks/disciplina-material.pdf',
          fileName: 'disciplina-material.pdf',
          uploadDate: '2023-04-15'
        });
        setIsLoading(false);
      }, 1000);
    }
  }, [disciplineId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAddEbook = (data: EbookFormValues) => {
    // Aqui seria a chamada para a API para adicionar o e-book
    // Por enquanto, apenas atualizamos o estado local
    const newEbook: Ebook = {
      id: Date.now().toString(),
      title: data.title,
      description: data.description,
      fileUrl: selectedFile ? URL.createObjectURL(selectedFile) : '',
      fileName: selectedFile ? selectedFile.name : 'arquivo.pdf',
      uploadDate: new Date().toISOString().split('T')[0]
    };

    setEbook(newEbook);
    setIsAddDialogOpen(false);
    form.reset();
    setSelectedFile(null);
  };

  const handleEditEbook = () => {
    if (ebook) {
      form.reset({
        title: ebook.title,
        description: ebook.description
      });
      setIsAddDialogOpen(true);
    }
  };

  const handleDeleteEbook = () => {
    // Aqui seria a chamada para a API para excluir o e-book
    // Por enquanto, apenas atualizamos o estado local
    setEbook(null);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Carregando e-book...</div>;
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
        <h2 className="text-xl font-semibold">E-book da Disciplina</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              if (!ebook) {
                form.reset({
                  title: '',
                  description: ''
                });
              }
            }}>
              {ebook ? <Edit className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
              {ebook ? 'Editar E-book' : 'Adicionar E-book'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{ebook ? 'Editar E-book' : 'Adicionar E-book'}</DialogTitle>
              <DialogDescription>
                Preencha os dados para {ebook ? 'editar o' : 'adicionar um novo'} e-book à disciplina.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddEbook)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Título do e-book" {...field} />
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
                        <Input placeholder="Descrição do e-book" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="file"
                  render={() => (
                    <FormItem>
                      <FormLabel>Arquivo PDF</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                        />
                      </FormControl>
                      <FormDescription>
                        Selecione um arquivo PDF para upload
                      </FormDescription>
                      {selectedFile && (
                        <p className="text-sm text-blue-600">
                          Arquivo selecionado: {selectedFile.name}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">{ebook ? 'Salvar Alterações' : 'Adicionar E-book'}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {!ebook ? (
        <Card className="text-center p-6">
          <div className="flex flex-col items-center justify-center p-4">
            <FileText className="h-12 w-12 text-gray-400 mb-2" />
            <h3 className="text-lg font-medium">Nenhum E-book Cadastrado</h3>
            <p className="text-sm text-gray-500 mb-4">Adicione um e-book estático para esta disciplina.</p>
            <DialogTrigger asChild>
              <Button onClick={() => {
                form.reset({
                  title: '',
                  description: ''
                });
              }}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar E-book
              </Button>
            </DialogTrigger>
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{ebook.title}</CardTitle>
            <CardDescription>Adicionado em: {ebook.uploadDate}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">{ebook.description}</p>
            <div className="flex items-center p-3 rounded-md bg-gray-100">
              <FileText className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="font-medium">{ebook.fileName}</p>
                <a href={ebook.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600">
                  Visualizar arquivo
                </a>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleEditEbook}>
              <Edit className="h-4 w-4 mr-1" /> Editar
            </Button>
            <Button variant="destructive" onClick={handleDeleteEbook}>
              <Trash className="h-4 w-4 mr-1" /> Excluir
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
