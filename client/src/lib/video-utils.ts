/**
 * Utilitário centralizado para processamento de vídeos
 * Este arquivo contém funções para detectar a origem do vídeo,
 * extrair IDs e gerar URLs de embed para diversos serviços.
 */

export type VideoSource = "youtube" | "vimeo" | "onedrive" | "google_drive" | "upload";

interface VideoInfo {
  source: VideoSource;
  id: string | null;
  embedUrl: string;
  originalUrl: string;
}

/**
 * Detecta automaticamente o tipo de fonte de vídeo baseado na URL
 */
export function detectVideoSource(url: string): VideoSource {
  if (!url) return "youtube"; // Default
  
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
  
  return "youtube"; // Default fallback
}

/**
 * Extrai o ID do vídeo do YouTube de uma URL
 * Suporta vários formatos de URL do YouTube
 */
export function extractYouTubeVideoId(url: string): string | null {
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
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com')) {
        const videoId = urlObj.searchParams.get('v');
        if (videoId && videoId.length === 11) return videoId;
      }
    } catch (e) {
      console.warn('Falha ao analisar a URL do YouTube com URL()');
    }
    
    // Fallback para o método regex
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
 * Suporta vários formatos de URL do Vimeo
 */
export function extractVimeoVideoId(url: string): string | null {
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
 * Converte tempo no formato mm:ss para segundos
 */
export function timeToSeconds(time?: string): number | null {
  if (!time) return null;
  
  const parts = time.split(':');
  if (parts.length !== 2) return null;
  
  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  
  if (isNaN(minutes) || isNaN(seconds)) return null;
  
  return minutes * 60 + seconds;
}

/**
 * Modifica URL do Google Drive para visualização
 */
export function getGoogleDriveEmbedUrl(url: string): string {
  try {
    // Formato: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    if (url.includes('/file/d/')) {
      const fileIdMatch = url.match(/\/file\/d\/([^/]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        const fileId = fileIdMatch[1];
        return `https://drive.google.com/file/d/${fileId}/preview`;
      } else {
        // Se não conseguir extrair o ID, usa o fallback
        return url.replace('/view', '/preview');
      }
    } 
    // Formato: https://docs.google.com/document/d/DOC_ID/edit
    else if (url.includes('docs.google.com')) {
      return url.replace('/edit', '/preview');
    }
    
    return url;
  } catch (error) {
    console.error('Erro ao processar URL do Google Drive:', error);
    return url;
  }
}

/**
 * Modifica URL do OneDrive para visualização
 */
export function getOneDriveEmbedUrl(url: string): string {
  try {
    // Verifica se a URL já está no formato de embed/preview
    if (!url.includes('embed')) {
      // Tenta extrair o ID do compartilhamento
      const shareMatch = url.match(/(?:resid=|1drv\.ms\/.)([^&/]+)/i);
      if (shareMatch && shareMatch[1]) {
        const shareId = shareMatch[1];
        // Cria URL de visualização
        return `https://onedrive.live.com/embed?cid=${shareId}&resid=${shareId}`;
      } else if (url.includes('view.officeapps.live.com')) {
        // URL já é de visualização, usa como está
        return url;
      } else {
        // Para outros formatos, tenta usar um formato de incorporação genérico
        return url.replace('?', '&').replace('1drv.ms/', 'onedrive.live.com/embed?');
      }
    }
    
    return url;
  } catch (error) {
    console.error('Erro ao processar URL do OneDrive:', error);
    return url;
  }
}

/**
 * Função principal para processar uma URL de vídeo
 * Detecta automaticamente o tipo, extrai o ID e gera URL de embed
 */
export function processVideoUrl(url: string, source?: VideoSource, startTime?: string): VideoInfo {
  // Se não for fornecida, detectar a fonte automaticamente
  const detectedSource = source || detectVideoSource(url);
  
  let videoId: string | null = null;
  let embedUrl: string = url;
  
  switch (detectedSource) {
    case 'youtube':
      videoId = extractYouTubeVideoId(url);
      if (videoId) {
        const startSeconds = timeToSeconds(startTime);
        const startParam = startSeconds ? `&start=${startSeconds}` : '';
        embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0${startParam}`;
      }
      break;
      
    case 'vimeo':
      videoId = extractVimeoVideoId(url);
      if (videoId) {
        embedUrl = `https://player.vimeo.com/video/${videoId}`;
      }
      break;
      
    case 'google_drive':
      embedUrl = getGoogleDriveEmbedUrl(url);
      break;
      
    case 'onedrive':
      embedUrl = getOneDriveEmbedUrl(url);
      break;
  }
  
  return {
    source: detectedSource,
    id: videoId,
    embedUrl,
    originalUrl: url
  };
}