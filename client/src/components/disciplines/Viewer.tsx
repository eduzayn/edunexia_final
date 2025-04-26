import React from "react";

interface ViewerProps {
  url: string;
}

export function Viewer({ url }: ViewerProps) {
  if (!url) {
    return <div className="text-center text-muted-foreground">Nenhum conteúdo disponível.</div>;
  }

  // Google Drive PDF
  if (url.includes("drive.google.com")) {
    const fileIdMatch = url.match(/\/d\/(.*?)\//);
    const fileId = fileIdMatch ? fileIdMatch[1] : null;
    if (fileId) {
      const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      return (
        <iframe src={embedUrl} width="100%" height="600px" allow="autoplay" title="Google Drive PDF" />
      );
    }
  }

  // YouTube
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    let videoId = "";
    if (url.includes("watch?v=")) {
      videoId = url.split("watch?v=")[1].split("&")[0];
    } else {
      videoId = url.split("/").pop() || "";
    }
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    return (
      <iframe src={embedUrl} width="100%" height="500px" allow="autoplay" title="YouTube Video" allowFullScreen />
    );
  }

  // Vimeo
  if (url.includes("vimeo.com")) {
    const videoId = url.split("/").pop();
    const embedUrl = `https://player.vimeo.com/video/${videoId}`;
    return (
      <iframe src={embedUrl} width="100%" height="500px" allow="autoplay; fullscreen" title="Vimeo Video" allowFullScreen />
    );
  }

  // Vídeo MP4
  if (url.endsWith(".mp4")) {
    return (
      <video width="100%" height="500px" controls>
        <source src={url} type="video/mp4" />
        Seu navegador não suporta vídeos HTML5.
      </video>
    );
  }

  // PDF Direto
  if (url.endsWith(".pdf")) {
    return (
      <iframe src={url} width="100%" height="600px" title="PDF Viewer" />
    );
  }

  // Default (não reconhecido)
  return <div className="text-center text-muted-foreground">Formato de link não suportado para pré-visualização.</div>;
}