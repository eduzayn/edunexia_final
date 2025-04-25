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

interface EmbeddedVideoPlayerProps {
  url: string;
  title: string;
  source?: 'youtube' | 'vimeo' | 'onedrive' | 'google_drive' | 'upload';
  poster?: string;
  startTime?: string; // Tempo de início no formato mm:ss
  onEnded?: () => void;
  className?: string;
}

/**
 * Extrai o ID do vídeo do YouTube de uma URL
 * Suporta vários formatos de URL do YouTube:
 * - youtu.be/VIDEO_ID
 * - youtube.com/watch?v=VIDEO_ID
 * - youtube.com/embed/VIDEO_ID
 * - youtube.com/v/VIDEO_ID
 */
function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  try {
    // Formato curto: youtu.be/VIDEO_ID
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split(/[?&]/)[0];
      if (id && id.length === 11) return id;
    }
    
    // Formato de embed: youtube.com/embed/VIDEO_ID
    if (url.includes('/embed/')) {
      const id = url.split('/embed/')[1]?.split(/[?&]/)[0];
      if (id && id.length === 11) return id;
    }
    
    // Formato padrão: youtube.com/watch?v=VIDEO_ID
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('youtube.com')) {
      const videoId = urlObj.searchParams.get('v');
      if (videoId && videoId.length === 11) return videoId;
    }
    
    // Fallback para o método regex original
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7] && match[7].length === 11) ? match[7] : null;
  } catch (error) {
    console.error('Erro ao extrair ID do YouTube:', error);
    return null;
  }
}

/**
 * Extrai o ID do vídeo do Vimeo de uma URL
 * Suporta vários formatos de URL do Vimeo:
 * - vimeo.com/VIDEO_ID
 * - vimeo.com/video/VIDEO_ID
 * - player.vimeo.com/video/VIDEO_ID
 * - URLs com parâmetros como quality_selector e outros
 */
