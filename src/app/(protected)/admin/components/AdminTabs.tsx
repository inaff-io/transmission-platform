'use client';

import { useState, useEffect } from 'react';
import type { Database } from '@/lib/database.types';

export default function AdminTabs() {
  const [abas, setAbas] = useState<Database['public']['Tables']['abas']['Row'][]>([]);
  const [selectedTab, setSelectedTab] = useState<Database['public']['Tables']['abas']['Row'] | null>(null);

  useEffect(() => {
    loadAbas();
  }, []);

  // Seleciona a primeira aba habilitada por padrão
  useEffect(() => {
    if (abas.length > 0) {
      const activeTab = abas.find(aba => aba.habilitada);
      if (activeTab) {
        setSelectedTab(activeTab);
      }
    }
  }, [abas]);

  const loadAbas = async () => {
    try {
      const res = await fetch('/api/admin/tabs', { credentials: 'include', keepalive: true, cache: 'no-store' });
      if (!res.ok) throw new Error('Erro ao carregar abas');
      const json = await res.json();
      setAbas(json.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAba = async (abaId: string, habilitada: boolean) => {
    try {
      const res = await fetch('/api/admin/tabs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: abaId, habilitada }),
        credentials: 'include',
        keepalive: true,
      });
      if (!res.ok) throw new Error('Erro ao atualizar aba');
      await loadAbas();
    } catch (error) {
      console.error('Erro ao atualizar aba:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {selectedTab && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Visualização da Aba: {selectedTab.nome}
            </h3>
            <div className="border rounded-lg overflow-hidden h-[400px]">
              {(() => {
                const selUrl = (selectedTab as any)?.url as string | undefined;
                if (typeof selUrl === 'string' && selUrl.trim().length > 0) {
                  return (
                    <iframe
                      src={selUrl}
                      className="w-full h-full"
                      title={`Preview da aba ${selectedTab.nome}`}
                    />
                  );
                }
                return (
                  <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
                    Esta aba não possui URL para preview.
                  </div>
                );
              })()}
            </div>
          </div>
        )}
        {abas.map((aba) => (
          <div
            key={aba.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer"
            onClick={() => setSelectedTab(aba)}
          >
            <div>
              <h4 className="text-sm font-medium text-gray-900">{aba.nome}</h4>
              <p className="text-xs text-gray-500">
                Última atualização: {new Date(aba.atualizado_em).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => toggleAba(aba.id, !aba.habilitada)}
                className={`
                  relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer 
                  transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                  ${aba.habilitada ? 'bg-indigo-600' : 'bg-gray-200'}
                `}
              >
                <span className="sr-only">
                  {aba.habilitada ? 'Desabilitar' : 'Habilitar'} {aba.nome}
                </span>
                <span
                  className={`
                    pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 
                    transition ease-in-out duration-200
                    ${aba.habilitada ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
