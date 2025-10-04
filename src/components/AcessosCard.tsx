'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type HistoricoAcesso = {
  id: string;
  acao: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
};

type Estatisticas = {
  tempoTotalHoje: number;
  tempoTotalSemana: number;
  numeroSessoesHoje: number;
  numeroSessoesSemana: number;
};

// Função para formatar tempo em horas e minutos
const formatarTempo = (segundos: number) => {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  return `${horas}h ${minutos}m`;
};

export default function AcessosCard() {
  const [historico, setHistorico] = useState<HistoricoAcesso[]>([]);
  const [stats, setStats] = useState<Estatisticas | null>(null);
  const [loading, setLoading] = useState(true);

  const carregarDados = async () => {
    try {
      const [historicoRes, statsRes] = await Promise.all([
        fetch('/api/usuarios/stats?tipo=historico', { credentials: 'include', keepalive: true, cache: 'no-store' }),
        fetch('/api/usuarios/stats?tipo=estatisticas', { credentials: 'include', keepalive: true, cache: 'no-store' })
      ]);

      if (!historicoRes.ok || !statsRes.ok) {
        throw new Error('Falha ao carregar dados');
      }

      const historicoData = await historicoRes.json();
      const statsData = await statsRes.json();

      setHistorico(historicoData.data);
      setStats(statsData.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
    // Atualiza os dados a cada 2 minutos
    const interval = setInterval(carregarDados, 120000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card de Estatísticas */}
      {stats && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Estatísticas de Acesso
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Tempo Online Hoje</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatarTempo(stats.tempoTotalHoje)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Tempo Online na Semana</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatarTempo(stats.tempoTotalSemana)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Sessões Hoje</p>
              <p className="text-xl font-semibold text-gray-900">
                {stats.numeroSessoesHoje}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Sessões na Semana</p>
              <p className="text-xl font-semibold text-gray-900">
                {stats.numeroSessoesSemana}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Histórico */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900">
            Histórico de Acessos
          </h3>
        </div>
        <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {historico.map((acesso) => (
            <li key={acesso.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {acesso.acao === 'login' && '🟢 Login'}
                    {acesso.acao === 'logout' && '🔴 Logout'}
                    {acesso.acao === 'heartbeat' && '💓 Ativo'}
                  </p>
                  {acesso.ip && (
                    <p className="text-sm text-gray-500">IP: {acesso.ip}</p>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(acesso.createdAt), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </p>
              </div>
            </li>
          ))}
          {historico.length === 0 && (
            <li className="px-4 py-4 text-center text-gray-500">
              Nenhum registro encontrado
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
