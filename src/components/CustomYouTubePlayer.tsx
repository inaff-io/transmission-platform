'use client';

import { useEffect, useRef, useState } from 'react';
import './CustomYouTubePlayer.css';

interface CustomYouTubePlayerProps {
  videoId: string;
  className?: string;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function CustomYouTubePlayer({ videoId, className = '' }: CustomYouTubePlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState(-1); // -1 = não iniciado
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  // Adiciona estado para overlay visual (para depuração)
  const [showDebugOverlay, setShowDebugOverlay] = useState(false);

  // Detecta dispositivos móveis e touch screens
  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isTouchDevice || isSmallScreen);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Função para mostrar controles temporariamente em mobile
  const handleTouchShowControls = () => {
    if (isMobile) {
      setShowControls(true);
      
      // Esconde controles após 3 segundos em mobile
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  // Carrega thumbnail do YouTube com alta qualidade
  useEffect(() => {
    if (videoId) {
      // Tenta obter a thumbnail de alta qualidade (maxresdefault)
      const checkImage = (url: string) => {
        return new Promise<boolean>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = url;
        });
      };

      // Tenta primeiro a maior resolução, com fallback para outras resoluções
      const checkAndSetThumbnail = async () => {
        const resolutions = [
          `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
          `https://i.ytimg.com/vi/${videoId}/default.jpg`
        ];

        for (const url of resolutions) {
          const exists = await checkImage(url);
          if (exists) {
            setThumbnail(url);
            break;
          }
        }
      };

      checkAndSetThumbnail();
    }
  }, [videoId]);

  // Configuração e inicialização do YouTube Player
  useEffect(() => {
    // Carrega a API do YouTube
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Callback quando a API estiver pronta
    window.onYouTubeIframeAPIReady = () => {
      if (playerRef.current) {
        const ytPlayer = new window.YT.Player(playerRef.current, {
          videoId: videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1, // Iniciar automaticamente
            controls: 0, // Desabilita controles padrão do YouTube
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            fs: 0, // Desabilita botão de fullscreen do YouTube
            iv_load_policy: 3, // Remove anotações
            cc_load_policy: 0, // Remove legendas
            disablekb: 1, // Desabilita atalhos de teclado
            enablejsapi: 1, 
            playsinline: 1, // Força reprodução inline (não tela cheia) em mobile
            autohide: 1, // Tenta esconder controles
            wmode: 'transparent', // Ajuda a sobrepor elementos HTML
            origin: window.location.origin,
            widget_referrer: window.location.origin
          },
          events: {
            onReady: (event: any) => {
              setPlayer(event.target);
              setDuration(event.target.getDuration());
              setIsPlayerReady(true);
              // Inicia mudo e em pausa para evitar reprodução automática indesejada
              event.target.mute();
              setIsMuted(true);
            },
            onStateChange: (event: any) => {
              // Define os estados do player:
              // -1 (não iniciado), 0 (terminado), 1 (reproduzindo), 2 (pausado), 3 (buffering), 5 (vídeo sugerido)
              setPlayerState(event.data);
              setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
              setIsBuffering(event.data === window.YT.PlayerState.BUFFERING);
              
              // Se o vídeo terminou (0), voltamos para o início
              if (event.data === window.YT.PlayerState.ENDED) {
                event.target.seekTo(0);
                event.target.pauseVideo();
              }
            },
          },
        });
        setPlayer(ytPlayer);
      }
    };

    // Se a API já estiver carregada, inicializa o player
    if (window.YT && window.YT.Player) {
      window.onYouTubeIframeAPIReady();
    }

    // Atualiza o tempo atual a cada segundo
    const interval = setInterval(() => {
      if (player && typeof player.getCurrentTime === 'function') {
        setCurrentTime(player.getCurrentTime());
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      if (player && typeof player.destroy === 'function') {
        player.destroy();
      }
    };
  }, [videoId]);

  // UseEffect para bloquear elementos indesejados do YouTube
  useEffect(() => {
    if (!player) return;

    const hideYouTubeElements = () => {
      const iframe = playerRef.current?.querySelector('iframe');
      if (!iframe) return;

      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;

        // Injeta CSS no iframe do YouTube para esconder TODOS os elementos da UI
        const style = iframeDoc.createElement('style');
        style.textContent = `
          .ytp-impression-link,
          .ytp-cued-thumbnail-overlay-image,
          .ytp-title,
          .ytp-chrome-top,
          .ytp-show-cards-title,
          .ytp-watermark,
          .ytp-ce-element,
          .ytp-cards-button,
          .ytp-youtube-button,
          .ytp-title-link,
          .ytp-info-panel-detail,
          .ytp-large-play-button,
          .ytp-cued-thumbnail-overlay,
          .ytp-time-display,
          .ytp-spinner,
          .ytp-chrome-controls,
          .ytp-chrome-bottom,
          .ytp-pause-overlay,
          .ytp-share-panel,
          .ytp-right-controls,
          .ytp-left-controls,
          .ytp-iv-player-content,
          .annotation,
          .ytp-gradient-top,
          .ytp-gradient-bottom,
          .ytp-button {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
            width: 0 !important;
            height: 0 !important;
            position: absolute !important;
            z-index: -999 !important;
          }
          
          /* Hack específico para o botão "Assistir no YouTube" */
          .ytp-impression-link {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
            width: 0 !important;
            height: 0 !important;
            position: absolute !important;
            z-index: -999 !important;
            clip: rect(0, 0, 0, 0) !important;
          }
        `;
        iframeDoc.head.appendChild(style);
      } catch (e) {
        // CORS pode bloquear acesso ao iframe, mas os overlays externos ainda funcionam
        console.log('Não foi possível acessar iframe do YouTube (CORS)');
      }
    };

    // Tenta esconder elementos múltiplas vezes para garantir
    setTimeout(hideYouTubeElements, 100);
    setTimeout(hideYouTubeElements, 500);
    setTimeout(hideYouTubeElements, 1000);
    setTimeout(hideYouTubeElements, 3000);
    setTimeout(hideYouTubeElements, 5000);
  }, [player]);

