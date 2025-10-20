'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function InscricaoPage() {
  const router = useRouter();
  const [isLogoLoaded, setIsLogoLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Formata CPF enquanto digita
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setFormData({ ...formData, cpf: formatted });
  };

  const validateForm = () => {
    // Valida nome
    if (formData.nome.trim().length < 3) {
      setError('Nome deve ter pelo menos 3 caracteres');
      return false;
    }

    // Valida email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email inválido');
      return false;
    }

    // Valida CPF (apenas 11 dígitos)
    const cpfNumbers = formData.cpf.replace(/\D/g, '');
    if (cpfNumbers.length !== 11) {
      setError('CPF deve conter 11 dígitos');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/inscricao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: formData.nome.trim(),
          email: formData.email.toLowerCase().trim(),
          cpf: formData.cpf.replace(/\D/g, ''), // Remove formatação
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao realizar inscrição');
      }

      setSuccess('Inscrição realizada com sucesso! Você receberá mais informações por email.');
      
      // Limpa o formulário
      setFormData({
        nome: '',
        email: '',
        cpf: '',
      });

      // Redireciona para página de login após 3 segundos
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao realizar inscrição');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Logo Section - Imagem panorâmica completa */}
      <div className="w-full bg-white py-4">
        <div className="w-full flex justify-center items-center px-4">
          {/* Mobile: largura completa com altura ajustada */}
          <div className="relative w-full h-24 sm:hidden">
            {!isLogoLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            )}
            <Image
              src="/logo-evento.png"
              alt="Logo do Evento"
              className={`object-contain transition-opacity duration-300 ${
                isLogoLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              fill
              priority
              quality={100}
              sizes="100vw"
              onLoad={() => setIsLogoLoaded(true)}
            />
          </div>
          
          {/* Tablet: largura completa com altura maior */}
          <div className="hidden sm:block md:hidden relative w-full h-32">
            {!isLogoLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            )}
            <Image
              src="/logo-evento.png"
              alt="Logo do Evento"
              className={`object-contain transition-opacity duration-300 ${
                isLogoLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              fill
              priority
              quality={100}
              sizes="100vw"
              onLoad={() => setIsLogoLoaded(true)}
            />
          </div>
          
          {/* Desktop: largura máxima com altura proporcional */}
          <div className="hidden md:block relative w-full max-w-6xl h-48 lg:h-56">
            {!isLogoLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            )}
            <Image
              src="/logo-evento.png"
              alt="Logo do Evento"
              className={`object-contain transition-opacity duration-300 ${
                isLogoLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              fill
              priority
              quality={100}
              sizes="(max-width: 1024px) 100vw, 1152px"
              onLoad={() => setIsLogoLoaded(true)}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Inscrição
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Preencha o formulário abaixo para se inscrever no evento
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-8 sm:px-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nome */}
                <div>
                  <label 
                    htmlFor="nome" 
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-900"
                    placeholder="Digite seu nome completo"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Email */}
                <div>
                  <label 
                    htmlFor="email" 
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-900"
                    placeholder="seu.email@exemplo.com"
                    disabled={isSubmitting}
                  />
                </div>

                {/* CPF */}
                <div>
                  <label 
                    htmlFor="cpf" 
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    CPF <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="cpf"
                    name="cpf"
                    type="text"
                    required
                    value={formData.cpf}
                    onChange={handleCPFChange}
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-900"
                    placeholder="000.000.000-00"
                    maxLength={14}
                    disabled={isSubmitting}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Digite apenas os números do CPF
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg 
                          className="h-5 w-5 text-red-400" 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path 
                            fillRule="evenodd" 
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">
                          {error}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg 
                          className="h-5 w-5 text-green-400" 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path 
                            fillRule="evenodd" 
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">
                          {success}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <>
                        <svg 
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24"
                        >
                          <circle 
                            className="opacity-25" 
                            cx="12" 
                            cy="12" 
                            r="10" 
                            stroke="currentColor" 
                            strokeWidth="4"
                          />
                          <path 
                            className="opacity-75" 
                            fill="currentColor" 
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Enviando...
                      </>
                    ) : (
                      'Realizar Inscrição'
                    )}
                  </button>
                </div>

                {/* Login Link */}
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Já possui cadastro?{' '}
                    <a 
                      href="/auth/login" 
                      className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
                    >
                      Faça login aqui
                    </a>
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-6 py-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg 
                  className="h-5 w-5 text-blue-400" 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-blue-700">
                  Após realizar sua inscrição, você receberá um email com as instruções para acessar o evento.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
