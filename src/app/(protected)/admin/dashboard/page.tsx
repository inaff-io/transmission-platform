'use client';

import OnlineUsersDisplay from '@/components/OnlineUsersDisplay';
import AcessosCard from '@/components/AcessosCard';
import AdminHeaderUser from '@/components/AdminHeaderUser';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center gap-4">
              <a
                href="/transmission"
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
              >
                Ver Transmissão
              </a>
              <AdminHeaderUser />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar Navigation */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Navegação */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white overflow-hidden shadow-sm rounded-lg divide-y divide-gray-200">
              <div className="p-4">
                <h2 className="text-lg font-medium text-gray-900">Navegação</h2>
                <nav className="mt-4 space-y-2">
                  <a
                    href="/admin/dashboard"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-900 rounded-md bg-gray-100"
                  >
                    <svg className="mr-3 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 11a1 1 0 011-1h4a1 1 0 011 1v5H3a1 1 0 01-1-1v-4zM9 4a1 1 0 011-1h7a1 1 0 011 1v12a1 1 0 01-1 1h-7V4zM7 6a1 1 0 00-1-1H3a1 1 0 00-1 1v2h5V6z" />
                    </svg>
                    Dashboard
                  </a>
                  <a
                    href="/admin"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50"
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
                    href="/transmission"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50"
                  >
                    <svg className="mr-3 h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M16.24 7.76a6 6 0 010 8.48M19.07 4.93a10 10 0 010 14.14M7.76 16.24a6 6 0 010-8.48M4.93 19.07a10 10 0 010-14.14" />
                    </svg>
                    Transmissão
                  </a>
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content - Cards */}
          <div className="flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="col-span-1">
                <OnlineUsersDisplay />
              </div>
              <div className="col-span-1">
                <AcessosCard />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
