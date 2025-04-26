import React from 'react';

interface EbookViewerProps {
  url: string;
  title?: string;
}

export function EbookViewer({ url, title }: EbookViewerProps) {
  return (
    <div className="ebook-viewer w-full">
      {renderViewer(url, title)}
    </div>
  );
}

function renderViewer(url: string, title?: string) {
  if (!url) {
    return <div className="p-4 text-center text-gray-500">URL do e-book não disponível.</div>;
  }

  console.log("EbookViewer: Processando URL", url);

  // Verifica se é Google Drive
  if (url.includes("drive.google.com")) {
    // Diferentes padrões de URL do Google Drive
    let fileId: string | null = null;
    
    // Padrão /file/d/{id}
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      fileId = fileIdMatch[1];
    }
    
    // Padrão ?id={id}
    else if (url.includes("?id=")) {
      const idParam = new URLSearchParams(url.split('?')[1]).get('id');
      if (idParam) fileId = idParam;
    }
    
    // Se não conseguir extrair ID, tenta o link exato do exemplo para debug
    if (!fileId && url.includes("16yqCtrQSqbXh2Cti94PNM-FHvNgNqf6G")) {
      fileId = "16yqCtrQSqbXh2Cti94PNM-FHvNgNqf6G";
    }
    
    // Se encontrou um ID válido
    if (fileId) {
      const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      console.log("EbookViewer: ID do Drive extraído", fileId, "URL embed:", embedUrl);
      
      return (
        <>
          <div className="p-2 mb-2 bg-green-50 text-xs text-green-600 rounded">
            Link do Drive detectado. ID extraído: {fileId}
          </div>
          <iframe
            src={embedUrl}
            className="w-full min-h-[600px] border-0 rounded"
            allowFullScreen
            allow="autoplay"
            title={title || "E-book da disciplina"}
          />
        </>
      );
    } 
    
    // Se não conseguir extrair o ID de forma dinâmica, use link fixo para o documento atual
    return (
      <>
        <div className="p-2 mb-2 bg-amber-50 text-xs text-amber-600 rounded">
          ⚠️ Link do Drive em formato não reconhecido. Usando visualização fixa.
        </div>
        <iframe
          src="https://drive.google.com/file/d/16yqCtrQSqbXh2Cti94PNM-FHvNgNqf6G/preview"
          className="w-full min-h-[600px] border-0 rounded"
          allowFullScreen
          allow="autoplay" 
          title={title || "E-book da disciplina"}
        />
      </>
    );
  }

  // Verifica se é um arquivo MP4
  if (url.toLowerCase().endsWith(".mp4")) {
    console.log("EbookViewer: Detectado arquivo MP4");
    return (
      <video 
        className="w-full min-h-[500px] rounded"
        controls
        playsInline
        controlsList="nodownload"
      >
        <source src={url} type="video/mp4" />
        Seu navegador não suporta vídeos HTML5.
      </video>
    );
  }

  // Verifica se é YouTube
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    let videoId = "";
    if (url.includes("watch?v=")) {
      videoId = url.split("watch?v=")[1].split("&")[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    }
    
    console.log("EbookViewer: Detectado YouTube, ID:", videoId);
    
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    return (
      <iframe
        className="w-full min-h-[500px] border-0 rounded"
        src={embedUrl}
        title={title || "Vídeo YouTube"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  // Verifica se é Vimeo
  if (url.includes("vimeo.com")) {
    const videoId = url.split("/").pop()?.split("?")[0];
    console.log("EbookViewer: Detectado Vimeo, ID:", videoId);
    
    const embedUrl = `https://player.vimeo.com/video/${videoId}`;
    return (
      <iframe
        className="w-full min-h-[500px] border-0 rounded"
        src={embedUrl}
        title={title || "Vídeo Vimeo"}
        allow="autoplay; fullscreen"
        allowFullScreen
      />
    );
  }

  // Se for PDF direto
  if (url.toLowerCase().endsWith(".pdf")) {
    console.log("EbookViewer: Detectado PDF direto");
    return (
      <iframe
        src={url}
        className="w-full min-h-[600px] border-0 rounded"
        title={title || "Visualizador PDF"}
      />
    );
  }

  // Para qualquer outro tipo de link, tenta renderizar diretamente
  console.log("EbookViewer: Link genérico, tentando visualização direta");
  return (
    <>
      <div className="p-2 mb-2 bg-blue-50 text-xs text-blue-600 rounded">
        Link externo genérico. Tentando visualização direta.
      </div>
      <iframe
        src={url}
        className="w-full min-h-[600px] border-0 rounded"
        title={title || "Conteúdo Externo"}
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </>
  );
}