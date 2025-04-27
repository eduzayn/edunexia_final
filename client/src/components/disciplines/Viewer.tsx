import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Maximize2, Minimize2 } from "lucide-react";

interface ViewerProps {
  url: string;
}

export function Viewer({ url }: ViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Função para determinar o tipo de conteúdo com base na URL
  const getContentType = (url: string): "youtube" | "vimeo" | "pdf" | "google-drive" | "other" => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      return "youtube";
    } else if (url.includes("vimeo.com")) {
      return "vimeo";
    } else if (url.endsWith(".pdf") || url.includes(".pdf?")) {
      return "pdf";
    } else if (url.includes("drive.google.com")) {
      return "google-drive";
    } else {
      return "other";
    }
  };

  // Função para extrair o ID do vídeo do YouTube
  const getYoutubeVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Função para extrair o ID do vídeo do Vimeo
  const getVimeoVideoId = (url: string): string | null => {
    const regex = /vimeo\.com\/(?:video\/)?([0-9]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Converter URL do Google Drive para URL de visualização embutida
  const getGoogleDriveEmbedUrl = (url: string): string => {
    // Para arquivos do Google Drive, usamos o visualizador embutido
    const fileId = url.match(/[-\w]{25,}/);
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId[0]}/preview`;
    }
    return url;
  };

  const contentType = getContentType(url);
  let embedUrl = "";

  switch (contentType) {
    case "youtube":
      const youtubeId = getYoutubeVideoId(url);
      embedUrl = youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : "";
      break;
    case "vimeo":
      const vimeoId = getVimeoVideoId(url);
      embedUrl = vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : "";
      break;
    case "google-drive":
      embedUrl = getGoogleDriveEmbedUrl(url);
      break;
    case "pdf":
      // Para PDFs, podemos usar o visualizador do Google para PDFs externos
      if (!url.startsWith("https://docs.google.com")) {
        embedUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
      } else {
        embedUrl = url;
      }
      break;
    default:
      embedUrl = url;
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Card className={`overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      <div className="flex justify-between items-center p-2 bg-muted">
        <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          {isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
        </Button>
        
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm">
            <ExternalLink className="h-4 w-4 mr-1" />
            Abrir em nova aba
          </Button>
        </a>
      </div>
      
      <CardContent className={`p-0 ${isFullscreen ? 'h-[calc(100vh-40px)]' : 'h-[500px]'}`}>
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-center">
              Não foi possível exibir este conteúdo.
              <br />
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Clique aqui para abrir o link externo
              </a>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}