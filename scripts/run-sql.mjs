import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Criar cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQLFile(filePath) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Executar SQL diretamente
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Erro ao executar SQL:', error);
      return;
    }
    
    console.log('✅ SQL executado com sucesso!');
    
    // Verificar se as tabelas foram criadas
    const { data: tables, error: tablesError } = await supabase
      .from('usuarios')
      .select('*');
      
    if (tablesError) {
      console.error('❌ Erro ao verificar tabelas:', tablesError);
      return;
    }
    
    console.log('✅ Tabelas criadas com sucesso!');
    console.log('Usuários:', tables);
    
  } catch (error) {
    console.error('❌ Erro ao executar arquivo SQL:', error);
  }
}

// Executar o arquivo SQL
executeSQLFile(path.join(__dirname, 'create-tables.sql'));