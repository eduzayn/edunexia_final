import React from 'react';

interface VideoPlayerProps {
  url: string;
  title: string;
  width?: string | number;
  height?: string | number;
}

export function VideoPlayer({ url, title, width = "100%", height = "100%" }: VideoPlayerProps) {
  // Verificar se a URL é do YouTube e formatá-la corretamente
  const formatYouTubeUrl = (url: string): string => {
    if (url.includes('youtube.com/watch')) {
      // Converter URL do formato watch?v=ID para embed/ID
      const videoId = new URL(url).searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      // Converter URL curta do YouTube para formato embed
      const videoId = url.split('youtu.be/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    // Se já for uma URL de incorporação ou outro tipo, retornar como está
    return url;
  };

  // Verificar se a URL é do Vimeo e formatá-la corretamente
  const formatVimeoUrl = (url: string): string => {
    if (url.includes('vimeo.com/') && !url.includes('player.vimeo.com')) {
      // Extrair o ID do vídeo
      const matches = url.match(/vimeo\.com\/(\d+)/);
      if (matches && matches[1]) {
        return `https://player.vimeo.com/video/${matches[1]}`;
      }
    }
    return url;
  };

  // Formatação final da URL
  const getFormattedUrl = (url: string): string => {
    let formattedUrl = url;
    
    if (url.includes('youtube')) {
      formattedUrl = formatYouTubeUrl(url);
    } else if (url.includes('vimeo')) {
      formattedUrl = formatVimeoUrl(url);
    }
    
    // Adicionar parâmetros para melhor experiência do usuário
    const urlObj = new URL(formattedUrl);
    
    // Para YouTube
    if (formattedUrl.includes('youtube.com/embed')) {
      urlObj.searchParams.set('rel', '0'); // Não mostrar vídeos relacionados
      urlObj.searchParams.set('modestbranding', '1'); // Branding discreto
    }
    
    return urlObj.toString();
  };

  const formattedUrl = getFormattedUrl(url);

  return (
    <div className="w-full h-full">
      <iframe
        src={formattedUrl}
        title={title}
        width={width}
        height={height}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full rounded"
      />
    </div>
  );
}

export default VideoPlayer;