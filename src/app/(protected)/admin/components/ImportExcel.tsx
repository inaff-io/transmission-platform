'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';

export default function ImportExcel() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setStatus({ type: 'info', message: 'Processando arquivo...' });

      // Lê o arquivo Excel
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Envia para a API
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
        throw new Error(result.error || 'Erro ao importar dados');
      }

      // Mostra resultado
      setStatus({
        type: 'success',
        message: `${result.message}${
          result.results.errors.length
            ? `\nErros encontrados: ${result.results.errors.length}`
            : ''
        }`,
      });

      // Se houver erros, mostra em console para debug
      if (result.results.errors.length) {
        console.log('Erros na importação:', result.results.errors);
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: `Erro: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsLoading(false);
      // Limpa o input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label
          htmlFor="excel-upload"
          className={`cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Importando...' : 'Importar Excel'}
          <input
            id="excel-upload"
            type="file"
            className="hidden"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            disabled={isLoading}
          />
        </label>

        {isLoading && (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
        )}
      </div>

      {status.type && (
        <div
          className={`mt-4 p-4 rounded-md ${
            status.type === 'success'
              ? 'bg-green-50 text-green-800'
              : status.type === 'error'
              ? 'bg-red-50 text-red-800'
              : 'bg-blue-50 text-blue-800'
          }`}
        >
          <p className="whitespace-pre-line">{status.message}</p>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <h4 className="font-medium mb-2">Formato esperado do Excel:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>nome (obrigatório)</li>
          <li>email (obrigatório)</li>
          <li>cpf (obrigatório)</li>
          <li>categoria (opcional, padrão: &apos;user&apos;)</li>
        </ul>
      </div>
    </div>
  );
}