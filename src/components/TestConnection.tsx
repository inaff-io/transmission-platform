'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function TestConnection() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      const supabase = createClient();
      try {
        const { data, error } = await supabase
          .from('abas')
          .select('*')
          .limit(1);

        if (error) throw error;
        setStatus('connected');
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    testConnection();
  }, []);

  return (
    <div className={`p-4 rounded-lg ${
      status === 'loading' ? 'bg-yellow-100 text-yellow-800' :
      status === 'connected' ? 'bg-green-100 text-green-800' :
      'bg-red-100 text-red-800'
    }`}>
      {status === 'loading' && 'Testando conexão...'}
      {status === 'connected' && 'Conectado ao banco de dados!'}
      {status === 'error' && `Erro: ${error}`}
    </div>
  );
}
