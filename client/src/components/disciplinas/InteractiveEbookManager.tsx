import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { interactiveEbookApi } from "@/api/pedagogico";
import { InteractiveEbook } from "@/types/pedagogico";
import { PlusIcon, TrashIcon, PencilIcon, ExternalLinkIcon } from "@/components/ui/icons";

interface InteractiveEbookManagerProps {
  disciplineId: string;
}

export function InteractiveEbookManager({ disciplineId }: InteractiveEbookManagerProps) {
  const [ebook, setEbook] = useState<InteractiveEbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<InteractiveEbook>>({
    title: "",
    description: "",
    type: "link",
    url: "",
    embedCode: ""
  });

  const fetchEbook = async () => {
    try {
      setLoading(true);
      const data = await interactiveEbookApi.get(disciplineId);
      setEbook(data);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar e-book interativo:", err);
      setError("Não foi possível carregar o e-book interativo. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEbook();
  }, [disciplineId]);

  const handleAddEbook = async () => {
    try {
      setLoading(true);
      const payload = { ...formData } as Omit<InteractiveEbook, 'id'>;

      // Garantir que apenas os campos relevantes ao tipo sejam enviados
      if (payload.type === 'link') {
        delete payload.embedCode;
      } else {
        delete payload.url;
      }

      await interactiveEbookApi.create(disciplineId, payload);
      setIsAdding(false);
      resetForm();
      await fetchEbook();
    } catch (err) {
      console.error("Erro ao adicionar e-book interativo:", err);
      setError("Não foi possível adicionar o e-book interativo. Verifique os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEbook = async () => {
    try {
      setLoading(true);
      const payload = { ...formData };

      // Garantir que apenas os campos relevantes ao tipo sejam enviados
      if (payload.type === 'link') {
        delete payload.embedCode;
      } else {
        delete payload.url;
      }

      await interactiveEbookApi.update(disciplineId, payload);
      setIsEditing(false);
      resetForm();
      await fetchEbook();
    } catch (err) {
      console.error("Erro ao atualizar e-book interativo:", err);
      setError("Não foi possível atualizar o e-book interativo. Verifique os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEbook = async () => {
    if (!confirm("Tem certeza que deseja excluir este e-book interativo?")) return;

    try {
      setLoading(true);
      await interactiveEbookApi.delete(disciplineId);
      setEbook(null);
      setError(null);
    } catch (err) {
      console.error("Erro ao excluir e-book interativo:", err);
      setError("Não foi possível excluir o e-book interativo. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = () => {
    if (ebook) {
      setFormData({
        title: ebook.title,
        description: ebook.description,
        type: ebook.type,
        url: ebook.url || "",
        embedCode: ebook.embedCode || ""
      });
      setIsEditing(true);
      setIsAdding(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "link",
      url: "",
      embedCode: ""
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">E-book Interativo</h2>
        {!ebook && !isAdding && (
          <Button 
            onClick={() => {
              setIsAdding(true);
              setIsEditing(false);
              resetForm();
            }}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Adicionar E-book Interativo
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
            <CardTitle>{isAdding ? "Adicionar novo e-book interativo" : "Editar e-book interativo"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título</Label>
                <Input 
                  id="title" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="Título do e-book interativo"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  id="description" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Descrição do e-book interativo"
                />
              </div>

              <div className="grid gap-2">
                <Label>Tipo de conteúdo</Label>
                <RadioGroup 
                  value={formData.type} 
                  onValueChange={(value) => setFormData({...formData, type: value as 'link' | 'embed'})}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="link" id="link" />
                    <Label htmlFor="link">Link externo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="embed" id="embed" />
                    <Label htmlFor="embed">Código de incorporação</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.type === 'link' ? (
                <div className="grid gap-2">
                  <Label htmlFor="url">URL</Label>
                  <Input 
                    id="url" 
                    value={formData.url} 
                    onChange={e => setFormData({...formData, url: e.target.value})}
                    placeholder="URL do conteúdo (Google Drive, OneDrive, site externo, etc.)"
                  />
                  <p className="text-xs text-gray-500">
                    Cole a URL completa do recurso que você deseja compartilhar (ex: documento do Drive, vídeo, etc.)
                  </p>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="embedCode">Código de incorporação</Label>
                  <Textarea 
                    id="embedCode" 
                    value={formData.embedCode} 
                    onChange={e => setFormData({...formData, embedCode: e.target.value})}
                    placeholder="<iframe src='...'></iframe>"
                    rows={5}
                  />
                  <p className="text-xs text-gray-500">
                    Cole o código de incorporação fornecido pelo serviço (ex: YouTube, Vimeo, etc.)
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAdding(false);
                    setIsEditing(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={isAdding ? handleAddEbook : handleUpdateEbook}
                  disabled={loading || !formData.title || (formData.type === 'link' && !formData.url) || (formData.type === 'embed' && !formData.embedCode)}
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
            <div className="text-center py-4">Carregando e-book interativo...</div>
          ) : !ebook ? (
            <div className="text-center py-6 border rounded-md bg-gray-50">
              <p className="text-gray-500">Nenhum e-book interativo adicionado ainda.</p>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => setIsAdding(true)}
              >
                Adicionar e-book interativo
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
                      Tipo: {ebook.type === 'link' ? 'Link externo' : 'Código incorporado'}
                    </p>
                  </div>

                  {ebook.type === 'link' && ebook.url && (
                    <div className="bg-gray-50 p-4 rounded border">
                      <p className="mb-2">Link para conteúdo externo:</p>
                      <a 
                        href={ebook.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center"
                      >
                        {ebook.url}
                        <ExternalLinkIcon className="ml-1 h-4 w-4" />
                      </a>
                    </div>
                  )}

                  {ebook.type === 'embed' && ebook.embedCode && (
                    <div className="bg-gray-50 p-4 rounded border">
                      <p className="mb-2">Visualização do conteúdo incorporado:</p>
                      <div className="border rounded overflow-hidden aspect-video" 
                           dangerouslySetInnerHTML={{ __html: ebook.embedCode }}>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 mt-4">
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
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}