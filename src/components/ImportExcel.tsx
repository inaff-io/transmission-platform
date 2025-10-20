'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';

interface ImportExcelProps {
  onSuccess?: () => Promise<void>;
}

export default function ImportExcel({ onSuccess }: ImportExcelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setMessage('');
      setIsError(false);

      // Lê o arquivo Excel usando arrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      // Envia os dados para a API
      const response = await fetch('/api/admin/import-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        keepalive: true,
        body: JSON.stringify({ data: jsonData }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Erro ao importar dados');
      }

      // Monta mensagem detalhada
      let successMessage = result.message || 'Dados importados com sucesso!';
      if (result.results) {
        successMessage += `\n✅ ${result.results.success} usuário(s) importado(s)`;
        if (result.results.errors && result.results.errors.length > 0) {
          successMessage += `\n⚠️ ${result.results.errors.length} erro(s):\n`;
          successMessage += result.results.errors.slice(0, 5).join('\n');
          if (result.results.errors.length > 5) {
            successMessage += `\n... e mais ${result.results.errors.length - 5} erro(s)`;
          }
        }
      }

      setMessage(successMessage);
      setIsError(result.results?.errors?.length > 0 && result.results.success === 0);
      if (onSuccess) await onSuccess();
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      setMessage(error instanceof Error ? error.message : 'Erro ao processar arquivo');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Importar Dados (Excel)</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="excel-file-input" className="block text-sm font-medium text-gray-700 mb-2">
            Selecione o arquivo Excel (.xlsx)
          </label>
          <input
            id="excel-file-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            disabled={isLoading}
            aria-label="Selecione o arquivo Excel para importar usuários"
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {isLoading && (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            <span className="ml-2">Processando...</span>
          </div>
        )}

        {message && (
          <div
            className={`rounded-md ${
              isError ? 'bg-red-50' : 'bg-green-50'
            } p-4`}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                {isError ? (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${isError ? 'text-red-800' : 'text-green-800'}`}>
                  {message}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          <h3 className="font-medium mb-2">Instruções:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>O arquivo deve estar no formato .xlsx</li>
            <li>A primeira linha deve conter os cabeçalhos das colunas</li>
            <li>As colunas necessárias são: nome, email, cpf</li>
            <li>A coluna categoria é opcional (padrão: user)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}