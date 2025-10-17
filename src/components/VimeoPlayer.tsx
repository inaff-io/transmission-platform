'use client';

import { useEffect, useRef, useState } from 'react';

interface VimeoPlayerProps {
  videoId: string;
  className?: string;
}

export function VimeoPlayer({ videoId, className = '' }: VimeoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const timeKeyRef = useRef<string | null>(null);
  const [quality, setQuality] = useState<string | null>(null);
  const [qualityMessage, setQualityMessage] = useState<string | null>(null);

  useEffect(() => {
    timeKeyRef.current = videoId ? `transmission_time_vimeo_${videoId}` : null;
  }, [videoId]);

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
          autoplay: true,
          muted: true,
          playsinline: true,
        });

        // Tenta iniciar a reprodução (alguns navegadores exigem muted)
        try {
          await player.play();
        } catch (err) {
          // Se falhar, mantém muted e tenta novamente
          try {
            await player.setVolume(0);
            await player.play();
          } catch {}
        }

        // Helper para atualizar qualidade atual
        const updateQualityState = async () => {
          try {
            const q = await player.getQuality?.();
            if (q) setQuality(String(q));
          } catch {}
        };

        player.on('play', async () => {
          console.log('Vídeo iniciado');
          setReady(true);
          // Restaurar posição ou ir para o mais atual conforme flag
          try {
            const forceLive = localStorage.getItem('transmission_force_live') === '1';
            const key = timeKeyRef.current;
            if (forceLive) {
              try { if (key) localStorage.removeItem(key) } catch {}
              await goLiveVimeo();
              try { localStorage.removeItem('transmission_force_live') } catch {}
            } else if (key) {
              const t = Number(localStorage.getItem(key) ?? '0');
              if (!Number.isNaN(t) && t > 0) {
                try { await player.setCurrentTime(t) } catch {}
              }
            }
          } catch {}
          // Force 1080p quality if available
          await forceVimeoQuality()
          await updateQualityState()
        });

        player.on('pause', () => {
          console.log('Vídeo pausado');
        });

        player.on('ended', () => {
          console.log('Vídeo finalizado');
        });

        player.on('error', (error) => {
          console.error('Erro no player:', error);
          setReady(true);
        });

        // Eventos adicionais para reforçar qualidade após carregar e mudanças automáticas
        player.on('loaded', async () => {
          try {
            // Se houver flag de live, ir ao mais atual imediatamente
            const forceLive = localStorage.getItem('transmission_force_live') === '1';
            if (forceLive) {
              await goLiveVimeo();
            }
            await forceVimeoQuality();
            await updateQualityState();
          } catch {}
        });
        player.on('qualitychange', async (evt: any) => {
          try {
            const q = typeof evt === 'string' ? evt : evt?.quality;
            if (q) setQuality(String(q));
            if (q !== '1080p') await forceVimeoQuality();
          } catch {}
        });

        // Salva a referência do player
        playerRef.current = player;
      } catch (error) {
        console.error('Erro ao carregar Vimeo Player:', error);
        // Fallback para iframe com autoplay e muted
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <iframe 
              src="https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&playsinline=1" 
              width="100%" 
              height="100%" 
              frameborder="0" 
              allow="autoplay; picture-in-picture; web-share"
              referrerpolicy="strict-origin-when-cross-origin"
              playsinline
              title="Vimeo player">
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

  // Reforça 1080p usando a referência atual
  const forceVimeoQuality = async () => {
    try {
      const player = playerRef.current;
      if (!player) return;
      const qualities: string[] = await player.getQualities?.();
      if (!Array.isArray(qualities) || qualities.length === 0) {
        setQualityMessage('Qualidades indisponíveis');
        window.setTimeout(() => setQualityMessage(null), 2000);
        return;
      }
      const filtered = qualities.filter(q => q !== 'auto');
      const preferred = ['1080p', '720p', '540p', '360p', '240p'];
      const best = preferred.find(q => filtered.includes(q)) || filtered[0];
      await player.setQuality(best);
      setQuality(String(best));
      setQualityMessage(best === '1080p' ? 'Aplicado 1080p' : `1080p indisponível; aplicado ${best}`);
      window.setTimeout(() => setQualityMessage(null), 2000);
    } catch {
      setQualityMessage('Falha ao aplicar qualidade');
      window.setTimeout(() => setQualityMessage(null), 2000);
    }
  };

  // Vai para o ponto mais atual (live edge) ao carregar/refresh
  const goLiveVimeo = async () => {
    try {
      const player = playerRef.current;
      if (!player) return;
      const d = await player.getDuration?.().catch(() => undefined as any);
      if (typeof d === 'number' && !Number.isNaN(d) && d > 0) {
        await player.setCurrentTime(Math.max(0, d - 0.25)).catch(() => {});
      }
      // Caso não seja possível obter duração (live puro), o player já está no ponto atual
    } catch {}
  };

  const seekBy = async (deltaSeconds: number) => {
    try {
      const player = playerRef.current
      if (!player) return
      const current = await player.getCurrentTime()
      const duration = await player.getDuration().catch(() => undefined)
      let target = Number(current ?? 0) + deltaSeconds
      if (Number.isNaN(target)) return
      if (target < 0) target = 0
      if (typeof duration === 'number' && !Number.isNaN(duration)) {
        if (target > duration) target = duration
      }
      await player.setCurrentTime(target)
    } catch {}
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase() || ''
      if (tag === 'input' || tag === 'textarea') return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        seekBy(-5)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        seekBy(5)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Save current time periodically and on refresh request
  useEffect(() => {
    const saveCurrentTime = async () => {
      try {
        const key = timeKeyRef.current
        if (!key) return
        const player = playerRef.current
        if (!player) return
        const t = await player.getCurrentTime()
        if (typeof t === 'number' && !Number.isNaN(t) && t >= 0) {
          localStorage.setItem(key, String(t))
        }
      } catch {}
    }

    const interval = window.setInterval(() => { saveCurrentTime() }, 1000)
    const saveHandler = () => { saveCurrentTime() }
    const forceLiveHandler = () => {
      try {
        localStorage.setItem('transmission_force_live', '1')
        goLiveVimeo()
      } catch {}
    }
    window.addEventListener('transmission:saveTime' as any, saveHandler as any)
    window.addEventListener('transmission:forceLive' as any, forceLiveHandler as any)
    window.addEventListener('beforeunload', saveHandler as any)
    return () => {
      clearInterval(interval)
      window.removeEventListener('transmission:saveTime' as any, saveHandler as any)
      window.removeEventListener('transmission:forceLive' as any, forceLiveHandler as any)
      window.removeEventListener('beforeunload', saveHandler as any)
    }
  }, [ready, videoId])

  return (
    <div className={`w-full ${className}`}>
      <div 
        ref={containerRef} 
        className="w-full aspect-video bg-black min-h-[200px]"
      />
      <div className="mt-2 sm:mt-3 md:mt-4 px-4 sm:px-6 md:px-8 mx-auto max-w-screen-lg">
        <div className="flex items-center gap-4 rounded-lg bg-black/40 backdrop-blur-sm px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => seekBy(-10)}
              className="text-white hover:text-blue-300 transition-colors"
              title="Atrasar 10s"
              aria-label="Atrasar 10 segundos"
              disabled={!ready}
            >
              ⏪ 10s
            </button>
            <button
              type="button"
              onClick={() => seekBy(-5)}
              className="text-white hover:text-blue-300 transition-colors"
              title="Atrasar 5s"
              aria-label="Atrasar 5 segundos"
              disabled={!ready}
            >
              ⏪ 5s
            </button>
            <button
              type="button"
              onClick={() => seekBy(5)}
              className="text-white hover:text-blue-300 transition-colors"
              title="Avançar 5s"
              aria-label="Avançar 5 segundos"
              disabled={!ready}
            >
              ⏩ 5s
            </button>
            <button
              type="button"
              onClick={() => seekBy(10)}
              className="text-white hover:text-blue-300 transition-colors"
              title="Avançar 10s"
              aria-label="Avançar 10 segundos"
              disabled={!ready}
            >
              ⏩ 10s
            </button>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-white/80 text-sm" title="Qualidade atual">
              Qualidade: {quality ?? 'Desconhecida'}
            </span>
            <button
              type="button"
              onClick={() => forceVimeoQuality()}
              className="text-white hover:text-blue-300 transition-colors"
              title="Reforçar 1080p"
              aria-label="Reforçar 1080p"
              disabled={!ready}
            >
              🔧 1080p
            </button>
            {qualityMessage && (
              <span className="text-white/70 text-xs">{qualityMessage}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
