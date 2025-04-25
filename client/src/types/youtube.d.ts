// Declaração de tipo global para a API de iframe do YouTube
interface Window {
  YT?: {
    Player: new (
      elementId: string,
      options: {
        videoId: string;
        playerVars?: {
          autoplay?: 0 | 1;
          controls?: 0 | 1;
          rel?: 0 | 1;
          showinfo?: 0 | 1;
          modestbranding?: 0 | 1;
          fs?: 0 | 1;
          playsinline?: 0 | 1;
          origin?: string;
        };
        events?: {
          onReady?: (event: any) => void;
          onStateChange?: (event: any) => void;
          onError?: (event: any) => void;
        };
      }
    ) => any;
    PlayerState?: {
      UNSTARTED: number;
      ENDED: number;
      PLAYING: number;
      PAUSED: number;
      BUFFERING: number;
      CUED: number;
    };
  };
  onYouTubeIframeAPIReady?: () => void;
}