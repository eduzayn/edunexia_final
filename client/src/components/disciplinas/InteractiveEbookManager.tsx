
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
