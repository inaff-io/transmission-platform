import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !service) {
  console.error('Missing Supabase env vars', { urlPresent: !!url, servicePresent: !!service });
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/make-admin.mjs <email>');
  process.exit(1);
}

(async () => {
  try {
    const supabase = createClient(url, service);
    const { data: before, error: beforeErr } = await supabase.from('usuarios').select('*').eq('email', email.toLowerCase());
    console.log('Before:', before, beforeErr ? beforeErr.message : '');

    const { data, error } = await supabase
      .from('usuarios')
      .update({ categoria: 'admin' })
      .eq('email', email.toLowerCase())
      .select('*')
      .single();

    if (error) {
      console.error('Update error:', error);
      process.exit(1);
    }
    if (!data) {
      console.error('User not found');
      process.exit(1);
    }
    console.log('Updated user to admin:', { id: data.id, email: data.email, categoria: data.categoria });
  } catch (e) {
    console.error('Fatal script error:', e);
    process.exit(1);
  }
})();
