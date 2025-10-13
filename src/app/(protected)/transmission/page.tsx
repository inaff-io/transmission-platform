'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import './styles.css';
import { useRouter } from 'next/navigation';
import type { Link, Usuario } from '@/types/database';
import { LogoSection } from '@/components/LogoSection';
import { clearAuth } from '@/lib/auth';
import UIBlock from '@/components/UIBlock';
// import ChatSystem from '@/components/ChatSystem';
import { useCleanRscParams } from '@/hooks/useCleanRscParams';

import { VimeoPlayer } from '@/components/VimeoPlayer';
import LockedYouTubePlayer from '@/components/LockedYouTubePlayer';
import Banner from '@/components/Banner';

export default function TransmissionPage() {
  const router = useRouter();
  useCleanRscParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<Usuario | null>(null);
  const [currentLink, setCurrentLink] = useState<Link | null>(null);
  const [programacaoLink, setProgramacaoLink] = useState<Link | null>(null);
  const [hasManagedHeader, setHasManagedHeader] = useState(false);
  const [headerChecked, setHeaderChecked] = useState(false);
  const [isLive, setIsLive] = useState(false);
  interface Notification {
    id: number;
    message: string;
  }

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showChat, setShowChat] = useState(false);
  const notiActiveRef = useRef<Set<string>>(new Set());

  const handleLogout = useCallback(() => {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include', keepalive: true })
      .catch(() => {})
      .finally(() => {
        clearAuth();
        router.replace('/auth/login');
      });
  }, [router]);

  const refreshLinks = useCallback(async () => {
    try {
      const resp = await fetch('/api/links/active', { cache: 'no-store', credentials: 'include', keepalive: true });
      if (!resp.ok) return;
      const ct = resp.headers.get('content-type') || '';
      if (!ct.includes('application/json')) return;
      let json: unknown = null;
      try { json = await resp.json(); } catch { return; }
      const data = (json && typeof json === 'object') ? (json as Record<string, unknown>) : {};
      
      const newTransmissionLink = (data.transmissao as Link) ?? null;
      const newProgramacaoLink = (data.programacao as Link) ?? null;

      const isActive = !!newTransmissionLink?.ativo_em && !!newTransmissionLink?.url;
      const linkChanged = (newTransmissionLink?.url || null) !== (currentLink?.url || null);
      
      if (linkChanged) {
        if (isActive) {
          addNotification('Transmissão atualizada!');
          setIsLive(true);
        } else {
          if (currentLink) addNotification('Transmissão finalizada');
          setIsLive(false);
        }
      }
      
      setCurrentLink(isActive ? newTransmissionLink : null);
      setProgramacaoLink(newProgramacaoLink);
      setLastUpdate(new Date());
    } catch {}
  }, [currentLink?.url]);

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addNotification = (message: string) => {
    if (notiActiveRef.current.has(message)) return;
    notiActiveRef.current.add(message);
    const timestamp = Date.now();
    setNotifications(prev => [...prev, { id: timestamp, message }]);
    setTimeout(() => {
      removeNotification(timestamp);
      notiActiveRef.current.delete(message);
    }, 3000);
  };

  const getYouTubeId = (url: string): string => {
    try {
      const youtubeUrl = new URL(url);
      
      if (youtubeUrl.pathname === '/watch') {
        return youtubeUrl.searchParams.get('v') || '';
      }
      
      if (youtubeUrl.hostname === 'youtu.be') {
        return youtubeUrl.pathname.slice(1);
      }
      
      if (youtubeUrl.pathname.startsWith('/embed/')) {
        return youtubeUrl.pathname.split('/embed/')[1];
      }
      
      return '';
    } catch {
      return '';
    }
  };

  const getVimeoId = (url: string): string => {
    try {
      const vimeoUrl = new URL(url);
      const pathParts = vimeoUrl.pathname.split('/');
      return pathParts[pathParts.length - 1];
    } catch {
      return '';
    }
  };

  const getVideoType = (url: string): 'vimeo' | 'youtube' | 'html' | null => {
    try {
      const videoUrl = new URL(url);
      if (videoUrl.hostname.includes('vimeo.com')) return 'vimeo';
      if (
        videoUrl.hostname.includes('youtube.com') ||
        videoUrl.hostname.includes('youtube-nocookie.com') ||
        videoUrl.hostname === 'youtu.be'
      ) return 'youtube';
      return null;
    } catch {
      const t = url.trim();
      if (t.startsWith('<') || t.includes('<iframe') || t.includes('<div')) return 'html';
      return null;
    }
  };



  useEffect(() => {
    const loadUser = () => {
      fetch('/api/auth/me', { cache: 'no-store', credentials: 'include', keepalive: true })
        .then(async (r) => {
          if (!r.ok) throw new Error('Não autenticado');
          const me = await r.json();
          setUser(me as Usuario);
        })
        .catch(() => handleLogout());
    };

    const checkManagedHeader = async () => {
      const controller = new AbortController();
      try {
        const resp = await fetch('/api/ui/login_header', { cache: 'no-store', signal: controller.signal, keepalive: true });
        if (resp.ok) {
          const ct = resp.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const data = await resp.json();
            if (data && typeof data === 'object' && 'html' in data && data.html) {
              setHasManagedHeader(true);
            }
          }
        }
      } catch (e) {
        // Ignore abort errors
      }
      setHeaderChecked(true);
    };

    loadUser();
    refreshLinks();
    checkManagedHeader();
    setLoading(false);
  }, [handleLogout, refreshLinks]);

  useEffect(() => {
    // Auto-refresh desabilitado para evitar recarregamentos constantes
    // Se precisar atualizar, use o botão de refresh manual
    // const interval = setInterval(() => {
    //   refreshLinks();
    // }, 30000);
    // return () => clearInterval(interval);
  }, [refreshLinks]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4">
            <span className="sr-only">Carregando...</span>
          </div>
          <p className="text-gray-600 text-lg font-medium">Carregando transmissão...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-in-right"
          >
            {notification.message}
          </div>
        ))}
      </div>

      <div className="relative w-full">
        <UIBlock block="login_header" className="w-full" />
        {hasManagedHeader && (
          <div className="absolute top-2 right-4 z-20">
            <div className="text-white rounded-lg px-4 py-2 flex items-center gap-3 shadow-lg">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium">{isLive ? 'AO VIVO' : 'OFFLINE'}</span>
              </div>
              <span className="text-sm hidden sm:inline border-l border-gray-400 pl-3">{user?.nome}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-sm font-medium rounded-md bg-red-600 hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sair
              </button>
            </div>
          </div>
        )}
      </div>

      {headerChecked && !hasManagedHeader && (
        <header className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-xs font-medium text-gray-600">{isLive ? 'AO VIVO' : 'OFFLINE'}</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex flex-col sm:flex-row gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">Usuário: </span>
                    <span className="text-gray-900 font-medium">{user?.nome}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Categoria: </span>
                    <span className="text-gray-900 font-medium">{user?.categoria}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Última atualização: </span>
                    <span className="text-gray-900 font-medium">{lastUpdate.toLocaleTimeString()}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-md"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Header com Logo do Evento removido conforme solicitado */}

      {/* Banner do evento - espaçamento em notebook e desktop */}
      <div className="md:-mt-2 lg:-mt-6">
        <Banner 
          imageUrl="/logo-evento.png"
          title=""
          subtitle=""
          ctaHref={undefined}
          ctaLabel={undefined}
          overlayOpacityClass="bg-black/0"
        />
      </div>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex-1 w-full">
        <div className="flex flex-col lg:flex-row gap-6">
          <section className="w-full lg:w-[70%] space-y-4">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
              <h2 className="text-lg font-bold text-gray-900">Transmissão ao Vivo</h2>
            </div>
            <div className="bg-white shadow-xl rounded-b-xl overflow-hidden border border-gray-200">
              <div className="relative group">
                {(() => {
                  if (!currentLink) {
                    return (
                      <div className="w-full aspect-video flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <div className="text-center">
                          <div className="text-6xl mb-4 opacity-50">📺</div>
                          <h3 className="text-xl font-semibold text-gray-700 mb-2">Transmissão Indisponível</h3>
                          <p className="text-gray-500">Aguarde o início da transmissão</p>
                        </div>
                      </div>
                    );
                  }
                  
                  const u = currentLink.url || '';
                  const trimmed = u.trim();
                  const videoType = getVideoType(trimmed);

                  switch (videoType) {
                    case 'vimeo':
                      return (
                        <VimeoPlayer
                          videoId={getVimeoId(trimmed)}
                          className="w-full aspect-video"
                        />
                      );
                    case 'youtube': {
                      const videoId = getYouTubeId(trimmed);
                      if (!videoId) {
                        return (
                          <div className="w-full aspect-video flex items-center justify-center bg-gray-100 border rounded-lg">
                            <p className="text-gray-500">ID do vídeo do YouTube não encontrado</p>
                          </div>
                        );
                      }
                      return (
                        <LockedYouTubePlayer
                          videoUrlOrId={videoId}
                          className="w-full aspect-video"
                          onRequireAudioActivation={() => addNotification('Clique para ativar o áudio')}
                        />
                      );
                    }
                    case 'html': {
                      // Se o conteúdo HTML for um embed do YouTube ou Vimeo, extrair o ID e usar o player apropriado com autoplay
                      const idFromYouTubeEmbed = (() => {
                        const m1 = trimmed.match(/src=["'](?:https?:)?\/\/(?:www\.)?(?:youtube\.com|youtube-nocookie\.com)\/embed\/([a-zA-Z0-9_-]{11})/);
                        if (m1 && m1[1]) return m1[1];
                        const m2 = trimmed.match(/src=["'](?:https?:)?\/\/(?:www\.)?(?:youtube\.com|youtube-nocookie\.com)\/watch\?[^"']*v=([a-zA-Z0-9_-]{11})/);
                        if (m2 && m2[1]) return m2[1];
                        const m3 = trimmed.match(/(?:https?:)?\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/);
                        if (m3 && m3[1]) return m3[1];
                        return '';
                      })();

                      if (idFromYouTubeEmbed) {
                        return (
                          <LockedYouTubePlayer
                            videoUrlOrId={idFromYouTubeEmbed}
                            className="w-full aspect-video"
                            onRequireAudioActivation={() => addNotification('Clique para ativar o áudio')}
                          />
                        );
                      }

                      const idFromVimeoEmbed = (() => {
                        const m1 = trimmed.match(/src=["'](?:https?:)?\/\/player\.vimeo\.com\/video\/(\d+)/);
                        return m1 && m1[1] ? m1[1] : '';
                      })();

                      if (idFromVimeoEmbed) {
                        return (
                          <VimeoPlayer
                            videoId={idFromVimeoEmbed}
                            className="w-full aspect-video"
                          />
                        );
                      }

                      // Se não for YouTube/Vimeo (ou não conseguimos ID), renderiza o HTML original, mas com um overlay que bloqueia cliques
                      return (
                        <div className="relative w-full aspect-video">
                          <div 
                            className="absolute inset-0"
                            dangerouslySetInnerHTML={{ __html: trimmed }} 
                          />
                          {/* Overlay depois do conteúdo, com z-index alto e eventos ativos */}
                          <div
                            className="absolute inset-0 z-[999999]"
                            style={{ pointerEvents: 'auto', cursor: 'not-allowed', background: 'transparent' }}
                            title="Interações bloqueadas"
                            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          />
                        </div>
                      );
                    }
                    default:
                      return (
                        <iframe
                          title="transmission-player"
                          src={u}
                          className="w-full aspect-video"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      );
                  }
                })()}
                
                {/* Removed overlay controls div as requested */}
                {/* Previously here: absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 */}
                
              </div>
            </div>
          </section>

          <section className="w-full lg:w-[30%] space-y-4">
            <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Programação
                </h2>
              </div>
              <div className="relative h-[400px] lg:h-[500px]">
                {programacaoLink?.url ? (
                  <div 
                    className="absolute inset-0 rounded-lg overflow-hidden shadow bg-white"
                    dangerouslySetInnerHTML={{ __html: programacaoLink.url }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="text-center">
                      <div className="text-4xl mb-3 opacity-50">📅</div>
                      <p className="text-gray-500 font-medium">Programação não disponível</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <UIBlock block="transmissao_footer" className="w-full mt-auto" />

      {/* Bate-papo desabilitado */}
      {/* <ChatSystem 
        isVisible={showChat}
        onToggle={() => setShowChat(!showChat)}
        userName={user?.nome || 'Usuário'}
      /> */}
    </div>
  );
}
