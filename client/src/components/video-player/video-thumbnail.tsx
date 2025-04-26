import React, { useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { VideoSource, getVideoThumbnailUrl } from "@/lib/video-utils";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoThumbnailProps {
  url: string;
  title: string;
  source?: VideoSource;
  onClick?: () => void;
  className?: string;
}

const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  url,
  title,
  source = 'youtube',
  onClick,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Obtém a URL da miniatura
  const thumbnailUrl = getVideoThumbnailUrl(url, source);
  
  // Trata o evento de carregamento da imagem
  const handleImageLoad = () => {
    setIsLoading(false);
  };
  
  // Trata erros no carregamento da imagem
  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };
  
  return (
    <div 
      className={`relative aspect-video bg-gray-200 cursor-pointer overflow-hidden rounded-sm ${className}`}
      onClick={onClick}
      title={`Reproduzir: ${title}`}
    >
      {/* Exibe a miniatura se disponível, ou um fallback para outras fontes */}
      {thumbnailUrl ? (
        <>
          {isLoading && <Skeleton className="absolute inset-0" />}
          <img
            src={thumbnailUrl}
            alt={title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </>
      ) : (
        <div className="flex items-center justify-center h-full bg-gray-100">
          {source === 'youtube' && <span className="text-red-500 font-bold text-2xl">YouTube</span>}
          {source === 'vimeo' && <span className="text-blue-500 font-bold text-2xl">Vimeo</span>}
          {source === 'google_drive' && <span className="text-green-500 font-bold text-2xl">Drive</span>}
          {source === 'onedrive' && <span className="text-blue-500 font-bold text-2xl">OneDrive</span>}
          {source === 'upload' && <span className="text-purple-500 font-bold text-2xl">Vídeo</span>}
        </div>
      )}
      
      {/* Overlay com ícone de play */}
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 hover:bg-opacity-30 transition-all">
        <PlayCircle className="h-16 w-16 text-white opacity-90" />
      </div>
    </div>
  );
};

export default VideoThumbnail;