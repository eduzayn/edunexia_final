import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  YoutubeIcon, 
  OneDriveIcon, 
  GoogleDriveIcon, 
  VimeoIcon, 
  UploadIcon 
} from "@/components/ui/icons";
import { detectVideoSource, processVideoUrl } from "@/lib/video-utils";

// Interfaces e tipos
type VideoSourceOption = {
  value: string;
  label: string;
  icon: React.ReactNode;
};

interface VideoFormFieldsProps {
  form: UseFormReturn<any>;
}

// Lista de fontes de vídeo suportadas
const videoSourceOptions: VideoSourceOption[] = [
  { value: "youtube", label: "YouTube", icon: <YoutubeIcon className="h-4 w-4 mr-2" /> },
  { value: "vimeo", label: "Vimeo", icon: <VimeoIcon className="h-4 w-4 mr-2" /> },
  { value: "onedrive", label: "OneDrive", icon: <OneDriveIcon className="h-4 w-4 mr-2" /> },
  { value: "google_drive", label: "Google Drive", icon: <GoogleDriveIcon className="h-4 w-4 mr-2" /> },
  { value: "upload", label: "Upload Direto", icon: <UploadIcon className="h-4 w-4 mr-2" /> },
];

export default function VideoFormFields({ form }: VideoFormFieldsProps) {
  const [showStartTime, setShowStartTime] = useState(false);
  
  // Detecta automaticamente a fonte do vídeo quando a URL muda
  const watchUrl = form.watch("url");
  
  useEffect(() => {
    if (watchUrl) {
      const source = detectVideoSource(watchUrl);
      if (source === "youtube" || source === "vimeo") {
        form.setValue("videoSource", source);
        setShowStartTime(true);
      } else {
        setShowStartTime(false);
      }
    }
  }, [watchUrl, form]);

  return (
    <>
      <FormField
        control={form.control}
        name="videoSource"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Fonte do vídeo</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a fonte do vídeo" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {videoSourceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center">
                      {option.icon}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL do vídeo</FormLabel>
            <FormControl>
              <Input placeholder="https://" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duração (mm:ss)</FormLabel>
              <FormControl>
                <Input placeholder="10:30" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {showStartTime && (
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tempo de início (mm:ss)</FormLabel>
                <FormControl>
                  <Input placeholder="00:00" {...field} value={field.value || "00:00"} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </>
  );
}