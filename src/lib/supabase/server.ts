import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const cookieStore = cookies();

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase envs for server client:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey,
    });
    throw new Error('Missing Supabase credentials');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'x-client-info': '@supabase/auth-helpers-nextjs',
      },
    },
  });
};