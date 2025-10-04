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
  console.error('Usage: node scripts/check-user.mjs <email>');
  process.exit(1);
}
(async () => {
  try {
    const supabase = createClient(url, service);
    const { data, error } = await supabase.from('usuarios').select('*').eq('email', email.toLowerCase());
    if (error) {
      console.error('Query error:', error);
      process.exit(1);
    }
    console.log('User rows:', data);
  } catch (e) {
    console.error('Fatal script error:', e);
    process.exit(1);
  }
})();
