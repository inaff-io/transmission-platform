import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing Supabase envs. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    global: {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    },
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const suffix = Date.now();
  const nome = process.argv[2] || `Usuário Teste ${suffix}`;
  const email = process.argv[3] || `usuario.teste+${suffix}@example.com`;
  const cpf = process.argv[4] || String(10000000000 + Math.floor(Math.random() * 89999999999));

  console.log('Creating user:', { nome, email, cpf });

  // Insert minimal known columns to avoid remote schema drift issues
  const { data, error } = await supabase
    .from('usuarios')
    .insert({ nome, email, cpf })
    .select('*')
    .single();

  if (error) {
    console.error('Insert error:', error);
    process.exit(1);
  }

  console.log('User created:', data);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
