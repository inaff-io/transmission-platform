'use client';

import { useEffect, useState } from 'react';

type OnlineUser = {
  id: string;
  nome: string;
  email: string;
  lastActive: string;
};

export default function OnlineUsersDisplay() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchOnlineUsers = async () => {
    try {
      const res = await fetch('/api/admin/online', { credentials: 'include', keepalive: true, cache: 'no-store' });
      if (!res.ok) throw new Error('Falha ao buscar usuários online');
      
      const data = await res.json();
      setOnlineUsers(data.data);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar usuários online:', err);
      setError('Não foi possível carregar a lista de usuários online');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOnlineUsers();
    // Atualiza a lista a cada 2 minutos (reduzido para evitar requisições excessivas)
    const interval = setInterval(fetchOnlineUsers, 120000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-md bg-red-50">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Usuários Online ({onlineUsers.length})
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Atualizado automaticamente a cada 2 minutos
        </p>
        {/* Barra de pesquisa */}
        <div className="mt-4">
          <label htmlFor="search-users" className="sr-only">Pesquisar usuários</label>
          <input
            id="search-users"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome ou email"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
      
      <div className="border-t border-gray-200 max-h-96 overflow-y-auto">
        <ul className="divide-y divide-gray-200">
          {onlineUsers
            .filter(u => {
              const q = search.trim().toLowerCase();
              if (!q) return true;
              return (
                u.nome.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q)
              );
            })
            .map((user) => (
            <li key={user.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-green-800">
                        {user.nome.charAt(0).toUpperCase()}
                      </span>
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="font-medium text-gray-900">{user.nome}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(user.lastActive).toLocaleTimeString()}
                </div>
              </div>
            </li>
          ))}
          
          {onlineUsers.length === 0 && (
            <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
              Nenhum usuário online no momento
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
