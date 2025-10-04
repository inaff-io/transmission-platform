'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DatabaseTest() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const testConnection = async () => {
      const supabase = createClient();
      
      try {
        // Tenta buscar as abas para testar a conexão
        const { data, error } = await supabase
          .from('abas')
          .select('*')
          .limit(1);
        
        if (error) throw error;
        
        setStatus('connected');
        setError(null);
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      }
    };
    
    testConnection();
  }, []);
  
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Status do Banco de Dados</h2>
      <div className={`
        p-3 rounded-lg
        ${status === 'loading' ? 'bg-yellow-100 text-yellow-800' : ''}
        ${status === 'connected' ? 'bg-green-100 text-green-800' : ''}
        ${status === 'error' ? 'bg-red-100 text-red-800' : ''}
      `}>
        {status === 'loading' && 'Testando conexão...'}
        {status === 'connected' && 'Conectado com sucesso!'}
        {status === 'error' && `Erro de conexão: ${error}`}
      </div>
    </div>
  );
}
