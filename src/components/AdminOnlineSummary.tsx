'use client';

import { useEffect, useState } from 'react';

export default function AdminOnlineSummary() {
  const [count, setCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const carregar = async () => {
    try {
      const res = await fetch('/api/admin/online', { credentials: 'include', keepalive: true, cache: 'no-store' });
      if (!res.ok) throw new Error('Falha ao buscar online');
      const data = await res.json();
      setCount((data.data || []).length);
      setError(null);
    } catch (e) {
      console.error('Erro ao buscar /api/admin/online', e);
      setError('Falha ao carregar');
    }
  };

  useEffect(() => {
    carregar();
    const id = setInterval(carregar, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-2">Usuários Online</h3>
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : (
        <p className="text-2xl font-semibold">{count}</p>
      )}
    </div>
  );
}
