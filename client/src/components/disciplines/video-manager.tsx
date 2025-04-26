import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Discipline } from "@shared/schema";
import { updateDisciplineVideo, removeDisciplineVideo } from "@/api/disciplines";
import { queryClient } from "@/lib/queryClient";
import { videoSourceLabels, VideoSource } from "@/types/discipline";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, ExternalLink, Pause, Play, Plus, Trash2, Upload, Video } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Schema de validação para o vídeo
const videoSchema = z.object({
  url: z.string().url("Informe uma URL válida para o vídeo"),
  source: z.string().min(1, "Selecione a fonte do vídeo"),
  startTime: z.string().optional(),
});

interface VideoManagerProps {
  discipline: Discipline;
  videoNumber: number;
}

export function VideoManager({ discipline, videoNumber }: VideoManagerProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mapeia o número do vídeo para os campos correspondentes na disciplina
  const videoUrl = discipline[`videoAula${videoNumber}Url` as keyof Discipline] as string | null;
  const videoSource = discipline[`videoAula${videoNumber}Source` as keyof Discipline] as VideoSource | null;
  const videoStartTime = discipline[`videoAula${videoNumber}StartTime` as keyof Discipline] as string | null;
  
  // Verifica se o vídeo existe
  const hasVideo = Boolean(videoUrl && videoSource);

  // Inicializa o formulário
  const form = useForm<z.infer<typeof videoSchema>>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      url: videoUrl || "",
      source: videoSource || "",
      startTime: videoStartTime || "",
    },
  });

  // Função para adicionar/atualizar vídeo
  const handleSaveVideo = async (values: z.infer<typeof videoSchema>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await updateDisciplineVideo(
        discipline.id.toString(), 
        videoNumber,
        {
          url: values.url,
          source: values.source,
          startTime: values.startTime || undefined
        }
      );
      
      // Invalida o cache para atualizar os dados
      queryClient.invalidateQueries({ queryKey: [`/api/admin/disciplines/${discipline.id}/content`] });
      
      toast({
        title: "Vídeo salvo",
        description: `O vídeo ${videoNumber} foi salvo com sucesso.`,
        variant: "default",
      });
    } catch (error) {
      console.error(`Erro ao salvar vídeo ${videoNumber}:`, error);
      setError("Ocorreu um erro ao salvar o vídeo. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Função para remover vídeo
  const handleRemoveVideo = async () => {
    if (!window.confirm(`Tem certeza que deseja remover o vídeo ${videoNumber}?`)) {
      return;
    }

    setIsRemoving(true);
    setError(null);
    
    try {
      await removeDisciplineVideo(discipline.id.toString(), videoNumber);
      
      // Invalida o cache para atualizar os dados
      queryClient.invalidateQueries({ queryKey: [`/api/admin/disciplines/${discipline.id}/content`] });
      
      toast({
        title: "Vídeo removido",
        description: `O vídeo ${videoNumber} foi removido com sucesso.`,
        variant: "default",
      });

      // Reseta o formulário
      form.reset({
        url: "",
        source: "",
        startTime: "",
      });
    } catch (error) {
      console.error(`Erro ao remover vídeo ${videoNumber}:`, error);
      setError("Ocorreu um erro ao remover o vídeo. Tente novamente.");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Card className={hasVideo ? "border-blue-200" : ""}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center">
          <Video className="h-5 w-5 mr-2" />
          Vídeo Aula {videoNumber}
          {hasVideo && (
            <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
              Adicionado
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {hasVideo
            ? "Edite ou remova este vídeo da disciplina"
            : "Adicione um vídeo para esta aula"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSaveVideo)} className="space-y-4">
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fonte do Vídeo</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isLoading || isRemoving}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a fonte do vídeo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(videoSourceLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Plataforma ou serviço de origem do vídeo
                  </FormDescription>
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
                    <Input 
                      placeholder="https://..." 
                      {...field} 
                      disabled={isLoading || isRemoving}
                    />
                  </FormControl>
                  <FormDescription>
                    URL completa do vídeo na plataforma selecionada
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempo de Início (opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="00:00" 
                      {...field} 
                      disabled={isLoading || isRemoving}
                    />
                  </FormControl>
                  <FormDescription>
                    Tempo em que o vídeo deve começar (formato: mm:ss ou segundos)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between pt-2">
              {hasVideo && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(videoUrl || "#", "_blank")}
                  disabled={isRemoving || isLoading}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Visualizar
                </Button>
              )}
              
              <div className="ml-auto flex space-x-2">
                {hasVideo && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveVideo}
                    disabled={isRemoving || isLoading}
                  >
                    {isRemoving ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                        Removendo...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </>
                    )}
                  </Button>
                )}
                <Button type="submit" size="sm" disabled={isLoading || isRemoving}>
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      {hasVideo ? (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          Atualizar
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}