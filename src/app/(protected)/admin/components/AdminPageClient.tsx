'use client';

import { useCleanRscParams } from '@/hooks/useCleanRscParams';
import AdminLinks from './AdminLinks';
import AdminReports from './AdminReports';
import AdminLoginStats from '@/components/AdminLoginStats';
import AdminHeaderUser from '@/components/AdminHeaderUser';
import OnlineUsersDisplay from '@/components/OnlineUsersDisplay';
import AdminUIBlocks from './AdminUIBlocks';
import ProgramManager from '@/components/admin/ProgramManager';
import AdminLogo from './AdminLogo';
import AdminGlobalChat from './AdminGlobalChat';

export default function AdminPageClient() {
  // Limpa parâmetros RSC da URL
  useCleanRscParams();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Painel Administrativo
            </h1>
            <div className="flex items-center gap-4">
              <AdminHeaderUser />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Controles */}
          <div className="lg:w-80 flex-shrink-0 space-y-6">
            {/* Navegação */}
            <div className="bg-white overflow-hidden shadow-sm rounded-lg divide-y divide-gray-200">
              <div className="p-4">
                <h2 className="text-lg font-medium text-gray-900">Navegação</h2>
                <nav className="mt-4 space-y-2">
                  <a
                    href="/admin/dashboard"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50"
                  >
                    <svg className="mr-3 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 11a1 1 0 011-1h4a1 1 0 011 1v5H3a1 1 0 01-1-1v-4zM9 4a1 1 0 011-1h7a1 1 0 011 1v12a1 1 0 01-1 1h-7V4zM7 6a1 1 0 00-1-1H3a1 1 0 00-1 1v2h5V6z" />
                    </svg>
                    Dashboard
                  </a>
                  <a
                    href="/admin"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-900 rounded-md bg-gray-100"
                  >
                    <svg className="mr-3 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                    Painel Principal
                  </a>
                  <a
                    href="/admin/relatorios"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50"
                  >
                    <svg className="mr-3 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm4-1a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-2-2a1 1 0 10-2 0v5a1 1 0 102 0V9z" clipRule="evenodd" />
                    </svg>
                    Relatórios
                  </a>
                  <a
                    href="/admin/usuarios"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50"
                  >
                    <svg className="mr-3 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    Usuários
                  </a>
                </nav>
              </div>
            </div>

            {/* Métricas Rápidas */}
            <div className="space-y-4">
              {/* Logins/Logouts Hoje */}
              <AdminLoginStats />
            </div>

            {/* Gerenciamento de Logo */}
            <AdminLogo />

            {/* Gerenciamento de Programação */}
            <div className="bg-white overflow-hidden shadow-sm rounded-lg divide-y divide-gray-200">
              <div className="p-4">
                <ProgramManager />
              </div>
            </div>

            {/* Gerenciamento de Links */}
            <div className="bg-white overflow-hidden shadow-sm rounded-lg divide-y divide-gray-200">
              <div className="p-4">
                <h2 className="text-lg font-medium text-gray-900">Links</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Gerencie os links de transmissão e programação
                </p>
              </div>
              <div className="p-4">
                <AdminLinks />
              </div>
            </div>

            {/* UI Header/Footer */}
            <div className="bg-white overflow-hidden shadow-sm rounded-lg divide-y divide-gray-200">
              <div className="p-4">
                <h2 className="text-lg font-medium text-gray-900">Header e Footer</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Gerencie o conteúdo do header e footer do Login e da Transmissão
                </p>
              </div>
              <div className="p-4">
                <AdminUIBlocks />
              </div>
            </div>

            {/* Relatórios */}
            <div className="bg-white overflow-hidden shadow-sm rounded-lg divide-y divide-gray-200">
              <div className="p-4">
                <h2 className="text-lg font-medium text-gray-900">Relatórios</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Exporte relatórios de acesso
                </p>
              </div>
              <div className="p-4">
                <AdminReports />
              </div>
            </div>
          </div>

          {/* Main Content - Online Users Area + Global Chat */}
          <div className="flex-1 bg-white shadow-sm rounded-lg overflow-hidden min-h-[800px]">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">
                  Usuários Online (tempo real)
                </h3>
              </div>
              {/* Content */}
              <div className="flex-1 p-4 overflow-auto space-y-6">
                <OnlineUsersDisplay />
                <div className="pt-2 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Bate Papo</h3>
                  <AdminGlobalChat />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}