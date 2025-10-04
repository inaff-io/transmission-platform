'use client';

import { useEffect, useState } from 'react';

type LoginStats = { loginsHoje: number; logoutsHoje: number };

export default function AdminLoginStats() {
  const [stats, setStats] = useState<LoginStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const carregar = async () => {
    try {
      const res = await fetch('/api/admin/logins', { credentials: 'include', keepalive: true, cache: 'no-store' });
      if (!res.ok) throw new Error('Falha ao buscar estatísticas');
      const data = await res.json();
      setStats(data.data as LoginStats);
      setError(null);
    } catch (e) {
      console.error('Erro ao buscar /api/admin/logins', e);
      setError('Não foi possível carregar estatísticas');
    }
  };

  useEffect(() => {
    carregar();
    const id = setInterval(carregar, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-2">Logins/Logouts Hoje</h3>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-4">
        <div>
          <p className="text-xs text-gray-500">Logins</p>
          <p className="text-xl font-semibold">{stats?.loginsHoje ?? '–'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Logouts</p>
          <p className="text-xl font-semibold">{stats?.logoutsHoje ?? '–'}</p>
        </div>
      </div>
    </div>
  );
}