function extractVimeoVideoId(url: string): string | null {
  if (!url) return null;
  
  try {
    console.log('Tentando extrair ID do Vimeo da URL:', url);
    
    // Método 1: Formato padrão - vimeo.com/VIDEO_ID
    if (url.includes('vimeo.com/') && !url.includes('/video/')) {
      const id = url.split('vimeo.com/')[1]?.split(/[?&/#]/)[0];
      if (id && /^\d+$/.test(id)) {
        console.log('ID do Vimeo extraído (formato padrão):', id);
        return id;
      }
    }
    
    // Método 2: Formato player - player.vimeo.com/video/VIDEO_ID
    if (url.includes('/video/')) {
      const id = url.split('/video/')[1]?.split(/[?&/#]/)[0];
      if (id && /^\d+$/.test(id)) {
        console.log('ID do Vimeo extraído (formato player):', id);
        return id;
      }
    }
    
    // Método 3: Formato URL complexa com quality_selector
    const complexMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
    if (complexMatch && complexMatch[1]) {
      console.log('ID do Vimeo extraído (regex complexa):', complexMatch[1]);
      return complexMatch[1];
    }
    
    // Método 4: Extração de parâmetros de URL para formatos com player_id, app_id, etc.
    try {
      // Tenta extrair números puros da URL, útil quando temos URLs complexas
      const allNumbers = url.match(/\d+/g);
      if (allNumbers && allNumbers.length > 0) {
        // Filtra números que são potencialmente IDs do Vimeo (mais de 6 dígitos normalmente)
        const potentialIds = allNumbers.filter(num => num.length >= 6 && num.length <= 10);
        if (potentialIds.length > 0) {
          console.log('ID do Vimeo extraído (números puros):', potentialIds[0]);
          return potentialIds[0];
        }
      }
    } catch (e) {
      console.warn('Falha ao tentar extrair números da URL do Vimeo');
    }
    
    console.warn('Não foi possível extrair o ID do Vimeo da URL:', url);
    return null;
  } catch (error) {
    console.error('Erro ao extrair ID do Vimeo:', error);
    return null;
  }
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

/**
 * Converte tempo no formato mm:ss para segundos
 */
function timeToSeconds(time?: string): number | null {
  if (!time) return null;
  
  const parts = time.split(':');
  if (parts.length !== 2) return null;
  
  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  
  if (isNaN(minutes) || isNaN(seconds)) return null;
  
  return minutes * 60 + seconds;
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
  
  // Determinar se é um vídeo de serviço externo (YouTube, Vimeo, etc)
  const isExternalService = ['youtube', 'vimeo', 'onedrive', 'google_drive'].includes(source);
  
  // Extrair IDs de vídeo para serviços compatíveis
  const youtubeVideoId = source === 'youtube' ? extractYouTubeVideoId(url) : null;
  const vimeoVideoId = source === 'vimeo' ? extractVimeoVideoId(url) : null;
  
  // Carregar o iframe API do YouTube se necessário
  useEffect(() => {
    if (source === 'youtube' && youtubeVideoId) {
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
  }, [source, youtubeVideoId]);
  
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
  
  // YouTube embed
  if (source === 'youtube') {
    // Tenta extrair o ID do vídeo se ainda não extraímos
    const extractedId = youtubeVideoId || extractYouTubeVideoId(url);
    
    // Converter o tempo de início (mm:ss) para segundos, se fornecido
    const startSeconds = timeToSeconds(startTime);
    // Construir a URL com o parâmetro de início, se aplicável
    const startParam = startSeconds ? `&start=${startSeconds}` : '';
    
    if (extractedId) {
      return (
        <div className={`aspect-video rounded-lg overflow-hidden ${className}`}>
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${extractedId}?enablejsapi=1&rel=0${startParam}`}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      );
    } else {
      // Se não conseguiu extrair o ID, tenta mostrar a URL completa como fallback
      return (
        <div className={`aspect-video rounded-lg overflow-hidden ${className}`}>
          <iframe
            width="100%"
            height="100%"
            src={url}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      );
    }
  }
  
  // Vimeo embed
  if (source === 'vimeo') {
    // Tenta extrair o ID do vídeo se ainda não extraímos
    const extractedId = vimeoVideoId || extractVimeoVideoId(url);
    
    if (extractedId) {
      return (
        <div className={`aspect-video rounded-lg overflow-hidden ${className}`}>
          <iframe
            width="100%"
            height="100%"
            src={`https://player.vimeo.com/video/${extractedId}`}
            title={title}
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      );
    } else {
      // Se não conseguiu extrair o ID, tenta mostrar a URL completa como fallback
      return (
        <div className={`aspect-video rounded-lg overflow-hidden ${className}`}>
          <iframe
            width="100%"
            height="100%"
            src={url}
            title={title}
            frameBorder="0"
            allow="autoplay; fullscreen"
            allowFullScreen
          ></iframe>
        </div>
      );
    }
  }
  
  // Google Drive (URLs precisam ser modificadas para visualização)
  if (source === 'google_drive') {
    try {
      let modifiedUrl = url;
      
      // Detecta padrões comuns de URLs do Google Drive
      // Formato: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
      if (url.includes('/file/d/')) {
        const fileIdMatch = url.match(/\/file\/d\/([^/]+)/);
        if (fileIdMatch && fileIdMatch[1]) {
          const fileId = fileIdMatch[1];
          modifiedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
        } else {
          // Se não conseguir extrair o ID, usa o fallback
          modifiedUrl = url.replace('/view', '/preview');
        }
      } 
      // Formato: https://docs.google.com/document/d/DOC_ID/edit
      else if (url.includes('docs.google.com')) {
        modifiedUrl = url.replace('/edit', '/preview');
      }
      
      console.log('Google Drive URL modificada:', modifiedUrl);
      
      return (
        <div className={`aspect-video rounded-lg overflow-hidden ${className}`}>
          <iframe
            width="100%"
            height="100%"
            src={modifiedUrl}
            title={title}
            frameBorder="0"
            allow="autoplay; fullscreen"
            allowFullScreen
          ></iframe>
        </div>
      );
    } catch (error) {
      console.error('Erro ao processar URL do Google Drive:', error);
      setError(`Não foi possível processar a URL do Google Drive: ${error.message}`);
      return null;
    }
  }
  
  // OneDrive (URLs precisam ser modificadas para visualização)
  if (source === 'onedrive') {
    try {
      let modifiedUrl = url;
      
      // Verifica se a URL já está no formato de embed/preview
      if (!url.includes('embed')) {
        // Tenta extrair o ID do compartilhamento
        const shareMatch = url.match(/(?:resid=|1drv\.ms\/.)([^&/]+)/i);
        if (shareMatch && shareMatch[1]) {
          const shareId = shareMatch[1];
          // Cria URL de visualização
          modifiedUrl = `https://onedrive.live.com/embed?cid=${shareId}&resid=${shareId}`;
        } else if (url.includes('view.officeapps.live.com')) {
          // URL já é de visualização, usa como está
          modifiedUrl = url;
        } else {
          // Para outros formatos, tenta usar um formato de incorporação genérico
          modifiedUrl = url.replace('?', '&').replace('1drv.ms/', 'onedrive.live.com/embed?');
        }
      }
      
      console.log('OneDrive URL modificada:', modifiedUrl);
      
      return (
        <div className={`aspect-video rounded-lg overflow-hidden ${className}`}>
          <iframe
            width="100%"
            height="100%"
            src={modifiedUrl}
            title={title}
            frameBorder="0"
            allow="autoplay; fullscreen"
            allowFullScreen
          ></iframe>
        </div>
      );
    } catch (error) {
      console.error('Erro ao processar URL do OneDrive:', error);
      setError(`Não foi possível processar a URL do OneDrive: ${error.message}`);
      return null;
    }
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