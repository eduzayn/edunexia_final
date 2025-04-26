/**
 * Utilitário para detectar e converter URLs para formatos incorporáveis
 * Suporta diversos serviços como Google Drive, YouTube, Vimeo, links diretos, etc.
 */

/**
 * Tipos possíveis de URLs
 */
export type UrlType = 
  | 'google-drive' 
  | 'youtube' 
  | 'vimeo' 
  | 'pdf' 
  | 'video' 
  | 'dropbox'
  | 'onedrive'
  | 'unknown';

/**
 * Detecta o tipo de URL baseado no seu conteúdo
 */
export function detectUrlType(url: string): UrlType {
  if (!url) return 'unknown';
  
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('drive.google.com')) return 'google-drive';
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
  if (lowerUrl.includes('vimeo.com')) return 'vimeo';
  if (lowerUrl.includes('dropbox.com')) return 'dropbox';
  if (lowerUrl.includes('onedrive.live.com') || lowerUrl.includes('1drv.ms')) return 'onedrive';
  if (lowerUrl.endsWith('.pdf')) return 'pdf';
  if (lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.webm') || lowerUrl.endsWith('.ogg')) return 'video';
  
  return 'unknown';
}

/**
 * Converte uma URL do Google Drive para formato incorporável
 */
export function convertGoogleDriveUrl(url: string): string {
  try {
    // Para links diretos contendo /d/ID/
    if (url.includes('drive.google.com/file/d/')) {
      // Extrai o ID do arquivo (funcionará com ou sem parâmetros de consulta)
      const fileIdMatch = url.match(/\/d\/([^/?]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
      }
    }
    
    // Para links com formato open?id=ID
    if (url.includes('drive.google.com/open')) {
      const urlObj = new URL(url);
      const fileId = urlObj.searchParams.get('id');
      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
    
    // Para links de apresentações, planilhas, etc.
    if (url.includes('docs.google.com/presentation') || 
        url.includes('docs.google.com/spreadsheets') || 
        url.includes('docs.google.com/document')) {
      // Converte para formato embed
      return url.replace(/\/edit.*$/, '/preview');
    }
  } catch (e) {
    console.error('Erro ao converter URL do Google Drive:', e);
  }
  
  // Retorna a URL original em caso de falha
  return url;
}

/**
 * Converte uma URL do YouTube para formato incorporável
 */
export function convertYouTubeUrl(url: string): string {
  try {
    // Extrai o ID do vídeo do YouTube
    let videoId = '';
    
    if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      videoId = urlObj.searchParams.get('v') || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    }
    
    if (videoId) {
      // Retorna URL incorporável
      return `https://www.youtube.com/embed/${videoId}`;
    }
  } catch (e) {
    console.error('Erro ao converter URL do YouTube:', e);
  }
  
  // Retorna a URL original em caso de falha
  return url;
}

/**
 * Converte uma URL do Vimeo para formato incorporável
 */
export function convertVimeoUrl(url: string): string {
  try {
    // Extrai o ID do vídeo do Vimeo
    const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|)(\d+)(?:|\/\?)/;
    const match = url.match(vimeoRegex);
    
    if (match && match[1]) {
      // Retorna URL incorporável
      return `https://player.vimeo.com/video/${match[1]}`;
    }
  } catch (e) {
    console.error('Erro ao converter URL do Vimeo:', e);
  }
  
  // Retorna a URL original em caso de falha
  return url;
}

/**
 * Converte uma URL do Dropbox para formato incorporável ou visualizável diretamente
 */
export function convertDropboxUrl(url: string): string {
  try {
    // Converte links compartilhados do Dropbox para links diretos
    return url.replace('www.dropbox.com/s/', 'dl.dropboxusercontent.com/s/')
              .replace('?dl=0', '')
              .replace('?dl=1', '');
  } catch (e) {
    console.error('Erro ao converter URL do Dropbox:', e);
    return url;
  }
}

/**
 * Converte uma URL do OneDrive para formato incorporável
 */
export function convertOneDriveUrl(url: string): string {
  try {
    // Links do OneDrive geralmente requerem conversão para o formato embed.aspx
    if (url.includes('1drv.ms') || url.includes('onedrive.live.com')) {
      // Como os links do OneDrive são complexos, tentamos a abordagem mais simples
      // Isso não cobrirá todos os casos, mas funcionará para muitos links de compartilhamento
      return url.replace('view.aspx', 'embed.aspx');
    }
  } catch (e) {
    console.error('Erro ao converter URL do OneDrive:', e);
  }
  
  // Retorna a URL original em caso de falha
  return url;
}

/**
 * Converte uma URL de PDF direto para visualização incorporada
 */
export function convertPdfUrl(url: string): string {
  try {
    // Usamos o visualizador do Google para PDFs externos
    return `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(url)}`;
  } catch (e) {
    console.error('Erro ao converter URL de PDF:', e);
    return url;
  }
}

/**
 * Função principal que detecta e converte qualquer URL para um formato incorporável
 */
export function getEmbedUrl(url: string): string {
  if (!url) return '';
  
  try {
    console.log('Preparando URL para embed:', url);
    
    const urlType = detectUrlType(url);
    console.log('Tipo de URL detectado:', urlType);
    
    switch (urlType) {
      case 'google-drive':
        return convertGoogleDriveUrl(url);
      case 'youtube':
        return convertYouTubeUrl(url);
      case 'vimeo':
        return convertVimeoUrl(url);
      case 'pdf':
        return convertPdfUrl(url);
      case 'dropbox':
        return convertDropboxUrl(url);
      case 'onedrive':
        return convertOneDriveUrl(url);
      case 'video':
        // Links diretos de vídeo podem ser usados diretamente
        return url;
      default:
        // Para outros tipos de URL, retornamos a URL original
        return url;
    }
  } catch (error) {
    console.error('Erro ao converter URL:', error);
    return url;
  }
}

/**
 * Cria um componente HTML para incorporar o conteúdo com base no tipo de URL
 * Retorna uma string com o código HTML do elemento apropriado para o tipo de conteúdo
 */
export function createEmbedHtml(url: string, title: string = ''): string {
  if (!url) return '';
  
  const embedUrl = getEmbedUrl(url);
  const urlType = detectUrlType(url);
  
  try {
    switch (urlType) {
      case 'video':
        return `<video controls width="100%" height="auto" preload="metadata">
                  <source src="${embedUrl}" type="video/mp4">
                  Seu navegador não suporta o player de vídeo.
                </video>`;
      
      case 'youtube':
      case 'vimeo':
      case 'google-drive':
      case 'pdf':
      case 'dropbox':
      case 'onedrive':
      default:
        return `<iframe src="${embedUrl}" 
                        frameborder="0" 
                        width="100%" 
                        height="600px" 
                        allowfullscreen
                        title="${title || 'Conteúdo incorporado'}">
                </iframe>`;
    }
  } catch (error) {
    console.error('Erro ao criar HTML de incorporação:', error);
    return `<div class="error-message">
              Erro ao carregar conteúdo. <a href="${url}" target="_blank">Abrir em nova aba</a>
            </div>`;
  }
}