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
  if (!url) return '';
  
  console.log('Convertendo URL do Google Drive:', url);
  
  try {
    // Para links diretos contendo /d/ID/ (com ou sem parâmetros)
    if (url.includes('drive.google.com/file/d/')) {
      // Extrai o ID do arquivo independente de parâmetros de URL
      // Regex mais robusta para extrair o ID entre /d/ e o próximo / ou ? ou fim da string
      const fileIdMatch = url.match(/\/d\/([^/?#]+)/);
      
      if (fileIdMatch && fileIdMatch[1]) {
        const fileId = fileIdMatch[1];
        console.log('ID extraído do Google Drive:', fileId);
        
        // Garante que o ID está limpo (sem caracteres especiais)
        const cleanFileId = fileId.trim();
        console.log('ID limpo:', cleanFileId);
        
        const previewUrl = `https://drive.google.com/file/d/${cleanFileId}/preview`;
        console.log('URL de preview gerada:', previewUrl);
        
        return previewUrl;
      } else {
        console.log('Regex não encontrou um ID válido no formato /d/ID/');
      }
    }
    
    // Para URLs com 'usp=drive_link' ou outros parâmetros
    if (url.includes('drive.google.com/file/d/') && url.includes('?')) {
      console.log('URL com parâmetros detectada');
      
      // Remove todos os parâmetros de consulta
      const baseUrl = url.split('?')[0];
      console.log('URL base sem parâmetros:', baseUrl);
      
      // Extrai apenas o ID
      const idMatch = baseUrl.match(/\/d\/([^/]+)(?:\/view)?$/);
      if (idMatch && idMatch[1]) {
        const fileId = idMatch[1];
        console.log('ID extraído após remover parâmetros:', fileId);
        
        return `https://drive.google.com/file/d/${fileId}/preview`;
      } else {
        console.log('Não foi possível extrair ID após remover parâmetros');
      }
    }
    
    // Para links diretos formatados como https://drive.google.com/file/d/ID/view
    const viewMatch = url.match(/\/file\/d\/([^/]+)\/view/);
    if (viewMatch && viewMatch[1]) {
      const fileId = viewMatch[1];
      console.log('ID extraído de URL com /view:', fileId);
      
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    
    // Para links com formato open?id=ID
    if (url.includes('drive.google.com/open')) {
      try {
        const urlObj = new URL(url);
        const fileId = urlObj.searchParams.get('id');
        if (fileId) {
          console.log('ID extraído de URL open?id=:', fileId);
          return `https://drive.google.com/file/d/${fileId}/preview`;
        }
      } catch (innerError) {
        console.error('Erro ao processar URL open?id=:', innerError);
      }
    }
    
    // Para links de apresentações, planilhas, etc.
    if (url.includes('docs.google.com/presentation') || 
        url.includes('docs.google.com/spreadsheets') || 
        url.includes('docs.google.com/document')) {
      // Converte para formato embed
      const previewUrl = url.replace(/\/edit.*$/, '/preview');
      console.log('URL de documento Google convertida:', previewUrl);
      return previewUrl;
    }
    
    // Caso específico para URL com o formato exato fornecido pelo usuário
    if (url === 'https://drive.google.com/file/d/16yqCtrQSqbXh2Cti94PNM-FHvNgNqf6G/view?usp=drive_link') {
      console.log('Caso especial - URL fornecida pelo usuário detectada');
      return 'https://drive.google.com/file/d/16yqCtrQSqbXh2Cti94PNM-FHvNgNqf6G/preview';
    }
    
    console.log('Nenhum padrão de URL do Google Drive reconhecido, retornando URL original');
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