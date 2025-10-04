'use client';

import { useEffect } from 'react';

export function useCleanRscParams() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const hasRscParams = url.searchParams.has('_rsc') || url.searchParams.has('_vercel_rsc');

    if (hasRscParams) {
      url.searchParams.delete('_rsc');
      url.searchParams.delete('_vercel_rsc');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);
}

export function cleanRscParamsFromUrl(urlString: string): string {
  try {
    const url = new URL(urlString, window.location.origin);
    url.searchParams.delete('_rsc');
    url.searchParams.delete('_vercel_rsc');
    return url.pathname + url.search;
  } catch (error) {
    console.error('Error cleaning RSC params:', error);
    return urlString;
  }
}