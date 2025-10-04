'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Usuario } from '@/types/database';
import { useRouter } from 'next/navigation';
import ImportExcel from '@/components/ImportExcel';
import { UsuariosTable } from '@/components/admin/UsuariosTable';
import { ExportarUsuarios } from '@/components/admin/ExportarUsuarios';
import { useCleanRscParams } from '@/hooks/useCleanRscParams';

export default function UsuariosPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Remove RSC parameters from URL when component mounts
  useCleanRscParams();

  const fetchUsuarios = useCallback(async () => {
    try {
      const response = await fetch('/api/usuarios', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        keepalive: true,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Não autenticado');
        } else if (response.status === 403) {
          throw new Error('Não autorizado');
        }
        throw new Error('Falha ao carregar usuários');
      }

      const data = await response.json();
      setUsuarios(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar usuários: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      if (err instanceof Error && err.message === 'Não autenticado') {
        setTimeout(() => {
          router.push('/auth/login');
        }, 100);
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleDelete = async (usuario: Usuario) => {
    if (confirm(`Deseja realmente excluir o usuário ${usuario.nome}?`)) {
      try {
        const response = await fetch(`/api/usuarios?id=${usuario.id}`, {
          method: 'DELETE',
          credentials: 'include',
          cache: 'no-store',
          keepalive: true,
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Não autenticado');
          } else if (response.status === 403) {
            throw new Error('Não autorizado');
          }
          throw new Error('Falha ao excluir usuário');
        }

        // Recarregar a lista após excluir
        fetchUsuarios();
      } catch (err) {
        setError('Erro ao excluir usuário: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
        if (err instanceof Error && err.message === 'Não autenticado') {
          setTimeout(() => {
            router.push('/auth/login');
          }, 100);
        }
      }
    }
  };

  // Apagar todos os usuários
  const handleDeleteAll = async () => {
    if (!usuarios.length) {
      setError('Não há usuários para excluir.');
      return;
    }

    const confirmed = confirm('Deseja realmente excluir TODOS os usuários? Esta ação não pode ser desfeita.');
    if (!confirmed) return;

    try {
      setError(null);
      setSuccess(null);
      for (const usuario of usuarios) {
        const response = await fetch(`/api/usuarios?id=${usuario.id}`, {
          method: 'DELETE',
          credentials: 'include',
          cache: 'no-store',
          keepalive: true,
        });
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Não autenticado');
          } else if (response.status === 403) {
            throw new Error('Não autorizado');
          }
          throw new Error(`Falha ao excluir usuário: ${usuario.email || usuario.nome}`);
        }
      }
      setSuccess('Todos os usuários foram excluídos com sucesso.');
      // Recarregar a lista
      fetchUsuarios();
    } catch (err) {
      setError('Erro ao excluir usuários: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      if (err instanceof Error && err.message === 'Não autenticado') {
        setTimeout(() => {
          router.push('/auth/login');
        }, 100);
      }
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
          <Button onClick={() => router.push('/admin/usuarios/novo')}>
            Adicionar Usuário
          </Button>
        </div>

        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success">
            {success}
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Painel de Importação */}
          <Panel>
            <Panel.Header>
              <Panel.Title>Importar Usuários</Panel.Title>
              <Panel.Description>
                Importe usuários a partir de um arquivo Excel
              </Panel.Description>
            </Panel.Header>
            <Panel.Content>
              <ImportExcel onSuccess={fetchUsuarios} />
            </Panel.Content>
          </Panel>

          {/* Painel de Listagem */}
          <Panel>
            <Panel.Header>
              <Panel.Title>Lista de Usuários</Panel.Title>
              <div className="flex gap-2 ml-auto">
                <ExportarUsuarios usuarios={usuarios} />
                <Button variant="danger" onClick={handleDeleteAll} disabled={loading || usuarios.length === 0}>
                  Apagar Todos
                </Button>
                <Button
                  onClick={() => router.push('/admin/usuarios/novo')}
                >
                  Adicionar Usuário
                </Button>
              </div>
            </Panel.Header>
            <Panel.Content>
              {loading ? (
                <div className="text-center py-4">Carregando...</div>
              ) : (
                <UsuariosTable
                  data={usuarios}
                  onEdit={(usuario) => router.push(`/admin/usuarios/${usuario.id}`)}
                  onDelete={handleDelete}
                />
              )}
            </Panel.Content>
          </Panel>
        </div>
      </div>
    </AdminLayout>
  );
}