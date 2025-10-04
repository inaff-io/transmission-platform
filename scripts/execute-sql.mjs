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
    
    // Dividir o SQL em comandos individuais
    const commands = sql.split(';').filter(cmd => cmd.trim());
    
    for (const command of commands) {
      if (command.trim()) {
        const { data, error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          console.error('❌ Erro ao executar comando SQL:', error);
          console.error('Comando:', command);
          return;
        }
        
        console.log('✅ Comando SQL executado com sucesso');
      }
    }
    
    console.log(`✅ Arquivo ${path.basename(filePath)} executado com sucesso!`);
  } catch (error) {
    console.error(`❌ Erro ao executar ${path.basename(filePath)}:`, error);
  }
}

async function main() {
  // Executar arquivo de funções
  await executeSQLFile(path.join(__dirname, '../supabase/migrations/create-functions.sql'));
  
  // Criar as tabelas usando as funções
  console.log('Criando tabelas...');
  await supabase.rpc('create_usuarios_table');
  await supabase.rpc('create_logins_table');
  await supabase.rpc('create_links_table');
  await supabase.rpc('create_abas_table');
  
  // Inserir dados iniciais
  console.log('Inserindo dados iniciais...');
  const { error: usersError } = await supabase
    .from('usuarios')
    .insert([
      {
        categoria: 'admin',
        nome: 'Pedro Costa',
        email: 'pecosta26@gmail.com',
        cpf: '12345678901'
      },
      {
        categoria: 'user',
        nome: 'João Silva',
        email: 'joao.silva@example.com',
        cpf: '98765432101'
      }
    ]);

  if (usersError) {
    console.error('❌ Erro ao inserir usuários:', usersError);
  } else {
    console.log('✅ Usuários inseridos com sucesso');
  }

  const { error: tabsError } = await supabase
    .from('abas')
    .insert([
      { nome: 'programacao', habilitada: true },
      { nome: 'materiais', habilitada: false },
      { nome: 'chat', habilitada: false },
      { nome: 'qa', habilitada: false }
    ]);

  if (tabsError) {
    console.error('❌ Erro ao inserir abas:', tabsError);
  } else {
    console.log('✅ Abas inseridas com sucesso');
  }
}

main();