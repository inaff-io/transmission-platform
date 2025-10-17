'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import './styles.css';
import { useRouter } from 'next/navigation';
import type { Link, Usuario } from '@/types/database';
// Removido LogoSection em favor do Banner com logo-evento
import { clearAuth } from '@/lib/auth';
import UIBlock from '@/components/UIBlock';
import ChatSystem from '@/components/ChatSystem';
import ThemeToggle from '@/components/ui/ThemeToggle';
import HelpButton from '@/components/ui/HelpButton';
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
  const [rightTab, setRightTab] = useState<'programacao' | 'chat'>('chat');
  const [hasManagedHeader, setHasManagedHeader] = useState(false);
  const [headerChecked, setHeaderChecked] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [forcedLive, setForcedLive] = useState(false);
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
          // Ao receber link ativo, remove estado forçado
          setForcedLive(false);
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

  const handleManualRefresh = useCallback(async () => {
    // Agora o refresh sempre vai ao mais atual (AO VIVO)
    addNotification('Atualizando transmissão (indo para o AO VIVO)...');
    try {
      // Marca para forçar ir ao AO VIVO na próxima carga
      localStorage.setItem('transmission_force_live', '1');
      // Opcionalmente notifica players atuais (se ainda estiver na mesma sessão antes do reload)
      window.dispatchEvent(new Event('transmission:forceLive'));
    } catch {}
    // Pequeno atraso apenas para garantir propagação do evento, então recarrega
    await new Promise((r) => setTimeout(r, 250));
    window.location.reload();
  }, []);

  const handleClearChat = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/messages', { method: 'DELETE', credentials: 'include', keepalive: true });
      if (!res.ok) {
        addNotification('Falha ao limpar o bate-papo');
        return;
      }
      addNotification('Bate-papo limpo!');
      try {
        window.dispatchEvent(new Event('chat:refresh'));
      } catch {}
    } catch {
      addNotification('Erro ao limpar o bate-papo');
    }
  }, []);

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

  useEffect(() => {
    // Ouve atualizações do painel de admin para atualizar transmissão automaticamente
    const bc = new BroadcastChannel('transmission_updates');
    bc.onmessage = (ev) => {
      try {
        const data = ev.data;
        if (data && typeof data === 'object' && data.type === 'links_updated') {
          // Força ir ao AO VIVO ao receber novo link
          try {
            localStorage.setItem('transmission_force_live', '1');
            window.dispatchEvent(new Event('transmission:forceLive'));
          } catch {}
          refreshLinks();
          addNotification('Transmissão atualizada automaticamente!');
        }
      } catch {}
    };
    return () => {
      try { bc.close(); } catch {}
    };
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <Banner 
        imageUrl="/logo-evento.png" 
        overlayOpacityClass="bg-transparent" 
        title="" 
        subtitle="" 
        heightClass="h-[180px] sm:h-[240px] md:h-[300px] lg:h-[360px] xl:h-[420px]"
        backgroundClass="p-2 sm:p-3 md:p-4 bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-b border-gray-200"
        fullBleed={false}
      />
      {/* Proteção de clique na área superior (compartilhamento) */}
      <div className="pointer-events-none select-none">
        <UIBlock block="login_header" className="w-full" />
      </div>

      {headerChecked && !hasManagedHeader && (
        <header className="bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${(isLive || forcedLive) ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{(isLive || forcedLive) ? 'AO VIVO' : 'OFFLINE'}</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex flex-col sm:flex-row gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Usuário: </span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{user?.nome}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">E-mail: </span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{user?.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Última atualização: </span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{lastUpdate.toLocaleTimeString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleManualRefresh}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md"
                  >
                    Atualizar transmissão
                  </button>
                  {((user?.categoria || '').toLowerCase() === 'admin') && (
                    (forcedLive ? (
                      <button
                        onClick={() => { setForcedLive(false); addNotification('Marcado como OFFLINE'); }}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 shadow-md"
                      >
                        Cancelar Ao Vivo
                      </button>
                    ) : (
                      <button
                        onClick={() => { setForcedLive(true); addNotification('Marcado como AO VIVO'); }}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-md"
                      >
                        Forçar Ao Vivo
                      </button>
                    ))
                  )}
                  <HelpButton />
                  <ThemeToggle />
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-md"
                  >
                    Sair
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

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

      {/* Header com Logo do Evento removido conforme solicitado */}

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex-1 w-full">
        <div className="flex flex-col lg:flex-row gap-6">
          <section className="w-full lg:w-[70%] space-y-4">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Transmissão ao Vivo</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/reprise')}
                  className="group inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-pink-600 via-red-600 to-orange-500 hover:from-pink-500 hover:via-red-500 hover:to-orange-400 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-lg shadow-red-500/30 hover:shadow-xl hover:scale-[1.02]"
                  title="Ir para Reprise"
                  aria-label="assista a reprise dia 16"
                >
                  <span className="text-lg">⏪</span>
                  <span className="tracking-wide">assista a reprise dia 16</span>
                </button>
              </div>
            </div>
            <div className="bg-white shadow-xl rounded-b-xl overflow-hidden border border-gray-200">
              <div className="relative group">
                {(() => {
                  if (!currentLink) {
                    if (forcedLive) {
                      return (
                        <div className="w-full aspect-video flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <div className="text-center">
                            <div className="text-6xl mb-4 opacity-50">⏳</div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">AO VIVO - aguardando sinal</h3>
                            <p className="text-gray-500">A transmissão começará em breve</p>
                          </div>
                        </div>
                      );
                    }
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

          <section className="w-full lg:w-[30%]">
            <div className="bg-white dark:bg-gray-900 shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              {/* Abas */}
              <div className="px-4 pt-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRightTab('chat')}
                    className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-t-md border-b-2 ${rightTab === 'chat' ? 'border-blue-600 text-blue-700 dark:text-blue-400' : 'border-transparent text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    Bate Papo
                  </button>
                  <button
                    onClick={() => setRightTab('programacao')}
                    className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-t-md border-b-2 ${rightTab === 'programacao' ? 'border-blue-600 text-blue-700 dark:text-blue-400' : 'border-transparent text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Programação
                  </button>
                </div>
              </div>

              {/* Conteúdo das Abas */}
              <div className="relative h-[450px] lg:h-[500px]">
                {rightTab === 'programacao' ? (
                  programacaoLink?.url ? (
                    <div 
                      className="absolute inset-0 rounded-lg overflow-hidden shadow bg-white dark:bg-gray-900"
                      dangerouslySetInnerHTML={{ __html: programacaoLink.url }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                      <div className="text-center">
                        <div className="text-4xl mb-3 opacity-50">📅</div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Programação não disponível</p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="absolute inset-0 flex flex-col">
                    {((user?.categoria || '').toLowerCase() === 'admin') && (
                      <div className="p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-end">
                        <button
                          onClick={handleClearChat}
                          className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
                          title="Limpar todas as conversas"
                        >
                          Limpar conversas
                        </button>
                      </div>
                    )}
                    <div className="flex-1 min-h-0">
                      <ChatSystem
                        isVisible={true}
                        onToggle={() => {}}
                        userName={user?.nome || user?.email || 'Usuário'}
                        currentUserId={user?.id as string | undefined}
                        canModerate={(user?.categoria || '').toLowerCase() === 'admin'}
                        variant="embedded"
                        showHeader={false}
                      />
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
