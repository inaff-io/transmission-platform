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
      console.log('[EditarUsuario] Fetching user:', params.id);
      const response = await fetch(`/api/usuarios/${params.id}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        keepalive: true,
      });

      console.log('[EditarUsuario] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error('[EditarUsuario] Error response:', errorData);

        if (response.status === 401) {
          setError('Sessão expirada. Redirecionando para login...');
          setTimeout(() => router.push('/auth/login'), 2000);
          return;
        }
        if (response.status === 403) {
          setError('Acesso negado: ' + (errorData.error || 'Você não tem permissão para editar usuários'));
          return;
        }
        if (response.status === 404) {
          setError('Usuário não encontrado');
          return;
        }
        setError(errorData.error || 'Falha ao carregar usuário');
        return;
      }

      const data = await response.json();
      console.log('[EditarUsuario] User loaded successfully:', data.email);
      setUsuario(data);
    } catch (err) {
      console.error('[EditarUsuario] Unexpected error:', err);
      setError('Erro ao carregar usuário: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    }
  }

  async function handleSubmit(data: any) {
    try {
      console.log('[EditarUsuario] Submitting:', data);
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

      console.log('[EditarUsuario] Submit response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error('[EditarUsuario] Submit error:', errorData);

        if (response.status === 401) {
          setError('Sessão expirada. Redirecionando para login...');
          setTimeout(() => router.push('/auth/login'), 2000);
          return;
        }
        if (response.status === 403) {
          setError('Acesso negado: ' + (errorData.error || 'Você não tem permissão para editar usuários'));
          return;
        }
        if (response.status === 400) {
          setError(errorData.error || 'Dados inválidos');
          return;
        }
        setError(errorData.error || 'Falha ao salvar usuário');
        return;
      }

      console.log('[EditarUsuario] User saved successfully, redirecting...');
      router.push('/admin/usuarios');
    } catch (err) {
      console.error('[EditarUsuario] Unexpected submit error:', err);
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