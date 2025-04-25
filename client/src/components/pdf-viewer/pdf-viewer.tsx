import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';

interface PdfViewerProps {
  pdfUrl: string;
  title?: string;
  className?: string;
  height?: string | number;
}

/**
 * Componente para visualizar PDFs integrado à plataforma
 */
export function PdfViewer({ pdfUrl, title, className, height = 800 }: PdfViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para validar a URL do PDF
  const validatePdfUrl = (url: string): string => {
    // Se já for uma URL completa (http/https), retorna como está
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Se for um caminho local (começando com '/'), adiciona a URL base
    if (url.startsWith('/')) {
      // Obtém a URL base do ambiente atual
      const baseUrl = window.location.origin;
      return `${baseUrl}${url}`;
    }
    
    // Para qualquer outro caso, assume que é um caminho relativo
    return url;
  };

  const fullPdfUrl = validatePdfUrl(pdfUrl);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('Não foi possível carregar o PDF. Verifique se o arquivo existe e é acessível.');
  };

  return (
    <div className={`pdf-viewer-container w-full ${className || ''}`} data-testid="pdf-viewer">
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      
      <div className="relative" style={{ height: typeof height === 'number' ? `${height}px` : height }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 p-4">
            <p className="text-red-500 mb-4">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => window.open(fullPdfUrl, '_blank')}
            >
              Abrir em nova aba
            </Button>
          </div>
        ) : (
          <iframe
            src={`${fullPdfUrl}#toolbar=0&view=FitH`}
            className="w-full h-full border border-gray-200 rounded-md"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={title || "PDF Viewer"}
            data-testid="pdf-iframe"
          />
        )}
      </div>
    </div>
  );
}

export default PdfViewer;