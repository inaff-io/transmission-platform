import { useEffect, useRef } from 'react';
import Player from '@vimeo/player';

interface VimeoPlayerProps {
  videoId: string;
  watermark: string;
}

export function VimeoPlayer({ videoId, watermark }: VimeoPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playerRef.current) return;

    const player = new Player(playerRef.current, {
      id: videoId,
      width: 800,
      responsive: true,
      controls: false,
      title: false,
      byline: false,
      portrait: false,
    });

    // Adiciona marca d'água
    const watermarkElement = document.createElement('div');
    watermarkElement.className = 'absolute inset-0 flex items-center justify-center pointer-events-none select-none';
    watermarkElement.style.zIndex = '9999';
    watermarkElement.innerHTML = `
      <div class="text-white text-opacity-50 transform -rotate-45 text-xl">
        ${watermark}
      </div>
    `;
    playerRef.current.appendChild(watermarkElement);

    // Desabilita atalhos do teclado do player
    player.on('loaded', () => {
      player.disableTextTrack();
      player.setVolume(0.5);
    });

    // Monitora fullscreen para manter marca d'água
    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement) {
        document.fullscreenElement.appendChild(watermarkElement);
      } else if (playerRef.current) {
        playerRef.current.appendChild(watermarkElement);
      }
    });

    return () => {
      player.destroy();
    };
  }, [videoId, watermark]);

  return (
    <div className="relative w-full aspect-video">
      <div ref={playerRef} className="absolute inset-0" />
    </div>
  );
}
