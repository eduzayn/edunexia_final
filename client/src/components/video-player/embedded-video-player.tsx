import React, { useState, useEffect, useRef } from 'react';
import {
  PlayCircle,
  PauseCircle,
  Volume2,
  VolumeX,
  Maximize,
  SkipForward,
  SkipBack,
  ExternalLink,
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  VideoSource, 
  processVideoUrl, 
  extractYouTubeVideoId, 
  extractVimeoVideoId, 
  timeToSeconds, 
  getGoogleDriveEmbedUrl, 
  getOneDriveEmbedUrl 
} from "@/lib/video-utils";

interface EmbeddedVideoPlayerProps {
  url: string;
  title: string;
  source?: VideoSource;
  poster?: string;
  startTime?: string; // Tempo de início no formato mm:ss
  onEnded?: () => void;
  className?: string;
}

/**
 * Formata o tempo em segundos para o formato mm:ss
 */
function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '00:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');
  
  return `${formattedMinutes}:${formattedSeconds}`;
}

const EmbeddedVideoPlayer: React.FC<EmbeddedVideoPlayerProps> = ({
  url,
  title,
  source = 'youtube',
  poster,
  startTime,
  onEnded,
  className = '',
}) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Processar a URL do vídeo usando o utilitário centralizado
  const videoInfo = processVideoUrl(url, source, startTime);
  
  // Determinar se é um vídeo de serviço externo (YouTube, Vimeo, etc)
  const isExternalService = ['youtube', 'vimeo', 'onedrive', 'google_drive'].includes(videoInfo.source);
  
  // Extrair IDs de vídeo para serviços compatíveis (mantendo para compatibilidade)
  const youtubeVideoId = videoInfo.source === 'youtube' ? videoInfo.id : null;
  const vimeoVideoId = videoInfo.source === 'vimeo' ? videoInfo.id : null;
  
  // Carregar o iframe API do YouTube se necessário
  useEffect(() => {
    if (videoInfo.source === 'youtube' && youtubeVideoId) {
      // YouTube iframe API já está carregada?
      if (typeof window !== 'undefined' && !window.YT) {
        // Criar script do YouTube API
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        if (firstScriptTag && firstScriptTag.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
          document.head.appendChild(tag);
        }
      }
      
      // Não precisa esperar pelo carregamento da API para mostrar o iframe
      setIsLoading(false);
    }
  }, [videoInfo.source, youtubeVideoId]);
  
  // Funções para player HTML5 nativo (uploads diretos)
  const togglePlay = () => {
    if (!isExternalService && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(error => {
          toast({
            title: "Erro ao reproduzir vídeo",
            description: error.message,
            variant: "destructive",
          });
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (!isExternalService && videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (!isExternalService && videoRef.current) {
      const current = videoRef.current.currentTime;
      const videoDuration = videoRef.current.duration;
      setCurrentTime(current);
      setProgress((current / videoDuration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (!isExternalService && videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  };

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isExternalService && videoRef.current) {
      const progressBar = e.currentTarget;
      const position = (e.nativeEvent.offsetX / progressBar.offsetWidth);
      videoRef.current.currentTime = position * videoRef.current.duration;
    }
  };

  const toggleFullscreen = () => {
    if (!isExternalService && playerContainerRef.current) {
      if (!document.fullscreenElement) {
        playerContainerRef.current.requestFullscreen().catch(err => {
          toast({
            title: "Erro",
            description: `Não foi possível ativar o modo tela cheia: ${err.message}`,
            variant: "destructive",
          });
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  const skipForward = () => {
    if (!isExternalService && videoRef.current) {
      videoRef.current.currentTime += 10; // Avançar 10 segundos
    }
  };

  const skipBackward = () => {
    if (!isExternalService && videoRef.current) {
      videoRef.current.currentTime -= 10; // Retroceder 10 segundos
    }
  };
  
  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <h3 className="text-red-700 font-medium mb-2">Erro ao carregar vídeo</h3>
        <p className="text-red-600 text-sm">{error}</p>
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
  
  if (isLoading) {
    return (
      <div className={`aspect-video rounded-lg ${className}`}>
        <Skeleton className="w-full h-full" />
      </div>
    );
  }
  
  // Usando o processador unificado de vídeos
  try {
    // Se não for um upload direto, usamos iframe para os serviços externos
    if (isExternalService) {
      return (
        <div className={`aspect-video rounded-lg overflow-hidden ${className}`}>
          <iframe
            width="100%"
            height="100%"
            src={videoInfo.embedUrl}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      );
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('Erro ao processar vídeo:', errorMessage);
    setError(`Não foi possível processar o vídeo: ${errorMessage}`);
    return null;
  }
  
  // Player HTML5 para uploads diretos
  return (
    <div 
      ref={playerContainerRef}
      className={`aspect-video bg-black relative rounded-lg overflow-hidden ${className}`}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          if (onEnded) onEnded();
        }}
        onError={() => {
          setError("Não foi possível carregar o vídeo. O formato pode não ser suportado pelo seu navegador.");
        }}
      >
        <source src={url} type="video/mp4" />
        Seu navegador não suporta a reprodução de vídeos.
      </video>
      
      {/* Controles do player */}
      <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/0 via-black/0 to-black/60 opacity-0 hover:opacity-100 transition-opacity duration-300">
        {/* Área clicável para play/pause */}
        <div 
          className="flex-1 cursor-pointer"
          onClick={togglePlay}
        ></div>
        
        {/* Controles inferiores */}
        <div className="p-4">
          {/* Barra de progresso */}
          <div 
            className="w-full h-1.5 bg-gray-600 rounded-full cursor-pointer mb-4"
            onClick={seekTo}
          >
            <div 
              className="h-full bg-primary rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-primary rounded-full"></div>
            </div>
          </div>
          
          {/* Botões de controle */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <button 
                className="text-white focus:outline-none"
                onClick={skipBackward}
              >
                <SkipBack className="h-5 w-5" />
              </button>
              
              <button 
                className="text-white focus:outline-none"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <PauseCircle className="h-8 w-8" />
                ) : (
                  <PlayCircle className="h-8 w-8" />
                )}
              </button>
              
              <button 
                className="text-white focus:outline-none"
                onClick={skipForward}
              >
                <SkipForward className="h-5 w-5" />
              </button>
              
              <div className="text-sm text-white ml-2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                className="text-white focus:outline-none"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>
              
              <button
                className="text-white focus:outline-none"
                onClick={toggleFullscreen}
              >
                <Maximize className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmbeddedVideoPlayer;