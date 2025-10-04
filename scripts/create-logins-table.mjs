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
      path.join(__dirname, 'create-logins-table.sql'),
      'utf8'
    );

    console.log('Executando SQL...');
    const { error } = await supabase.from('logins').select('id').limit(1);
    
    if (error?.code === 'PGRST205') {
      console.log('Tabela logins não existe, criando...');
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: sqlContent
      });
      
      if (createError) {
        throw createError;
      }
      
      console.log('Tabela logins criada com sucesso!');
      
      // Verifica se a tabela foi criada
      const { error: checkError } = await supabase.from('logins').select('id').limit(1);
      if (checkError) {
        throw checkError;
      }
      
      console.log('Verificação concluída: tabela logins está acessível.');
    } else if (error) {
      throw error;
    } else {
      console.log('Tabela logins já existe.');
    }

  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  }
}

main();