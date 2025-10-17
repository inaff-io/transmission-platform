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
import '../../(protected)/transmission/styles.css';

type RepriseLink = {
  id: string;
  tipo: string;
  url: string | null;
  ativo_em: string | null;
  atualizado_em: string | null;
  created_at: string | null;
} | null;

export default function RepriseDayPage({ params }: { params: { day: string } }) {
  const router = useRouter();
  const day = Number(params.day);
  const posterUrl = day === 16 ? '/16.10.png' : day === 17 ? '/17.10.png' : undefined;
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

  const addNotification = (message: string) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
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
      const res = await fetch(`/api/reprise/${day}`, { cache: 'no-store', credentials: 'include', keepalive: true });
      const data = await res.json();
      setReprise(data?.reprise || null);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Erro ao carregar reprise por dia:', err);
      setReprise(null);
    }
  }, [day]);

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

  if (!day || Number.isNaN(day)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold">Dia inválido</h2>
          <p className="text-gray-600">Use uma rota válida como /reprise/16</p>
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
                <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Reprise — {day}</h1>
                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">VOD</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-3 mr-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white font-semibold">
                    {user?.nome ? user.nome[0].toUpperCase() : '?'}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-medium text-gray-900 dark:text-gray-100 leading-tight">{user?.nome}</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">{user?.email}</div>
                  </div>
                </div>
                <button
                  onClick={handleManualRefresh}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300"
                  title="Atualizar reprise"
                >
                  <span className="text-base">🔄</span>
                  <span>Atualizar</span>
                </button>
                <button
                  onClick={() => router.push('/hub-reprises')}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                  title="Voltar para a Home das Reprises"
                >
                  <span className="text-base">⬅️</span>
                  <span>Voltar</span>
                </button>
                <HelpButton />
                <ThemeToggle />
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-md"
                  title="Sair"
                >
                  <span className="text-base">🚪</span>
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex-1 w-full">
        <div className="flex flex-col lg:flex-row gap-6">
          <section className="w-full lg:w-[70%] space-y-4">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Reprise da Transmissão — {day}</h2>
                {formattedDate && (
                  <p className="text-xs text-gray-600">Última atividade: {formattedDate}</p>
                )}
              </div>
              {/* Sem botão "Voltar ao Ao Vivo" em modo reprise */}
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
                  <ReprisePlayer url={reprise.url} posterUrl={posterUrl} />
                ) : (
                  <div className="w-full aspect-video flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <div className="text-center">
                      <div className="text-6xl mb-4 opacity-50">📭</div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">Não há vídeos disponíveis para este dia</h3>
                      <p className="text-gray-500">Selecione outro dia na Home de Reprises</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="w-full lg:w-[30%] space-y-4">
            <div className="bg-white shadow-xl rounded-xl border border-gray-200 p-4">
              <h3 className="text-md font-semibold text-gray-900 mb-2">Programação</h3>
              <div className="relative h-[450px] lg:h-[500px]">
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
          </aside>
        </div>

        {/* Notifications */}
        <div className="fixed bottom-4 right-4 space-y-2 z-50">
          {notifications.map((n) => (
            <div key={n.id} className="px-4 py-2 rounded-lg bg-black text-white shadow-lg opacity-90">
              {n.message}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}