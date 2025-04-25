import React, { useEffect } from 'react';
import { Control } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  YoutubeIcon,
  OneDriveIcon,
  GoogleDriveIcon,
  VimeoIcon,
  UploadIcon,
} from "@/components/ui/icons";

export type VideoSource = "youtube" | "vimeo" | "onedrive" | "google_drive" | "upload";

// Detecta automaticamente o tipo de fonte de vídeo baseado na URL
function detectVideoSource(url: string): VideoSource | null {
  if (!url) return null;
  
  // Detecta URLs do YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  
  // Detecta URLs do Vimeo
  if (url.includes('vimeo.com') || url.includes('player.vimeo.com')) {
    return 'vimeo';
  }
  
  // Detecta URLs do Google Drive
  if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
    return 'google_drive';
  }
  
  // Detecta URLs do OneDrive
  if (url.includes('onedrive.live.com') || url.includes('1drv.ms')) {
    return 'onedrive';
  }
  
  return null;
}

interface VideoFormFieldsProps {
  control: Control<any>;
  idSuffix?: string;
  setPreviewVideoUrl?: (url: string) => void;
  setPreviewVideoSource?: (source: VideoSource) => void;
  watch: (name: string) => any;
}

const VideoFormFields: React.FC<VideoFormFieldsProps> = ({
  control,
  idSuffix = '',
  setPreviewVideoUrl,
  setPreviewVideoSource,
  watch
}) => {
  // Cria uma função para detectar a fonte de vídeo
  const detectAndUpdateSource = (url: string) => {
    if (!url) return;
    
    const detectedSource = detectVideoSource(url);
    const currentSource = watch("videoSource");
    
    // Somente atualiza se detectou uma fonte e é diferente da atual
    if (detectedSource && detectedSource !== currentSource) {
      // Atualiza o estado no componente pai para a prévia
      if (setPreviewVideoSource) {
        setPreviewVideoSource(detectedSource);
      }
      
      console.log(`Fonte de vídeo detectada automaticamente: ${detectedSource}`);
    }
  };
  
  // Observa mudanças na URL para atualizar tipo de vídeo
  useEffect(() => {
    const url = watch("url");
    detectAndUpdateSource(url);
  }, [watch]);
  
  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Título</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Introdução à Disciplina" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descrição</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Breve descrição do conteúdo do vídeo..."
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="videoSource"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Origem do Vídeo</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={(value) => {
                  field.onChange(value);
                  if (setPreviewVideoSource) {
                    setPreviewVideoSource(value as VideoSource);
                  }
                }}
                defaultValue={field.value}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="youtube" id={`youtube${idSuffix}`} />
                  <Label htmlFor={`youtube${idSuffix}`} className="flex items-center">
                    <YoutubeIcon className="mr-2 h-4 w-4 text-red-600" />
                    YouTube
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="onedrive" id={`onedrive${idSuffix}`} />
                  <Label htmlFor={`onedrive${idSuffix}`} className="flex items-center">
                    <OneDriveIcon className="mr-2 h-4 w-4 text-blue-500" />
                    OneDrive
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="google_drive" id={`google_drive${idSuffix}`} />
                  <Label htmlFor={`google_drive${idSuffix}`} className="flex items-center">
                    <GoogleDriveIcon className="mr-2 h-4 w-4 text-green-500" />
                    Google Drive
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="vimeo" id={`vimeo${idSuffix}`} />
                  <Label htmlFor={`vimeo${idSuffix}`} className="flex items-center">
                    <VimeoIcon className="mr-2 h-4 w-4 text-blue-600" />
                    Vimeo
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="upload" id={`upload${idSuffix}`} />
                  <Label htmlFor={`upload${idSuffix}`} className="flex items-center">
                    <UploadIcon className="mr-2 h-4 w-4" />
                    Upload Direto
                  </Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL do Vídeo</FormLabel>
            <FormControl>
              <Input 
                placeholder="https://" 
                {...field} 
                onChange={(e) => {
                  field.onChange(e);
                  if (setPreviewVideoUrl) {
                    setPreviewVideoUrl(e.target.value);
                  }
                }}
              />
            </FormControl>
            <FormDescription>
              {watch("videoSource") === "youtube"
                ? "Cole a URL completa do vídeo no YouTube."
                : watch("videoSource") === "onedrive"
                ? "Cole a URL de compartilhamento do OneDrive."
                : watch("videoSource") === "google_drive"
                ? "Cole a URL de compartilhamento do Google Drive."
                : watch("videoSource") === "vimeo"
                ? "Cole a URL completa do vídeo no Vimeo."
                : "Cole a URL de upload direto do vídeo."}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Grade com 2 colunas para campos de duração e tempo de início */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duração (mm:ss)</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Ex: 45:30"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {watch("videoSource") === "youtube" ? (
          <FormField
            control={control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tempo de Início (mm:ss)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Ex: 01:30"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : <div></div>}
      </div>
      
      {/* Descrição para o campo de tempo de início */}
      {watch("videoSource") === "youtube" && (
        <div className="text-xs text-slate-500 -mt-4">
          Defina em qual momento o vídeo deve começar (opcional). Útil para pular introduções ou anúncios.
        </div>
      )}
    </div>
  );
};

export default VideoFormFields;