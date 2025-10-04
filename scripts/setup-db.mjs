import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Criar cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  try {
    // Criar tabela de usuários
    const { error: userError } = await supabase.rpc('create_usuarios_table');
    if (userError) {
      console.error('❌ Erro ao criar tabela de usuários:', userError);
      return;
    }
    console.log('✅ Tabela de usuários criada com sucesso');

    // Criar tabela de logins
    const { error: loginError } = await supabase.rpc('create_logins_table');
    if (loginError) {
      console.error('❌ Erro ao criar tabela de logins:', loginError);
      return;
    }
    console.log('✅ Tabela de logins criada com sucesso');

    // Criar tabela de links
    const { error: linkError } = await supabase.rpc('create_links_table');
    if (linkError) {
      console.error('❌ Erro ao criar tabela de links:', linkError);
      return;
    }
    console.log('✅ Tabela de links criada com sucesso');

    // Criar tabela de abas
    const { error: tabError } = await supabase.rpc('create_abas_table');
    if (tabError) {
      console.error('❌ Erro ao criar tabela de abas:', tabError);
      return;
    }
    console.log('✅ Tabela de abas criada com sucesso');

    // Inserir usuários iniciais
    const { error: adminError } = await supabase
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

    if (adminError) {
      console.error('❌ Erro ao inserir usuários:', adminError);
      return;
    }
    console.log('✅ Usuários inseridos com sucesso');

    // Inserir abas padrão
    const { error: abasError } = await supabase
      .from('abas')
      .insert([
        { nome: 'programacao', habilitada: true },
        { nome: 'materiais', habilitada: false },
        { nome: 'chat', habilitada: false },
        { nome: 'qa', habilitada: false }
      ]);

    if (abasError) {
      console.error('❌ Erro ao inserir abas:', abasError);
      return;
    }
    console.log('✅ Abas inseridas com sucesso');

  } catch (error) {
    console.error('❌ Erro ao configurar banco de dados:', error);
  }
}

createTables();