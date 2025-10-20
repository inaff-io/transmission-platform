import { createClient } from '@supabase/supabase-js';

export function createClientFromHeaders(headers: Headers) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Prefer publishable default, but fall back to standard ANON if provided
  const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    console.error('Supabase envs missing in middleware:', { hasUrl: !!url, hasAnon: !!anon });
    throw new Error('Supabase envs not configured');
  }

  return createClient(url, anon, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: headers.get('Authorization') || '',
      },
    },
  });
}