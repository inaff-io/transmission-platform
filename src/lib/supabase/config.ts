import { createClient } from '@supabase/supabase-js';

export const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error('Missing public Supabase envs:', { hasUrl: !!url, hasKey: !!anonKey });
    throw new Error('Missing Supabase public credentials');
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true,
    },
    db: {
      schema: 'public',
    },
  });
};
