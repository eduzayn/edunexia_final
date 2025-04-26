
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
