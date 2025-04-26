import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Upload, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  videoFormSchema, 
  VideoSource, 
  Discipline,
  VideoContent
} from "@/types/discipline";
import { z } from "zod";
import { addVideo, removeVideo } from "@/api/disciplines";
import { queryClient } from "@/lib/queryClient";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type VideoManagerProps = {
  discipline: Discipline;
  videoNumber: number;
};

export function VideoManager({ discipline, videoNumber }: VideoManagerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Determinar se o vídeo já existe para esta posição
  const getCurrentVideoData = (): {exists: boolean, url?: string, source?: VideoSource, startTime?: string} => {
    const urlKey = `videoAula${videoNumber}Url` as keyof Discipline;
    const sourceKey = `videoAula${videoNumber}Source` as keyof Discipline;
    const startTimeKey = `videoAula${videoNumber}StartTime` as keyof Discipline;
    
    const url = discipline[urlKey] as string | undefined;
    const source = discipline[sourceKey] as VideoSource | undefined;
    const startTime = discipline[startTimeKey] as string | undefined;
    
    return {
      exists: !!url,
      url,
      source,
      startTime
    };
  };
  
  const currentVideo = getCurrentVideoData();
  
  const form = useForm<z.infer<typeof videoFormSchema>>({
    resolver: zodResolver(videoFormSchema),
    defaultValues: {
      url: currentVideo.url || "",
      source: currentVideo.source || VideoSource.YOUTUBE,
      startTime: currentVideo.startTime || "",
    },
  });
  
  // Função para adicionar vídeo
  const handleAddVideo = async (data: z.infer<typeof videoFormSchema>) => {
    setIsSubmitting(true);
    try {
      await addVideo(discipline.id, videoNumber, data);
      
      toast({
        title: "Vídeo adicionado",
        description: `O vídeo ${videoNumber} foi adicionado com sucesso à disciplina.`,
        variant: "default",
      });
      
      // Atualizar os dados no cache
      queryClient.invalidateQueries({ queryKey: [`/api/admin/disciplines/${discipline.id}/content`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/disciplines/${discipline.id}`] });
    } catch (error) {
      console.error("Erro ao adicionar vídeo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o vídeo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Função para remover vídeo
  const handleRemoveVideo = async () => {
    setIsSubmitting(true);
    try {
      await removeVideo(discipline.id, videoNumber);
      
      toast({
        title: "Vídeo removido",
        description: `O vídeo ${videoNumber} foi removido da disciplina.`,
        variant: "default",
      });
      
      // Resetar formulário
      form.reset({
        url: "",
        source: VideoSource.YOUTUBE,
        startTime: "",
      });
      
      // Atualizar os dados no cache
      queryClient.invalidateQueries({ queryKey: [`/api/admin/disciplines/${discipline.id}/content`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/disciplines/${discipline.id}`] });
    } catch (error) {
      console.error("Erro ao remover vídeo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o vídeo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderSourceHelp = () => {
    const source = form.watch("source") as VideoSource;
    
    switch (source) {
      case VideoSource.YOUTUBE:
        return "Cole o link completo do vídeo do YouTube (ex: https://www.youtube.com/watch?v=XXXX)";
      case VideoSource.ONEDRIVE:
        return "Cole o link de compartilhamento do OneDrive";
      case VideoSource.GOOGLE_DRIVE:
        return "Cole o link de compartilhamento público do Google Drive";
      case VideoSource.VIMEO:
        return "Cole o link completo do vídeo do Vimeo";
      case VideoSource.UPLOAD:
        return "Cole o link do vídeo após fazer upload para o servidor";
      default:
        return "Insira o URL do vídeo";
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Vídeo Aula {videoNumber}
        </CardTitle>
        <CardDescription>
          {currentVideo.exists 
            ? "Configure ou substitua o vídeo para esta aula"
            : "Adicione um vídeo para esta aula"}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleAddVideo)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Vídeo</FormLabel>
                  <FormControl>
                    <Input placeholder="https://" {...field} />
                  </FormControl>
                  <FormDescription>
                    {renderSourceHelp()}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <SelectValue placeholder="Selecione a fonte" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={VideoSource.YOUTUBE}>YouTube</SelectItem>
                        <SelectItem value={VideoSource.ONEDRIVE}>OneDrive</SelectItem>
                        <SelectItem value={VideoSource.GOOGLE_DRIVE}>Google Drive</SelectItem>
                        <SelectItem value={VideoSource.VIMEO}>Vimeo</SelectItem>
                        <SelectItem value={VideoSource.UPLOAD}>Upload</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Plataforma onde o vídeo está hospedado
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
                      <Input placeholder="00:00" {...field} />
                    </FormControl>
                    <FormDescription>
                      Formato: mm:ss (ex: 01:30 para 1 minuto e 30 segundos)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            {currentVideo.exists ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    type="button"
                    className="text-destructive"
                    disabled={isSubmitting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover Vídeo
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação removerá o vídeo {videoNumber} da disciplina. 
                      Esta ação pode afetar o status de completude da disciplina.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleRemoveVideo}
                    >
                      Remover
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <div></div> // Espaçador para manter o layout
            )}
            
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {currentVideo.exists ? "Atualizar Vídeo" : "Adicionar Vídeo"}
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}