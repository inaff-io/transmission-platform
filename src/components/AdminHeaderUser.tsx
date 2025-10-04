'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCleanRscParams } from '@/hooks/useCleanRscParams';

type Me = { id: string; nome: string; email: string; categoria: string };

export default function AdminHeaderUser() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  // Remove RSC parameters from URL when component mounts
  useCleanRscParams();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include', keepalive: true, cache: 'no-store' });
        if (!res.ok) return;
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return;
        let data: unknown = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }
        if (!cancelled && data && typeof data === 'object') setMe(data as Me);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include', keepalive: true });
    } catch {}
    router.replace('/auth/login');
  }, [router]);

  return (
    <div className="flex items-center gap-3">
      {me && (
        <div className="text-sm text-right">
          <div className="text-gray-900 font-medium">{me.nome}</div>
          <div className="text-gray-500">{me.email}</div>
        </div>
      )}
      <button
        onClick={handleLogout}
        className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700"
        title="Sair"
      >
        Sair
      </button>
    </div>
  );
}
