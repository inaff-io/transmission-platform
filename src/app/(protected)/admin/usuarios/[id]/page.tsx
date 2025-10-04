'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UsuarioForm } from '@/components/admin/UsuarioForm';
import { Panel } from '@/components/ui/Panel';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useCleanRscParams } from '@/hooks/useCleanRscParams';

export default function EditarUsuarioPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const isNew = params.id === 'novo';

  // Remove RSC parameters from URL when component mounts
  useCleanRscParams();

  useEffect(() => {
    if (!isNew) {
      fetchUsuario();
    }
  }, [params.id]);

  async function fetchUsuario() {
    try {
      const response = await fetch(`/api/usuarios/${params.id}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        keepalive: true,
      });
      if (!response.ok) {
        if (response.status === 401) {
          setError('Não autenticado');
          setTimeout(() => router.push('/auth/login'), 100);
          return;
        }
        if (response.status === 403) {
          throw new Error('Não autorizado');
        }
        throw new Error('Falha ao carregar usuário');
      }
      const data = await response.json();
      setUsuario(data);
    } catch (err) {
      setError('Erro ao carregar usuário: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    }
  }

  async function handleSubmit(data: any) {
    try {
      const response = await fetch(isNew ? '/api/usuarios' : `/api/usuarios/${params.id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
        keepalive: true,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Não autenticado');
          setTimeout(() => router.push('/auth/login'), 100);
          return;
        }
        if (response.status === 403) {
          throw new Error('Não autorizado');
        }
        throw new Error('Falha ao salvar usuário');
      }

      router.push('/admin/usuarios');
    } catch (err) {
      setError('Erro ao salvar usuário: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    }
  }

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            {isNew ? 'Novo Usuário' : 'Editar Usuário'}
          </h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <Panel>
              <Panel.Header>
                <Panel.Title>
                  {isNew ? 'Criar novo usuário' : 'Editar usuário existente'}
                </Panel.Title>
              </Panel.Header>
              <Panel.Content>
                {!isNew && !usuario ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : (
                  <UsuarioForm
                    usuario={usuario}
                    onSubmit={handleSubmit}
                  />
                )}
              </Panel.Content>
            </Panel>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}