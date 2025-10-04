import { createClient } from '@supabase/supabase-js'

const requiredEnvs = {
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY
}

for (const [key, value] of Object.entries(requiredEnvs)) {
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`)
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const createAdminClient = () => {
  try {
    console.log('Creating admin client with:', {
      url: supabaseUrl,
      serviceKey: supabaseServiceKey?.slice(0, 10) + '...'
    });

    // Criando o cliente admin com configurações específicas
    const client = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });

    // Função auxiliar para preparar a consulta como admin (headers já configurados via client)
    const adminQuery = () => client.from('usuarios');

    return {
      getUser: async (email: string) => {
        const { data, error } = await adminQuery()
          .select('*')
          .eq('email', email)
          .single();
        return { data, error };
      },
      listUsers: async () => {
        const { data, error } = await adminQuery()
          .select('*');
        return { data, error };
      }
    };
  } catch (error) {
    console.error('Error creating Supabase admin client:', error);
    throw new Error('Failed to create Supabase admin client');
  }
}
