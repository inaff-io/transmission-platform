import pkg from '@supabase/supabase-js';
const { createClient } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente
dotenv.config();

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

async function main() {
  try {
    console.log('Conectando ao banco de dados...');
    const supabase = createAdminClient();

    console.log('Lendo arquivo SQL...');
    const sqlContent = fs.readFileSync(
      path.join(__dirname, 'create-exec-sql-function.sql'),
      'utf8'
    );

    console.log('Executando SQL...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    }).select();

    if (error) {
      // Se a função não existe, vamos criar usando uma query direta
      if (error.code === 'PGRST202') {
        console.log('Função exec_sql não existe, criando via query...');
        const { error: createError } = await supabase.from('_exec_sql').select('*').limit(1);
        
        if (createError?.message?.includes('relation "_exec_sql" does not exist')) {
          const { error: queryError } = await supabase
            .from('_raw_sql')
            .select('*')
            .eq('query', sqlContent)
            .single();

          if (queryError) {
            throw queryError;
          }
          
          console.log('Função exec_sql criada com sucesso!');
        } else {
          throw createError;
        }
      } else {
        throw error;
      }
    }

    console.log('Operação concluída com sucesso!');
  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  }
}

main();