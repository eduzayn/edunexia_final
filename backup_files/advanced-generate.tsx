import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Sparkles, Loader2, Upload, BookOpenText, BookOpen, Link as LinkIcon, FileText, FileUp, Image, Video, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Discipline } from '@shared/schema';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import FreepikMediaSearch from '@/components/media/freepik-media-search';

// Schema para o formulário de geração avançada
const advancedGenerateSchema = z.object({
  topic: z.string().min(3, { message: 'O tópico deve ter pelo menos 3 caracteres' }),
  disciplineId: z.string().min(1, { message: 'Selecione uma disciplina' }),
  description: z.string().min(10, { message: 'A descrição deve ter pelo menos 10 caracteres' }),
  contentType: z.enum(['fromScratch', 'fromUrl', 'fromText', 'fromPdf', 'fromSyllabus'], {
    required_error: 'Selecione o tipo de conteúdo',
  }),
  // Campos para geração de mídia
  generateImages: z.boolean().default(true),
  imageCount: z.number().min(1).max(10).default(3),
  generateVideos: z.boolean().default(false),
  videoCount: z.number().min(1).max(5).default(1),
  mediaStyle: z.enum(['educational', 'realistic', 'cartoon', 'abstract', 'infographic']).default('educational'),
  contentUrl: z.string().url({ message: 'URL inválida' }).optional().nullable(),
  contentText: z.string().optional().nullable(),
  contentSource: z.string().optional().nullable(),
  additionalPrompts: z.string().optional(),
});

type AdvancedGenerateFormValues = z.infer<typeof advancedGenerateSchema>;

