import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !service) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const email = 'pecosta26@gmail.com';

(async () => {
  const supabase = createClient(url, service, {
    global: { headers: { apikey: service, Authorization: `Bearer ${service}` } },
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // show columns of usuarios first
  const { data: cols, error: colsErr } = await supabase.rpc('pg_table_def', {});
  if (colsErr) {
    console.log('Skipping column list RPC (not defined)');
  }

  const { data: before } = await supabase.from('usuarios').select('*').eq('email', email.toLowerCase());
  console.log('Before:', before);

  const { data, error } = await supabase
    .from('usuarios')
    .update({ categoria: 'admin' })
    .eq('email', email.toLowerCase())
    .select('*');
  if (error) {
    console.error('Update error:', error);
    process.exit(1);
  }
  console.log('After update:', data);
})();
