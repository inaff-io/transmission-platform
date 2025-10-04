'use client';

import { useEffect, useRef } from 'react';

interface VimeoPlayerProps {
  videoId: string;
  className?: string;
}

export function VimeoPlayer({ videoId, className = '' }: VimeoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Importa dinamicamente o player do Vimeo
    const loadVimeoPlayer = async () => {
      try {
        const { default: Player } = await import('@vimeo/player');
        
        // Limpa o player anterior se existir
        if (playerRef.current) {
          playerRef.current.destroy();
        }

        // Cria o novo player
        const el = containerRef.current;
        if (!el) return;
        const player = new Player(el as HTMLElement, {
          id: videoId,
          responsive: true,
          controls: true,
        });

        // Configura os eventos
        player.on('play', () => {
          console.log('Vídeo iniciado');
        });

        player.on('pause', () => {
          console.log('Vídeo pausado');
        });

        player.on('ended', () => {
          console.log('Vídeo finalizado');
        });

        player.on('error', (error) => {
          console.error('Erro no player:', error);
        });

        // Salva a referência do player
        playerRef.current = player;
      } catch (error) {
        console.error('Erro ao carregar Vimeo Player:', error);
        // Fallback para iframe
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <iframe 
              src="https://player.vimeo.com/video/${videoId}" 
              width="100%" 
              height="100%" 
              frameborder="0" 
              allow="autoplay; fullscreen; picture-in-picture">
            </iframe>
          `;
        }
      }
    };

    loadVimeoPlayer();

    // Cleanup ao desmontar
    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch (error) {
          console.error('Erro ao destruir player Vimeo:', error);
        }
      }
    };
  }, [videoId]);

  return (
    <div 
      ref={containerRef} 
      className={`w-full aspect-video bg-black min-h-[200px] ${className}`}
    />
  );
}
