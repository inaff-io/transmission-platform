'use client';

import { useState } from 'react';
import { format } from 'date-fns';

type RelatorioTipo = 'acessos' | 'sessoes' | 'usuarios';

interface RelatorioProps {
  tipo: RelatorioTipo;
  titulo: string;
  descricao: string;
}

const RELATORIOS: RelatorioProps[] = [
  {
    tipo: 'acessos',
    titulo: 'Histórico de Acessos',
    descricao: 'Exporta o registro detalhado de todos os acessos, incluindo login, logout e heartbeats.'
  },
  {
    tipo: 'sessoes',
    titulo: 'Sessões de Usuários',
    descricao: 'Exporta as informações de todas as sessões, incluindo duração e timestamps.'
  },
  {
    tipo: 'usuarios',
    titulo: 'Lista de Usuários',
    descricao: 'Exporta a lista completa de usuários ativos com suas informações principais.'
  }
];

export default function ExportarRelatorios() {
  const [loading, setLoading] = useState<string | null>(null);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [error, setError] = useState<string | null>(null);

  const exportarRelatorio = async (tipo: RelatorioTipo) => {
    try {
      setLoading(tipo);
      setError(null);

      // Construir URL com parâmetros de data se fornecidos
      let url = `/api/relatorios?tipo=${tipo}`;
      if (dataInicio && dataFim) {
        url += `&dataInicio=${dataInicio}&dataFim=${dataFim}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Erro ao gerar relatório');
      }

      // Obter o blob do CSV
      const blob = await response.blob();
      
      // Criar URL do blob
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Criar link temporário e clicar nele
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `relatorio-${tipo}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpar URL do blob
      window.URL.revokeObjectURL(downloadUrl);

    } catch (err) {
      console.error('Erro ao exportar relatório:', err);
      setError('Falha ao gerar relatório. Tente novamente.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Exportar Relatórios
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Selecione um período opcional e escolha o tipo de relatório para exportar.
        </p>
      </div>

      <div className="px-4 py-4 sm:px-6">
        {/* Filtro de Datas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="dataInicio" className="block text-sm font-medium text-gray-700">
              Data Início
            </label>
            <input
              type="date"
              id="dataInicio"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="dataFim" className="block text-sm font-medium text-gray-700">
              Data Fim
            </label>
            <input
              type="date"
              id="dataFim"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Lista de Relatórios */}
        <div className="space-y-4">
          {RELATORIOS.map((relatorio) => (
            <div
              key={relatorio.tipo}
              className="relative border rounded-lg p-4 hover:border-indigo-500 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-base font-medium text-gray-900">
                    {relatorio.titulo}
                  </h4>
                  <p className="mt-1 text-sm text-gray-500">
                    {relatorio.descricao}
                  </p>
                </div>
                <button
                  onClick={() => exportarRelatorio(relatorio.tipo)}
                  disabled={!!loading}
                  className="ml-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                >
                  {loading === relatorio.tipo ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Exportando...
                    </>
                  ) : (
                    <>
                      <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Exportar
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