  const togglePlay = () => {
    if (player) {
      if (isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (player) {
      player.setVolume(newVolume);
      if (newVolume === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    }
  };

  const toggleMute = () => {
    if (player) {
      if (isMuted) {
        player.unMute();
        setIsMuted(false);
      } else {
        player.mute();
        setIsMuted(true);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (player) {
      player.seekTo(newTime);
    }
  };

  const toggleFullscreen = () => {
    const container = playerRef.current?.parentElement;
    if (container) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        container.requestFullscreen();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={`custom-youtube-player relative overflow-hidden ${className}`}
      ref={playerContainerRef}
      onMouseEnter={() => !isMobile && setShowControls(true)}
      onMouseLeave={() => !isMobile && setShowControls(false)}
      onClick={handleTouchShowControls}
      onTouchStart={handleTouchShowControls}
    >
      {/* Container do player do YouTube (iframe oculto) */}
      <div 
        ref={playerRef} 
        className="w-full h-full absolute opacity-0 pointer-events-none" 
      />
      
      {/* Overlays de bloqueio estratégicos para garantir que elementos do YouTube sejam bloqueados */}
      {/* Overlay superior */}
      <div className={`top-overlay ${showDebugOverlay ? 'debug' : ''}`} />
      
      {/* Overlay inferior */}
      <div className={`bottom-overlay ${showDebugOverlay ? 'debug' : ''}`} />
      
      {/* Overlay do canto superior direito - alvo específico para o botão "Assistir no YouTube" */}
      <div className={`corner-overlay ${showDebugOverlay ? 'debug' : ''}`} />

      {/* Overlay completo para interação e bloqueio total */}
      <div className={`blocking-overlay ${showDebugOverlay ? 'debug' : ''}`} />
      
      {/* NOSSA INTERFACE PERSONALIZADA - substitui completamente o YouTube */}
      <div 
        className="absolute inset-0 z-[999] pointer-events-auto bg-black flex items-center justify-center overflow-hidden"
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          toggleFullscreen();
        }}
      >
        {/* Thumbnail de visualização quando não estiver reproduzindo */}
        {(!isPlaying || playerState <= 0) && thumbnail && (
          <div className="absolute inset-0 bg-black flex items-center justify-center overflow-hidden">
            <img 
              src={thumbnail} 
              alt="Thumbnail do vídeo" 
              className="w-full h-full object-contain"
            />
            
            {/* Ícone de play grande sobre a thumbnail */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`
                bg-black/50 rounded-full p-4 transition-transform
                ${isMobile ? 'w-24 h-24' : 'w-16 h-16'}
                hover:scale-110 cursor-pointer
              `}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-full h-full">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        )}
        
        {/* Indicador de buffering (carregando) */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        )}
        
        {/* Fundo preto quando o vídeo está ativo para esconder o iframe do YouTube */}
        {isPlaying && playerState === 1 && (
          <div className="absolute inset-0 bg-black">
            {/* Mantem fundo preto para esconder o player original do YouTube */}
          </div>
        )}
      
      {/* Controles customizados - Responsivos para mobile */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        } ${isMobile ? 'p-3 md:p-4' : 'p-4'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra de progresso - Maior em mobile */}
        <input
          type="range"
          min="0"
          max={duration}
          value={currentTime}
          onChange={handleSeek}
          className={`progress-red w-full rounded-lg appearance-none cursor-pointer mb-3 ${isMobile ? 'h-2 md:h-1' : 'h-1'}`}
          style={{ ['--progress-percent' as any]: `${(currentTime / duration) * 100}%` }}
          aria-label="Barra de progresso do vídeo"
        />
        
        <div className="flex items-center justify-between text-white">
          {/* Controles da esquerda */}
          <div className={`flex items-center ${isMobile ? 'gap-2 md:gap-3' : 'gap-3'}`}>
            {/* Botão Play/Pause - Maior em mobile */}
            <button
              onClick={togglePlay}
              className="hover:text-red-500 transition-colors touch-manipulation"
              aria-label={isPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'}
            >
              {isPlaying ? (
                <svg className={`${isMobile ? 'w-10 h-10 md:w-8 md:h-8' : 'w-8 h-8'}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className={`${isMobile ? 'w-10 h-10 md:w-8 md:h-8' : 'w-8 h-8'}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Tempo - Escondido em telas muito pequenas */}
            <span className={`text-sm ${isMobile ? 'hidden sm:inline' : ''}`}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Controle de volume - Escondido em mobile, só botão mute */}
            <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
              <button 
                onClick={toggleMute} 
                className="hover:text-red-500 transition-colors touch-manipulation"
                aria-label={isMuted ? 'Ativar som' : 'Desativar som'}
              >
                {isMuted || volume === 0 ? (
                  <svg className={`${isMobile ? 'w-8 h-8 md:w-6 md:h-6' : 'w-6 h-6'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : (
                  <svg className={`${isMobile ? 'w-8 h-8 md:w-6 md:h-6' : 'w-6 h-6'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                )}
              </button>
              {/* Slider de volume - Escondido em mobile */}
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className={`${isMobile ? 'hidden md:block md:w-20' : 'w-20'} h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer`}
                aria-label="Controle de volume"
              />
            </div>
          </div>

          {/* Controles da direita */}
          <div className={`flex items-center ${isMobile ? 'gap-2 md:gap-3' : 'gap-3'}`}>
            {/* Botão para alternar visibilidade dos overlays (depuração) */}
            <button
              onClick={() => setShowDebugOverlay(!showDebugOverlay)}
              className="hover:text-red-500 transition-colors touch-manipulation hidden md:block"
              aria-label="Mostrar overlays (depuração)"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
            </button>
            
            {/* Botão Fullscreen - Maior em mobile */}
            <button
              onClick={toggleFullscreen}
              className="hover:text-red-500 transition-colors touch-manipulation"
              aria-label="Tela cheia"
            >
              <svg className={`${isMobile ? 'w-8 h-8 md:w-6 md:h-6' : 'w-6 h-6'}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
