'use client';

import { useEffect, useRef } from 'react';

interface YouTubePlayerProps {
  videoId: string;
}

export function YouTubePlayer({ videoId }: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playerRef.current) return;

    // Carrega a API do YouTube
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube-nocookie.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    let player: any = null;

    // Função para criar o player
    const createPlayer = () => {
      if (!playerRef.current) return;
      
      try {
        player = new (window as any).YT.Player(playerRef.current, {
          videoId,
          host: 'https://www.youtube-nocookie.com',
          playerVars: {
            autoplay: 0,
            controls: 1,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            origin: window.location.origin
          },
          events: {
            onReady: (event: any) => {
              event.target.setVolume(50);
            },
            onError: (event: any) => {
              console.error('Erro no player do YouTube:', event);
              // Tenta recriar o player com o domínio padrão em caso de erro
              if (player) {
                try {
                  player.destroy();
                } catch (error) {
                  console.error('Erro ao destruir player:', error);
                }
              }
              createPlayerWithFallback();
            }
          }
        });
      } catch (error) {
        console.error('Erro ao criar player do YouTube:', error);
        createPlayerWithFallback();
      }
    };

    // Função para criar o player com domínio padrão em caso de erro
    const createPlayerWithFallback = () => {
      if (!playerRef.current) return;
      
      try {
        player = new (window as any).YT.Player(playerRef.current, {
          videoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            origin: window.location.origin
          },
          events: {
            onReady: (event: any) => {
              event.target.setVolume(50);
            },
            onError: (event: any) => {
              console.error('Erro no player do YouTube (fallback):', event);
              if (playerRef.current) {
                playerRef.current.innerHTML = `
                  <div class="aspect-video flex items-center justify-center bg-black text-white">
                    <p>Erro ao carregar o vídeo. Por favor, tente novamente mais tarde.</p>
                  </div>
                `;
              }
            }
          }
        });
      } catch (error) {
        console.error('Erro ao criar player do YouTube (fallback):', error);
        if (playerRef.current) {
          playerRef.current.innerHTML = `
            <div class="aspect-video flex items-center justify-center bg-black text-white">
              <p>Erro ao carregar o vídeo. Por favor, tente novamente mais tarde.</p>
            </div>
          `;
        }
      }
    };

    // Cria o player quando a API estiver pronta
    if ((window as any).YT && (window as any).YT.Player) {
      createPlayer();
    } else {
      (window as any).onYouTubeIframeAPIReady = createPlayer;
    }

    return () => {
      if (player && player.destroy) {
        try {
          player.destroy();
        } catch (error) {
          console.error('Erro ao destruir player:', error);
        }
      }
      (window as any).onYouTubeIframeAPIReady = undefined;
    };
  }, [videoId]);

  return (
    <div ref={containerRef} className="relative w-full aspect-video bg-black">
      <div ref={playerRef} className="absolute inset-0" />
    </div>
  );
}