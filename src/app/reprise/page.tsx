"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import ReprisePlayer from '@/components/ReprisePlayer';
import UIBlock from '@/components/UIBlock';
import Banner from '@/components/Banner';
import ThemeToggle from '@/components/ui/ThemeToggle';
import HelpButton from '@/components/ui/HelpButton';
import { useRouter } from 'next/navigation';
import { clearAuth } from '@/lib/auth';
import type { Link, Usuario } from '@/types/database';
import '../(protected)/transmission/styles.css';

type RepriseLink = {
  id: string;
  tipo: string;
  url: string | null;
  ativo_em: string | null;
  atualizado_em: string | null;
  created_at: string | null;
} | null;

export default function ReprisePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<Usuario | null>(null);
  const [reprise, setReprise] = useState<RepriseLink>(null);
  const [programacaoLink, setProgramacaoLink] = useState<Link | null>(null);
  const [hasManagedHeader, setHasManagedHeader] = useState(false);
  const [headerChecked, setHeaderChecked] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [notifications, setNotifications] = useState<{ id: number; message: string }[]>([]);
  const notiActiveRef = useRef<Set<string>>(new Set());
  const bcRef = useRef<BroadcastChannel | null>(null);

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

  const handleLogout = useCallback(() => {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include', keepalive: true })
      .catch(() => {})
      .finally(() => {
        clearAuth();
        router.replace('/auth/login');
      });
  }, [router]);

  const loadUser = useCallback(() => {
    fetch('/api/auth/me', { cache: 'no-store', credentials: 'include', keepalive: true })
      .then(async (r) => {
        if (!r.ok) throw new Error('Não autenticado');
        const me = await r.json();
        setUser(me as Usuario);
      })
      .catch(() => handleLogout());
  }, [handleLogout]);

  const loadProgramacao = useCallback(async () => {
    try {
      const res = await fetch('/api/links/active', { credentials: 'include', keepalive: true, cache: 'no-store' });
      if (!res.ok) return;
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) return;
      const data = await res.json();
      setProgramacaoLink((data?.programacao as Link) || null);
    } catch {}
  }, []);

  const loadReprise = useCallback(async () => {
    try {
      const res = await fetch('/api/reprise', { cache: 'no-store', credentials: 'include', keepalive: true });
      const data = await res.json();
      setReprise(data?.reprise || null);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Erro ao carregar reprise:', err);
      setReprise(null);
    }
  }, []);

  const handleManualRefresh = useCallback(async () => {
    addNotification('Atualizando reprise...');
    await loadReprise();
  }, [loadReprise]);

  useEffect(() => {
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
    loadReprise();
    loadProgramacao();
    checkManagedHeader();
    setLoading(false);
  }, [loadUser, loadReprise, loadProgramacao]);

  useEffect(() => {
    try { bcRef.current = new BroadcastChannel('transmission_updates'); } catch {}
    const bc = bcRef.current;
    if (bc) {
      const handler = (ev: MessageEvent) => {
        if (ev?.data?.type === 'links_updated') {
          loadReprise();
          loadProgramacao();
          addNotification('Reprise/Programação atualizadas!');
        }
      };
      bc.addEventListener('message', handler);
    }
    return () => { try { bc?.close(); } catch {} bcRef.current = null; };
  }, [loadReprise, loadProgramacao]);

  const formattedDate = (() => {
    const d = reprise?.ativo_em || reprise?.atualizado_em || reprise?.created_at;
    if (!d) return null;
    try { return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }); } catch { return null; }
  })();

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
                  <div className={`w-2 h-2 rounded-full ${reprise?.url ? 'bg-purple-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{reprise?.url ? 'REPRISE' : 'OFFLINE'}</span>
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
                    Atualizar reprise
                  </button>
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

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex-1 w-full">
        <div className="flex flex-col lg:flex-row gap-6">
          <section className="w-full lg:w-[70%] space-y-4">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Reprise da Transmissão</h2>
                {formattedDate && (
                  <p className="text-xs text-gray-600">Última atividade: {formattedDate}</p>
                )}
              </div>
              <button
                onClick={() => router.push('/transmission')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-green-600 via-emerald-600 to-teal-500 hover:from-green-700 hover:via-emerald-700 hover:to-teal-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-lg shadow-emerald-500/30"
                title="Voltar para Transmissão Ao Vivo"
              >
                <span className="text-lg">🔴</span>
                <span>Voltar ao Ao Vivo</span>
              </button>
            </div>
            <div className="bg-white shadow-xl rounded-b-xl overflow-hidden border border-gray-200">
              <div className="relative group">
                {loading ? (
                  <div className="w-full aspect-video flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <div className="text-center">
                      <div className="text-6xl mb-4 opacity-50">⏳</div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">Carregando reprise...</h3>
                      <p className="text-gray-500">Aguarde enquanto buscamos o conteúdo</p>
                    </div>
                  </div>
                ) : reprise?.url ? (
                  <ReprisePlayer url={reprise.url} />
                ) : (
                  <div className="w-full aspect-video flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <div className="text-center">
                      <div className="text-6xl mb-4 opacity-50">📺</div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">Reprise Indisponível</h3>
                      <p className="text-gray-500">Nenhum conteúdo de reprise disponível no momento</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="w-full lg:w-[30%]">
            <div className="bg-white dark:bg-gray-900 shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="px-4 pt-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-t-md border-b-2 border-blue-600 text-blue-700 dark:text-blue-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Programação
                  </span>
                </div>
              </div>

              <div className="relative h-[450px] lg:h-[500px]">
                {programacaoLink?.url ? (
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
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <UIBlock block="transmissao_footer" className="w-full mt-auto" />
    </div>
  );
}