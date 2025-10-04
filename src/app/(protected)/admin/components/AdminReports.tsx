'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';

interface ReportStats {
  totalLogins: number;
  uniqueUsers: number;
  averageSessionTime: number;
}

export default function AdminReports() {
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ReportStats | null>(null);

  const calculateStats = (logins: any[]): ReportStats => {
    const uniqueUsers = new Set(logins.map(l => l.usuarios?.email)).size;
    const totalMinutes = logins.reduce((acc, login) => {
      return acc + (login.tempo_logado ? Math.round(login.tempo_logado / 60) : 0);
    }, 0);
    
    return {
      totalLogins: logins.length,
      uniqueUsers,
      averageSessionTime: uniqueUsers ? Math.round(totalMinutes / uniqueUsers) : 0
    };
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      setStats(null);

      if (!dateRange.start || !dateRange.end) {
        throw new Error('Selecione a data inicial e final');
      }

      const res = await fetch(`/api/admin/reports?start=${encodeURIComponent(dateRange.start)}&end=${encodeURIComponent(dateRange.end)}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao gerar relatório');
      }

      const { data: logins, debug } = await res.json();
      
      if (!logins || !Array.isArray(logins)) {
        throw new Error('Erro ao carregar dados do relatório');
      }

      if (logins.length === 0) {
        setStats({
          totalLogins: 0,
          uniqueUsers: 0,
          averageSessionTime: 0
        });
        throw new Error(`Nenhum acesso encontrado no período de ${new Date(dateRange.start).toLocaleDateString()} a ${new Date(dateRange.end).toLocaleDateString()}`);
      }

      // Calcula estatísticas
      const reportStats = calculateStats(logins);
      setStats(reportStats);

      // Formata dados para o Excel
      const reportData = logins.map((login) => ({
        'Nome': login.usuarios?.nome || '-',
        'E-mail': login.usuarios?.email || '-',
        'CPF': login.usuarios?.cpf || '-',
        'Categoria': login.usuarios?.categoria || '-',
        'Data/Hora Login': new Date(login.login_em).toLocaleString(),
        'Data/Hora Logout': login.logout_em ? new Date(login.logout_em).toLocaleString() : '-',
        'Tempo Logado (minutos)': login.tempo_logado ? Math.round(login.tempo_logado / 60) : 0,
        'IP': login.ip || '-',
        'Navegador': login.navegador || '-'
      }));

      // Cria planilha Excel
      const ws = XLSX.utils.json_to_sheet(reportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Relatório de Acessos');
      
      // Gera arquivo
      const fileName = `relatorio-acessos-${dateRange.start}-a-${dateRange.end}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      setError(null);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setError(error instanceof Error ? error.message : 'Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
            Data Inicial
          </label>
          <input
            type="date"
            id="startDate"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
            Data Final
          </label>
          <input
            type="date"
            id="endDate"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="bg-white rounded-lg shadow p-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {stats.totalLogins}
            </div>
            <div className="text-sm text-gray-500">Total de Acessos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {stats.uniqueUsers}
            </div>
            <div className="text-sm text-gray-500">Usuários Únicos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {stats.averageSessionTime}
            </div>
            <div className="text-sm text-gray-500">Média de Minutos por Usuário</div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={generateReport}
        disabled={!dateRange.start || !dateRange.end || loading}
        className="w-full inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Gerando Relatório...
          </>
        ) : (
          'Exportar Relatório'
        )}
      </button>
    </div>
  );
}
