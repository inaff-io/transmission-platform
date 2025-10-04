'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCleanRscParams } from '@/hooks/useCleanRscParams';

export default function Home() {
  const router = useRouter();

  // Remove RSC parameters from URL when component mounts
  useCleanRscParams();

  useEffect(() => {
    router.push('/auth/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Redirecionando...</p>
    </div>
  );
}