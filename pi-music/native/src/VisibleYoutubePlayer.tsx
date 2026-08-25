import { useEffect, useRef } from "react";
import { type OnlinePlaybackState, youtubePlayerErrorMessage, youtubePlayerState } from "./onlineClient";

type PlayerController = { play: () => void; pause: () => void };
type PlayerInstance = {
  cueVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  destroy: () => void;
};

type YoutubeNamespace = {
  Player: new (target: HTMLElement, options: {
    width: string;
    height: string;
    videoId: string;
    playerVars: Record<string, string | number>;
    events: {
      onReady: (event: { target: PlayerInstance }) => void;
      onStateChange: (event: { data: number }) => void;
      onError: (event: { data: number }) => void;
      onAutoplayBlocked: () => void;
    };
  }) => PlayerInstance;
};

declare global {
  interface Window {
    YT?: YoutubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YoutubeNamespace> | null = null;

function loadYoutubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;
  youtubeApiPromise = new Promise<YoutubeNamespace>((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("The visible YouTube player did not finish loading."));
    };
    const existing = document.querySelector<HTMLScriptElement>('script[data-pi-music-youtube-api="true"]');
    if (existing) return;
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.dataset.piMusicYoutubeApi = "true";
    script.onerror = () => reject(new Error("The visible YouTube player could not load."));
    document.head.appendChild(script);
  });
  return youtubeApiPromise;
}

export function VisibleYoutubePlayer({
  videoId,
  onPlaybackState,
  onPlayerReady,
  onPlayerError,
  onControllerReady,
}: {
  videoId: string;
  onPlaybackState: (state: OnlinePlaybackState) => void;
  onPlayerReady: (ready: boolean) => void;
  onPlayerError: (message: string) => void;
  onControllerReady: (controller: PlayerController | null) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let player: PlayerInstance | null = null;
    onPlaybackState("cueing");
    void loadYoutubeApi()
      .then((YT) => {
        if (disposed || !hostRef.current) return;
        player = new YT.Player(hostRef.current, {
          width: "100%",
          height: "100%",
          videoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            enablejsapi: 1,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              if (disposed) return;
              event.target.cueVideoById(videoId);
              onPlayerReady(true);
              onPlaybackState("ready");
              onControllerReady({ play: () => event.target.playVideo(), pause: () => event.target.pauseVideo() });
            },
            onStateChange: (event) => onPlaybackState(youtubePlayerState(event.data)),
            onError: (event) => { onPlayerReady(false); onPlayerError(youtubePlayerErrorMessage(event.data)); onPlaybackState("unavailable"); },
            onAutoplayBlocked: () => onPlaybackState("blocked"),
          },
        });
      })
      .catch(() => { if (!disposed) { onPlayerError("The visible player could not open right now. Try another returned record."); onPlaybackState("unavailable"); } });
    return () => {
      disposed = true;
      onPlayerReady(false);
      onControllerReady(null);
      player?.destroy();
    };
  }, [onControllerReady, onPlaybackState, onPlayerError, onPlayerReady, videoId]);

  return <div className="youtube-iframe-stage" aria-label="Official YouTube player"><div className="youtube-iframe-host" ref={hostRef} /></div>;
}
