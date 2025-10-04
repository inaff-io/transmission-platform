'use client';

import { FormEvent, ChangeEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';


export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);

  
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);
    try {
      if (!identifier) throw new Error('Digite email ou CPF');
      const isEmail = identifier.includes('@');
      const cleanedCpf = isEmail ? '' : identifier.replace(/\D/g, '');
      if (!isEmail && cleanedCpf.length !== 11) throw new Error('CPF inválido');
      if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) throw new Error('Email inválido');

      const res = await fetch('/api/auth/login/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          email: isEmail ? identifier : undefined,
          cpf: isEmail ? undefined : cleanedCpf,
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || data?.error || 'Erro ao fazer login');

      // Adiciona um pequeno delay antes do redirecionamento
      const target = data?.redirectUrl || '/admin';
      setTimeout(() => {
        router.replace(target);
      }, 100);
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : 'Erro ao processar');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setIdentifier(e.target.value);
    setMessage('');
    setIsError(false);
  };

  // Se já autenticado como admin, redireciona imediatamente
  useEffect(() => {
    let cancelled = false;
    let timeoutId: NodeJS.Timeout;

    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { 
          credentials: 'include',
          cache: 'no-store'
        });
        
        if (!res.ok) return;
        
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return;
        
        let user: any = null;
        try { 
          user = await res.json(); 
        } catch { 
          user = null; 
        }
        
        if (!cancelled && user?.categoria === 'admin') {
          // Adiciona um pequeno delay antes do redirecionamento
          timeoutId = setTimeout(() => {
            router.replace('/admin');
          }, 100);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
      }
    };

    checkAuth();

    return () => { 
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Login Administrador</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Acesso restrito</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input
            type="text"
            value={identifier}
            onChange={handleChange}
            placeholder="Email ou CPF"
            className="w-full border rounded px-3 py-2"
            disabled={loading}
          />
          {message && (
            <div className={`text-sm ${isError ? 'text-red-600' : 'text-green-600'}`}>{message}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded py-2 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
