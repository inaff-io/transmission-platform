'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const HEARTBEAT_INTERVAL = 120000; // 2 minutos (reduzido de 30s para evitar requisições excessivas)

export function useHeartbeat() {
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendHeartbeat = async () => {
    try {
      const res = await fetch('/api/auth/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userAgent: navigator.userAgent
        }),
        cache: 'no-store',
        credentials: 'include',
        keepalive: true
      });

      const ct = res.headers.get('content-type') || '';
      let data: unknown = null;
      if (ct.includes('application/json')) {
        try {
          data = await res.json();
        } catch {
          data = null;
        }
      }

      if (!res.ok) {
        if (res.status === 401) {
          console.log('Token expirado ou inválido, redirecionando para login...');
          if (redirectTimeoutRef.current) {
            clearTimeout(redirectTimeoutRef.current);
          }
          redirectTimeoutRef.current = setTimeout(() => {
            router.push('/auth/login');
          }, 100);
          return;
        }
        console.error('Erro no heartbeat:', {
          status: res.status,
          statusText: res.statusText,
          data
        });
        return;
      }

      try {
        await Promise.all([
          fetch('/api/usuarios/stats?tipo=notificacoes', { cache: 'no-store', credentials: 'include', keepalive: true }),
          fetch('/api/usuarios/stats?tipo=estatisticas', { cache: 'no-store', credentials: 'include', keepalive: true })
        ]);
      } catch (statsError) {
        console.warn('Erro ao atualizar estatísticas:', statsError);
      }

    } catch (error) {
      console.error('Erro ao enviar heartbeat:', error);
    }
  };

  useEffect(() => {
    sendHeartbeat();
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  return { sendHeartbeat };
}
