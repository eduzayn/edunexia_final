import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, X } from 'lucide-react';

interface EbookViewerProps {
  url: string;
  title: string;
  type?: 'pdf' | 'interactive' | 'external';
  description?: string;
}

export function EbookViewer({ url, title, type = 'pdf', description }: EbookViewerProps) {
  const [open, setOpen] = useState(false);

  const renderContent = () => {
    if (type === 'pdf') {
      return (
        <div className="w-full h-full min-h-[500px] relative">
          <iframe 
            src={`${url}#toolbar=0&navpanes=0`} 
            className="w-full h-full rounded border"
            title={title}
          />
        </div>
      );
    } else if (type === 'interactive') {
      return (
        <div className="w-full h-full min-h-[500px] relative">
          <iframe 
            src={url} 
            className="w-full h-full rounded border"
            title={title}
            sandbox="allow-same-origin allow-scripts allow-forms"
          />
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <FileText className="h-16 w-16 text-primary" />
          <div className="text-center">
            <h3 className="text-lg font-medium">{title}</h3>
            {description && <p className="text-sm text-muted-foreground mt-2">{description}</p>}
          </div>
          <Button
            onClick={() => window.open(url, '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir em nova aba
          </Button>
        </div>
      );
    }
  };
  
  return (
    <>
      <div 
        className="flex flex-col items-center justify-center cursor-pointer p-4 border rounded-md hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(true)}
      >
        <FileText className="h-12 w-12 mb-2 text-primary" />
        <div className="text-center">
          <h3 className="font-medium">{title}</h3>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col">
          <DialogHeader className="flex-none">
            <div className="flex justify-between items-center">
              <DialogTitle>{title}</DialogTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div className="flex-grow overflow-auto mt-4">
            {renderContent()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default EbookViewer;