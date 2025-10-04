'use client';

import { useState, useEffect } from 'react';

interface ProgramManagerProps {
  onProgramUpdate?: (url: string) => void;
}

export default function ProgramManager({ onProgramUpdate }: ProgramManagerProps) {
  const [programUrl, setProgramUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (programUrl) {
      onProgramUpdate?.(programUrl);
    }
  }, [programUrl, onProgramUpdate]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setProgramUrl(url);
  };

  const handleUpdateProgram = async () => {
    if (!programUrl) return;
    
    setIsUpdating(true);
    try {
      // Simular atualização da programação
      await new Promise(resolve => setTimeout(resolve, 800));
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Erro ao atualizar programação:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearProgram = () => {
    setProgramUrl('');
    setLastUpdated(null);
  };

  const renderIframe = () => {
    if (!programUrl) return null;

    return (
      <iframe
        src={programUrl}
        width="560"
        height="400"
        title="Program Schedule"
        className="w-full rounded-lg shadow-lg border-0"
      />
    );
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return null;
    
    return lastUpdated.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">📋</span>
        <h2 className="text-xl font-bold text-blue-800">Gerenciador de Programação</h2>
        {lastUpdated && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
            Atualizado
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="program-url" className="block text-sm font-medium text-blue-700 mb-2">
            URL Programação
          </label>
          <input
            id="program-url"
            type="url"
            value={programUrl}
            onChange={handleUrlChange}
            placeholder="https://exemplo.com/programacao"
            className="w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleUpdateProgram}
            disabled={!programUrl || isUpdating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? 'Atualizando...' : 'Atualizar Programação'}
          </button>
          
          {programUrl && (
            <button
              onClick={handleClearProgram}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Limpar
            </button>
          )}
        </div>

        {lastUpdated && (
          <div className="text-sm text-blue-600">
            <span className="font-medium">Última atualização:</span> {formatLastUpdated()}
          </div>
        )}

        {programUrl && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-blue-700 mb-2">Pré-visualização da Programação</h3>
            <div className="bg-white rounded-lg overflow-hidden border border-blue-200">
              {renderIframe()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}