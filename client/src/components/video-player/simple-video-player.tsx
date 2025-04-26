import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { VideoSource, processVideoUrl } from "@/lib/video-utils";

interface SimpleVideoPlayerProps {
  url: string;
  title: string;
  source?: VideoSource;
  startTime?: string;
  className?: string;
}

/**
 * Um player de vídeo simplificado apenas para visualização de conteúdo
 * através de iframes de serviços de terceiros.
 */
export default function SimpleVideoPlayer({
  url,
  title,
  source = 'youtube',
  startTime,
  className = '',
}: SimpleVideoPlayerProps) {
  // Se não houver URL, mostrar um esqueleto
  if (!url) {
    return (
      <div className={`aspect-video rounded-lg ${className}`}>
        <Skeleton className="w-full h-full" />
      </div>
    );
  }
  
  try {
    // Processar a URL do vídeo para obter o embed URL
    const { embedUrl } = processVideoUrl(url, source, startTime);
    
    // Renderizar o iframe
    return (
      <div className={`aspect-video rounded-lg overflow-hidden ${className}`}>
        <iframe
          width="100%"
          height="100%"
          src={embedUrl}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  } catch (err) {
    // Em caso de erro, mostrar uma mensagem e botão para abrir o link externo
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <h3 className="text-red-700 font-medium mb-2">Erro ao carregar vídeo</h3>
        <p className="text-red-600 text-sm">
          Não foi possível processar o vídeo. Tente abrir em uma nova aba.
        </p>
        <div className="mt-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(url, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir em nova aba
          </Button>
        </div>
      </div>
    );
  }
}