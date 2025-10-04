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
const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL(filePath) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    const { data, error } = await supabase.from('usuarios').select('*');
    
    if (error) {
      console.error('❌ Erro ao verificar conexão:', error);
      return;
    }

    console.log('✅ Conexão com o banco estabelecida');
    console.log('Usuários existentes:', data);

    // Executar scripts SQL
    const { error: sqlError } = await supabase.rpc('exec', { query: sql });
    
    if (sqlError) {
      console.error(`❌ Erro ao executar ${path.basename(filePath)}:`, sqlError);
      return;
    }
    
    console.log(`✅ Script ${path.basename(filePath)} executado com sucesso!`);
  } catch (error) {
    console.error(`❌ Erro ao executar ${path.basename(filePath)}:`, error);
  }
}

async function main() {
  // Executar scripts na ordem correta
  await executeSQL(path.join(__dirname, '../supabase/migrations/reset-and-create.sql'));
  await executeSQL(path.join(__dirname, '../supabase/migrations/insert-admin.sql'));
}

main();