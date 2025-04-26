import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Discipline } from "@shared/schema";
import { VideoSource, videoSourceLabels } from "@/types/discipline";
import { updateDisciplineVideo, removeDisciplineVideo } from "@/api/disciplines";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
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
  FormMessage
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { Film, Plus, Trash2, Video } from "lucide-react";

interface VideoManagerProps {
  discipline: Discipline;
  videoNumber: number;
}

// Schema de validação para o vídeo
const videoSchema = z.object({
  url: z.string().url("Informe uma URL válida"),
  source: z.enum(["youtube", "vimeo", "onedrive", "google_drive", "upload"], {
    required_error: "Selecione a fonte do vídeo",
  }),
  startTime: z.string().optional(),
});

export function VideoManager({ discipline, videoNumber }: VideoManagerProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Determina o nome do campo com base no número do vídeo
  const urlField = `videoAula${videoNumber}Url` as keyof Discipline;
  const sourceField = `videoAula${videoNumber}Source` as keyof Discipline;
  const startTimeField = `videoAula${videoNumber}StartTime` as keyof Discipline;

  // Verifica se o vídeo existe
  const hasVideo = Boolean(discipline[urlField]);

  // Inicializa o formulário
  const form = useForm<z.infer<typeof videoSchema>>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      url: (discipline[urlField] as string) || "",
      source: (discipline[sourceField] as VideoSource) || "youtube",
      startTime: (discipline[startTimeField] as string) || "",
    },
  });

  // Função para adicionar/atualizar vídeo
  const handleSaveVideo = async (values: z.infer<typeof videoSchema>) => {
    setIsLoading(true);
    try {
      await updateDisciplineVideo(discipline.id.toString(), videoNumber, {
        url: values.url,
        source: values.source,
        startTime: values.startTime
      });

      queryClient.invalidateQueries({ queryKey: [`/api/admin/disciplines/${discipline.id}/content`] });
      
      toast({
        title: "Vídeo salvo",
        description: "O vídeo foi salvo com sucesso.",
        variant: "default",
      });
    } catch (error) {
      console.error("Erro ao salvar vídeo:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o vídeo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para remover vídeo
  const handleRemoveVideo = async () => {
    if (!window.confirm("Tem certeza que deseja remover este vídeo?")) {
      return;
    }

    setIsRemoving(true);
    try {
      await removeDisciplineVideo(discipline.id.toString(), videoNumber);
      
      queryClient.invalidateQueries({ queryKey: [`/api/admin/disciplines/${discipline.id}/content`] });
      
      toast({
        title: "Vídeo removido",
        description: "O vídeo foi removido com sucesso.",
        variant: "default",
      });

      // Reseta o formulário
      form.reset({
        url: "",
        source: "youtube",
        startTime: "",
      });
    } catch (error) {
      console.error("Erro ao remover vídeo:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao remover o vídeo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Card className={hasVideo ? "border-green-200" : ""}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center">
          <Film className="h-5 w-5 mr-2" />
          Vídeo {videoNumber}
          {hasVideo && (
            <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
              Adicionado
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {hasVideo
            ? "Edite ou remova este vídeo"
            : "Adicione um novo vídeo para esta aula"}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a fonte do vídeo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(videoSourceLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Selecione de onde o vídeo será carregado
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
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Link completo para o vídeo
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
                  <FormLabel>Tempo Inicial (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="00:00" {...field} />
                  </FormControl>
                  <FormDescription>
                    Formato: mm:ss ou hh:mm:ss
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-2">
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
                        <Video className="h-4 w-4 mr-1" />
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
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}