const AdvancedGenerateEBookPage: React.FC = () => {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const disciplineIdParam = searchParams.get('disciplineId');
  const [activeTab, setActiveTab] = useState<string>('fromScratch');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [enableImages, setEnableImages] = useState<boolean>(true);
  const [enableVideos, setEnableVideos] = useState<boolean>(false);
  const [selectedMedia, setSelectedMedia] = useState<any[]>([]);
  const [showMediaSearch, setShowMediaSearch] = useState<boolean>(false);

  // Buscar disciplinas
  const { data: disciplines, isLoading: isDisciplinesLoading } = useQuery<Discipline[]>({
    queryKey: ['/api/admin/disciplines'],
    refetchOnWindowFocus: false,
  });

  const form = useForm<AdvancedGenerateFormValues>({
    resolver: zodResolver(advancedGenerateSchema),
    defaultValues: {
      topic: '',
      disciplineId: disciplineIdParam || '',
      description: '',
      contentType: 'fromScratch',
      contentUrl: '',
      contentText: '',
      contentSource: '',
      additionalPrompts: '',
      generateImages: true,
      imageCount: 3,
      generateVideos: false,
      videoCount: 1,
      mediaStyle: 'educational',
    },
  });

  // Atualizar o contentType quando o tab muda
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    form.setValue('contentType', value as any);
  };

  // Lidar com upload de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      form.setValue('contentSource', file.name);
    } else {
      form.setValue('contentSource', null);
    }
  };

  // Mutation para gerar o e-book avançado
  const generateEBookMutation = useMutation({
    mutationFn: async (data: AdvancedGenerateFormValues & { selectedMedia?: any[] }) => {
      const formData = new FormData();
      
      // Preparar dados para envio
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === 'additionalPrompts' && value) {
            // Converter string de prompts adicionais em um array
            const promptsArray = value.split('\n').filter(Boolean);
            formData.append(key, JSON.stringify(promptsArray));
          } else if (key === 'selectedMedia' && Array.isArray(value)) {
            // Converter array de mídia selecionada para JSON
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });
      
      // Adicionar arquivo se existir
      if (selectedFile && data.contentType === 'fromPdf') {
        formData.append('file', selectedFile);
      }
      
      const response = await fetch('/api/advanced-ebooks/generate-advanced-content', {
        method: 'POST',
        body: JSON.stringify({
          topic: data.topic,
          disciplineId: parseInt(data.disciplineId),
          description: data.description,
          contentType: data.contentType,
          contentSource: data.contentSource,
          contentUrl: data.contentUrl,
          contentText: data.contentText,
          additionalPrompts: data.additionalPrompts ? data.additionalPrompts.split('\n').filter(Boolean) : [],
          // Novos campos para geração de mídia
          generateImages: data.generateImages,
          imageCount: data.imageCount,
          generateVideos: data.generateVideos,
          videoCount: data.videoCount,
          mediaStyle: data.mediaStyle,
          // Incluir mídia selecionada
          selectedMedia: data.selectedMedia || []
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao gerar conteúdo do e-book');
      }
      
      return await response.json();
    },
    onSuccess: async (data) => {
      toast({
        title: 'Conteúdo gerado com sucesso',
        description: 'O conteúdo do e-book foi gerado com sucesso. Criando e-book...',
      });
      
      // Agora criar o e-book com o conteúdo gerado
      try {
        const response = await fetch('/api/ebooks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: data.title,
            description: data.description,
            content: data.content,
            disciplineId: parseInt(form.getValues('disciplineId')),
            status: 'draft',
            isGenerated: true,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Erro ao criar e-book com o conteúdo gerado');
        }
        
        const newEBook = await response.json();
        
        // Invalidar queries para forçar a atualização da lista
        queryClient.invalidateQueries({ queryKey: ['/api/ebooks'] });
        queryClient.invalidateQueries({ queryKey: [`/api/ebooks/discipline/${form.getValues('disciplineId')}`] });
        
        toast({
          title: 'E-book criado com sucesso',
          description: 'O e-book foi criado com sucesso e está disponível na lista de e-books.',
        });
        
        // Redirecionar para a página de edição do e-book
        navigate(`/admin/ebooks/edit/${newEBook.id}`);
      } catch (error) {
        console.error('Erro ao criar e-book:', error);
        toast({
          title: 'Erro ao criar e-book',
          description: error instanceof Error ? error.message : 'Ocorreu um erro ao criar o e-book',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Erro ao gerar conteúdo',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao gerar o conteúdo do e-book',
        variant: 'destructive',
      });
    },
  });

  // Função para lidar com a seleção de mídia do Freepik
  const handleMediaSelect = (media: any) => {
    setSelectedMedia((prev) => [...prev, media]);
    toast({
      title: "Mídia adicionada",
      description: `${media.type === 'video' ? 'Vídeo' : 'Imagem'} selecionado(a) do Freepik.`,
    });
  };

  const onSubmit = (data: AdvancedGenerateFormValues) => {
    // Adicionar mídia selecionada aos dados do formulário antes de enviar
    const formData = { 
      ...data,
      selectedMedia: selectedMedia 
    };
    
    console.log('Enviando dados para gerar e-book:', formData);
    generateEBookMutation.mutate(formData);
  };

  if (isDisciplinesLoading) {
    return (
      <div className="container py-10">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            size="icon"
            className="mr-2"
            onClick={() => navigate('/admin/ebooks')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Geração Avançada de E-Book</h1>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-[300px] mb-2" />
            <Skeleton className="h-5 w-[400px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-[150px]" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex items-center mb-6">
        <Button
          variant="outline"
          size="icon"
          className="mr-2"
          onClick={() => navigate('/admin/ebooks')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Geração Avançada de E-Book</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Criar E-Book com IA Avançada</CardTitle>
          <CardDescription>
            Use nosso gerador avançado de IA para criar e-books educacionais de alta qualidade
            com a possibilidade de incorporar conteúdo existente como contexto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tópico do E-Book</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Introdução à Filosofia Moderna" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="disciplineId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disciplina</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma disciplina" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {disciplines?.map((discipline) => (
                            <SelectItem key={discipline.id} value={discipline.id.toString()}>
                              {discipline.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva os pontos principais que o e-book deve abordar..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Forneça uma descrição detalhada do conteúdo que você espera encontrar no e-book.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel>Fonte de Conteúdo</FormLabel>
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                  <TabsList className="grid grid-cols-5">
                    <TabsTrigger value="fromScratch">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Do Zero
                    </TabsTrigger>
                    <TabsTrigger value="fromUrl">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      De URL
                    </TabsTrigger>
                    <TabsTrigger value="fromText">
                      <FileText className="h-4 w-4 mr-2" />
                      De Texto
                    </TabsTrigger>
                    <TabsTrigger value="fromPdf">
                      <FileUp className="h-4 w-4 mr-2" />
                      De Arquivo
                    </TabsTrigger>
                    <TabsTrigger value="fromSyllabus">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Da Ementa
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="fromScratch" className="pt-4">
                    <p className="text-sm text-muted-foreground">
                      O conteúdo será gerado completamente do zero com base no tópico e descrição fornecidos.
                    </p>
                  </TabsContent>

                  <TabsContent value="fromUrl" className="pt-4">
                    <FormField
                      control={form.control}
                      name="contentUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="https://exemplo.com/artigo-relevante"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Forneça uma URL para um artigo ou página web que servirá como base para o conteúdo.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="fromText" className="pt-4">
                    <FormField
                      control={form.control}
                      name="contentText"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Cole aqui o texto que servirá como base para o conteúdo do e-book..."
                              className="min-h-[200px]"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Cole um texto que servirá como base para gerar o conteúdo do e-book.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="fromPdf" className="pt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="file-upload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="mb-1 text-sm text-muted-foreground">
                              <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
                            </p>
                            <p className="text-xs text-muted-foreground">PDF (MAX. 10MB)</p>
                          </div>
                          <input
                            id="file-upload"
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>
                      {selectedFile && (
                        <div className="flex items-center p-2 bg-muted rounded">
                          <FileText className="h-4 w-4 mr-2" />
                          <span className="text-sm font-medium">{selectedFile.name}</span>
                        </div>
                      )}
                      <FormDescription>
                        Faça upload de um arquivo PDF para usar como base para o conteúdo do e-book.
                        (Funcionalidade para referência, não fará upload real no momento)
                      </FormDescription>
                    </div>
                  </TabsContent>

                  <TabsContent value="fromSyllabus" className="pt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      O conteúdo será gerado com base na ementa da disciplina selecionada.
                      Certifique-se de que a disciplina selecionada possua uma ementa detalhada.
                    </p>
                  </TabsContent>
                </Tabs>
              </div>

              <FormField
                control={form.control}
                name="additionalPrompts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instruções Adicionais (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Adicione instruções específicas para a IA, uma instrução por linha..."
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Adicione instruções específicas para a IA, como "Inclua exemplos práticos" ou "Adicione exercícios no final de cada seção".
                      Cada linha será tratada como uma instrução separada.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-6 bg-muted/20 p-6 rounded-lg border">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Image className="h-5 w-5" /> Geração de Imagens
                </h3>
                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="generateImages"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              setEnableImages(!!checked);
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Gerar imagens para o e-book</FormLabel>
                          <FormDescription>
                            Adiciona imagens de alta qualidade geradas por IA para enriquecer o conteúdo
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {enableImages && (
                  <div className="pl-4 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                      <div className="flex-1 space-y-4">
                        <FormField
                          control={form.control}
                          name="imageCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantidade de imagens: {field.value}</FormLabel>
                              <FormControl>
                                <Slider
                                  min={1}
                                  max={10}
                                  step={1}
                                  defaultValue={[field.value]}
                                  onValueChange={(vals) => field.onChange(vals[0])}
                                />
                              </FormControl>
                              <FormDescription>
                                Defina quantas imagens a serem geradas para o e-book (1-10)
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex-none mt-6">
                        <Dialog open={showMediaSearch} onOpenChange={setShowMediaSearch}>
                          <DialogTrigger asChild>
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="flex items-center gap-2"
                            >
                              <Search className="h-4 w-4" />
                              Buscar no Freepik
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Buscar mídia no Freepik</DialogTitle>
                            </DialogHeader>
                            <FreepikMediaSearch 
                              onMediaSelect={handleMediaSelect}
                              maxHeight="500px"
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    
                    {/* Visualizar mídia selecionada */}
                    {selectedMedia.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Mídia selecionada ({selectedMedia.length}):</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {selectedMedia.map((media, index) => (
                            <div key={index} className="relative rounded-md overflow-hidden border">
                              <img 
                                src={media.url} 
                                alt={media.title || `Mídia ${index + 1}`}
                                className="w-full aspect-video object-cover"
                              />
                              <div className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
                                  }}
                                  className="h-5 w-5 flex items-center justify-center"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <FormField
                      control={form.control}
                      name="mediaStyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estilo das imagens</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um estilo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="educational">Educacional (padrão)</SelectItem>
                              <SelectItem value="realistic">Realista</SelectItem>
                              <SelectItem value="cartoon">Cartoon / Ilustração</SelectItem>
                              <SelectItem value="abstract">Abstrato</SelectItem>
                              <SelectItem value="infographic">Infográfico</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Escolha o estilo visual para as imagens geradas
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <h3 className="text-lg font-semibold flex items-center gap-2 mt-6">
                  <Video className="h-5 w-5" /> Geração de Vídeos 
                </h3>
                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="generateVideos"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              setEnableVideos(!!checked);
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Gerar vídeos para o e-book</FormLabel>
                          <FormDescription>
                            Adiciona vídeos educacionais gerados por IA para complementar o conteúdo
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {enableVideos && (
                  <div className="pl-4 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                      <div className="flex-1 space-y-4">
                        <FormField
                          control={form.control}
                          name="videoCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantidade de vídeos: {field.value}</FormLabel>
                              <FormControl>
                                <Slider
                                  min={1}
                                  max={5}
                                  step={1}
                                  defaultValue={[field.value]}
                                  onValueChange={(vals) => field.onChange(vals[0])}
                                />
                              </FormControl>
                              <FormDescription>
                                Defina quantos vídeos serão gerados para o e-book (1-5)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex-none mt-6">
                        <Dialog open={showMediaSearch} onOpenChange={setShowMediaSearch}>
                          <DialogTrigger asChild>
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="flex items-center gap-2"
                            >
                              <Search className="h-4 w-4" />
                              Buscar no Freepik
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Buscar mídia no Freepik</DialogTitle>
                            </DialogHeader>
                            <FreepikMediaSearch 
                              onMediaSelect={handleMediaSelect}
                              maxHeight="500px"
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <CardFooter className="px-0 pt-6 flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/ebooks')}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={generateEBookMutation.isPending}
                  className="min-w-[120px]"
                >
                  {generateEBookMutation.isPending ? (
                    <>
                      <Spinner className="mr-2" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Gerar Conteúdo
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedGenerateEBookPage;