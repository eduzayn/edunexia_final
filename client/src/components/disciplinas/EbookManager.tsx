import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ebookApi } from "@/api/pedagogico";
import { Ebook } from "@/types/pedagogico";
import { PlusIcon, TrashIcon, PencilIcon, DownloadIcon } from "@/components/ui/icons";

interface EbookManagerProps {
  disciplineId: string;
}

export function EbookManager({ disciplineId }: EbookManagerProps) {
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const fetchEbook = async () => {
    try {
      setLoading(true);
      const data = await ebookApi.get(disciplineId);
      setEbook(data);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar e-book:", err);
      setError("Não foi possível carregar o e-book. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEbook();
  }, [disciplineId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAddEbook = async () => {
    if (!file) {
      setError("Por favor, selecione um arquivo PDF para upload.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("file", file);

      await ebookApi.create(disciplineId, formData);
      setIsAdding(false);
      setTitle("");
      setDescription("");
      setFile(null);
      await fetchEbook();
    } catch (err) {
      console.error("Erro ao adicionar e-book:", err);
      setError("Não foi possível adicionar o e-book. Verifique os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEbook = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      if (file) {
        formData.append("file", file);
      }

      await ebookApi.update(disciplineId, formData);
      setIsEditing(false);
      setTitle("");
      setDescription("");
      setFile(null);
      await fetchEbook();
    } catch (err) {
      console.error("Erro ao atualizar e-book:", err);
      setError("Não foi possível atualizar o e-book. Verifique os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEbook = async () => {
    if (!confirm("Tem certeza que deseja excluir este e-book?")) return;

    try {
      setLoading(true);
      await ebookApi.delete(disciplineId);
      setEbook(null);
      setError(null);
    } catch (err) {
      console.error("Erro ao excluir e-book:", err);
      setError("Não foi possível excluir o e-book. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = () => {
    if (ebook) {
      setTitle(ebook.title);
      setDescription(ebook.description);
      setIsEditing(true);
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">E-book Estático</h2>
        {!ebook && !isAdding && (
          <Button 
            onClick={() => {
              setIsAdding(true);
              setIsEditing(false);
              setTitle("");
              setDescription("");
              setFile(null);
            }}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Adicionar E-book
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {(isAdding || isEditing) && (
        <Card>
          <CardHeader>
            <CardTitle>{isAdding ? "Adicionar novo e-book" : "Editar e-book"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Título do e-book"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Descrição do e-book"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="file">Arquivo PDF</Label>
                <Input 
                  id="file" 
                  type="file" 
                  accept=".pdf"
                  onChange={handleFileChange}
                />
                {isEditing && !file && (
                  <p className="text-sm text-gray-500">
                    Deixe em branco para manter o arquivo atual.
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAdding(false);
                    setIsEditing(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={isAdding ? handleAddEbook : handleUpdateEbook}
                  disabled={loading || !title || (isAdding && !file)}
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
            <div className="text-center py-4">Carregando e-book...</div>
          ) : !ebook ? (
            <div className="text-center py-6 border rounded-md bg-gray-50">
              <p className="text-gray-500">Nenhum e-book adicionado ainda.</p>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => setIsAdding(true)}
              >
                Adicionar e-book
              </Button>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{ebook.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p>{ebook.description}</p>
                  <div className="pt-2">
                    <p className="text-sm text-gray-500">
                      Arquivo: {ebook.fileName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Enviado em: {new Date(ebook.uploadDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex justify-between mt-4">
                    <Button variant="outline" onClick={() => window.open(ebook.fileUrl, '_blank')}>
                      <DownloadIcon className="mr-2 h-4 w-4" />
                      Baixar PDF
                    </Button>
                    <div className="space-x-2">
                      <Button variant="outline" onClick={startEdit}>
                        <PencilIcon className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button variant="destructive" onClick={handleDeleteEbook}>
                        <TrashIcon className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}