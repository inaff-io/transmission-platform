'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Link, Usuario } from '@/types/database';
import { clearAuth } from '@/lib/auth';
import UIBlock from '@/components/UIBlock';

export default function ProgramacaoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [programacaoLink, setProgramacaoLink] = useState<Link | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/links/active', { credentials: 'include', keepalive: true, cache: 'no-store' });
        if (!res.ok) return;
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return;
        let data: any = null;
        try {
          data = await res.json();
        } catch (e) {
          data = null;
        }
        if (cancelled || !data) return;
        setProgramacaoLink(data.programacao || null);
      } catch (e) {
        console.error('Erro ao carregar dados:', e);
        setError('Não foi possível carregar a programação.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4">
            <span className="sr-only">Carregando...</span>
          </div>
          <p className="text-gray-600 text-lg font-medium">Carregando programação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <UIBlock block="login_header" className="w-full" />

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">\n                Programação
              </h2>
            </div>
            <div className="relative h-[500px]">
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
        </div>
      </main>

      {/* Footer */}
      <UIBlock block="transmissao_footer" className="w-full mt-auto" />
    </div>
  );
}