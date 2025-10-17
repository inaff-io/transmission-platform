"use client";

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Banner from '@/components/Banner';
import UIBlock from '@/components/UIBlock';
import ThemeToggle from '@/components/ui/ThemeToggle';
import HelpButton from '@/components/ui/HelpButton';
import { useEffect, useState, useCallback } from 'react';
import type { Usuario } from '@/types/database';

// MVVM-like view models
interface ThumbnailViewModelImage {
  title: string;
  subtitle: string;
  imageUrl: string;
  href: string;
}

interface HubReprisesViewModel {
  thumbnails: ThumbnailViewModelImage[];
}

function createHubVM(): HubReprisesViewModel {
  return {
    thumbnails: [
      {
        title: 'Reprise — 16',
        subtitle: '16/10',
        imageUrl: '/16.10.png',
        href: '/reprise/16',
      },
      {
        title: 'Reprise — 17',
        subtitle: '17/10',
        imageUrl: '/17.10.png',
        href: '/reprise/17',
      },
    ],
  };
}

export default function HubReprisesPage() {
  const router = useRouter();
  const vm = createHubVM();
  const [user, setUser] = useState<Usuario | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store', credentials: 'include', keepalive: true })
      .then(async (r) => {
        if (!r.ok) return;
        const me = await r.json();
        setUser(me as Usuario);
      })
      .catch(() => {});
  }, []);

  const handleLogout = useCallback(() => {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include', keepalive: true })
      .catch(() => {})
      .finally(() => {
        router.replace('/auth/login');
      });
  }, [router]);

  const userInitial = (user?.nome || '').trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <Banner 
        imageUrl="/logo-evento.png" 
        overlayOpacityClass="bg-transparent" 
        title="" 
        subtitle="" 
        heightClass="h-[180px] sm:h-[240px] md:h-[300px] lg:h-[360px] xl:h-[420px]"
        backgroundClass="p-2 sm:p-3 md:p-4 bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-b border-gray-200"
        fullBleed={false}
      />
      {/* Proteção de clique na área superior (compartilhamento) */}
      <div className="pointer-events-none select-none">
        <UIBlock block="login_header" className="w-full" />
      </div>

      <header className="bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Início das Reprises</h1>
              <div className="hidden sm:flex items-center gap-4">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold">
                  {userInitial}
                </span>
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Usuário: </span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{user?.nome}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">E-mail: </span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{user?.email}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <HelpButton />
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700"
                title="Sair"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex-1 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {vm.thumbnails.map((thumb) => (
            <button
              key={thumb.href}
              onClick={() => router.push(thumb.href)}
              className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex flex-col"
              aria-label={`${thumb.title} — ${thumb.subtitle}`}
            >
              <div className="relative w-full aspect-video">
                <Image
                  src={thumb.imageUrl}
                  alt={thumb.title}
                  fill
                  unoptimized
                  className="object-contain bg-white"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={false}
                />
                <></>
              </div>
              <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                <div>
                  <div className="text-gray-900 dark:text-gray-100 text-sm sm:text-base font-semibold">{thumb.title}</div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">{thumb.subtitle}</div>
                </div>
                <div className="text-gray-900 dark:text-gray-100 text-xl sm:text-2xl transform group-hover:scale-110 transition-transform" aria-hidden>
                  ▶️
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>

      <UIBlock block="transmissao_footer" className="w-full mt-auto" />
    </div>
  );
}