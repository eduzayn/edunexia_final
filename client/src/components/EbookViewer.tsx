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

  // Verifica se é Google Drive
  if (url.includes("drive.google.com")) {
    const fileIdMatch = url.match(/\/d\/(.*?)(\/|$|\?)/);
    const fileId = fileIdMatch ? fileIdMatch[1] : null;
    if (fileId) {
      const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      return (
        <>
          <div className="p-2 mb-2 bg-green-50 text-xs text-green-600 rounded">
            Link do Drive detectado. ID extraído: {fileId}
          </div>
          <iframe
            src={embedUrl}
            width="100%"
            height="600px"
            allow="autoplay"
            style={{ border: 'none' }}
            title={title || "Ebook Drive"}
          />
        </>
      );
    }
  }

  // Verifica se é um arquivo MP4
  if (url.toLowerCase().endsWith(".mp4")) {
    return (
      <video width="100%" height="500px" controls>
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
      videoId = url.split("youtu.be/")[1];
    }
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    return (
      <iframe
        width="100%"
        height="500px"
        src={embedUrl}
        title={title || "Vídeo YouTube"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ border: 'none' }}
      />
    );
  }

  // Verifica se é Vimeo
  if (url.includes("vimeo.com")) {
    const videoId = url.split("/").pop();
    const embedUrl = `https://player.vimeo.com/video/${videoId}`;
    return (
      <iframe
        width="100%"
        height="500px"
        src={embedUrl}
        title={title || "Vídeo Vimeo"}
        allow="autoplay; fullscreen"
        allowFullScreen
        style={{ border: 'none' }}
      />
    );
  }

  // Se for PDF direto
  if (url.toLowerCase().endsWith(".pdf")) {
    return (
      <iframe
        src={url}
        width="100%"
        height="600px"
        style={{ border: 'none' }}
        title={title || "Visualizador PDF"}
      />
    );
  }

  // Para qualquer outro tipo de link, tenta renderizar diretamente
  return (
    <>
      <div className="p-2 mb-2 bg-blue-50 text-xs text-blue-600 rounded">
        Link externo genérico. Tentando visualização direta.
      </div>
      <iframe
        src={url}
        width="100%"
        height="600px"
        style={{ border: 'none' }}
        title={title || "Conteúdo Externo"}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </>
  );
}