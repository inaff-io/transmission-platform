'use client';

import { FormEvent, ChangeEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UIBlock from '@/components/UIBlock';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [redirectTimeout, setRedirectTimeout] = useState<NodeJS.Timeout | null>(null);

  // RSC params são limpos no middleware na borda, evitando aborts no cliente

  // Limpa o timeout quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, [redirectTimeout]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    try {

      if (!identifier) {
        throw new Error('Por favor, digite seu e-mail ou CPF');
      }

      // Valida entrada
      const isEmail = identifier.includes('@');
      const cleanedCpf = isEmail ? '' : identifier.replace(/\D/g, '');

      if (!isEmail && cleanedCpf.length !== 11) {
        throw new Error('CPF inválido. Digite os 11 números do CPF');
      }

      if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.exec(identifier)) {
        throw new Error('Email inválido. Digite um email válido');
      }

      // Chama API de login (servidor valida e seta cookie httpOnly)
      const res = await fetch('/api/auth/login/user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          email: isEmail ? identifier : undefined,
          cpf: isEmail ? undefined : cleanedCpf,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(data?.message || 'Usuário não encontrado. Verifique suas credenciais.');
        }
        throw new Error(data?.error || 'Erro ao fazer login');
      }

      // Usa redirectUrl retornada pela API ou fallback para /transmission
      const redirectTo = data?.redirectUrl || '/transmission';
      
      // Limpa o timeout anterior se existir
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
      
      // Remove parâmetros RSC da URL de redirecionamento
      const targetUrl = new URL(redirectTo, window.location.origin);
      targetUrl.searchParams.delete('_rsc');
      targetUrl.searchParams.delete('_vercel_rsc');
      
      // Adiciona um pequeno atraso antes do redirecionamento
      const newRedirectTimeout = setTimeout(() => {
        router.replace(targetUrl.pathname + targetUrl.search, { scroll: false });
      }, 200);
      
      setRedirectTimeout(newRedirectTimeout);

    } catch (error) {
      console.error('Erro detalhado:', error);
      setIsError(true);
      setMessage(error instanceof Error ? error.message : 'Erro ao processar login');
    } finally {
      setLoading(false);
    }
  };

  const handleIdentifierChange = (e: ChangeEvent<HTMLInputElement>) => {
    setIdentifier(e.target.value);
    setMessage('');
    setIsError(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Managed Header */}
      <UIBlock block="login_header" className="w-full" />
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Acesse sua conta
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Digite seu e-mail ou CPF para acessar
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="identifier" className="sr-only">
                Email ou CPF
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Digite seu email ou CPF"
                value={identifier}
                onChange={handleIdentifierChange}
                disabled={loading}
              />
            </div>

            {message && (
              <div className={`rounded-md ${isError ? 'bg-red-50' : 'bg-green-50'} p-4`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {isError ? (
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${isError ? 'text-red-800' : 'text-green-800'}`}>
                      {message}
                    </h3>
                    {isError && (
                      <div className="mt-2 text-sm text-red-700">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Certifique-se de que digitou corretamente</li>
                          <li>Se o problema persistir, entre em contato com o administrador</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Processando...' : 'Entrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
      {/* Managed Footer */}
      <UIBlock block="login_footer" className="w-full mt-auto" />
    </div>
  );
}
