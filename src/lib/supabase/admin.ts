import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const createAdminClient = () => {
  // Logs opcionais (defina DEBUG_SUPABASE=1 para ver)
  const DEBUG = process.env.DEBUG_SUPABASE === '1';
  if (DEBUG) {
    console.log('Creating admin client with:', {
      url: supabaseUrl,
      serviceKeyPrefix: supabaseServiceKey?.slice(0, 6) + '...'
    });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials:', { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseServiceKey 
    });
    throw new Error('Missing Supabase credentials');
  }

  try {
    const client = createClient(supabaseUrl, supabaseServiceKey, {
      db: {
        schema: 'public'
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          // Garantir que estamos usando a chave de serviço
          'x-client-info': '@supabase/auth-helpers-nextjs',
          'x-supabase-auth-type': 'service_role'
        }
      }
    });

    return client;
  } catch (error) {
    console.error('Error creating Supabase admin client:', error);
    throw new Error('Failed to create Supabase admin client');
  }
}
