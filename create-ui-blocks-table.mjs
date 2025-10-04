import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '.')

// Load environment variables from .env.local
const envPath = join(projectRoot, '.env.local')
const envConfig = dotenv.parse(fs.readFileSync(envPath))

// Set environment variables
for (const key in envConfig) {
  process.env[key] = envConfig[key]
}

console.log('Criando tabela ui_blocks...\n')

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createUIBlocksTable() {
  try {
    console.log('1. Verificando se a tabela ui_blocks já existe...')
    
    // Tentar acessar a tabela para ver se existe
    const { data: existingData, error: checkError } = await supabaseAdmin
      .from('ui_blocks')
      .select('key')
      .limit(1)
    
    if (!checkError) {
      console.log('✅ Tabela ui_blocks já existe!')
      console.log('Dados existentes:', existingData?.length || 0, 'registros')
      return true
    }
    
    console.log('⚠️  Tabela ui_blocks não existe, tentando criar...')
    console.log('Erro encontrado:', checkError.message)
    
    // Tentar criar usando uma abordagem diferente
    console.log('\n2. Tentando criar a tabela usando INSERT direto...')
    
    // Primeiro, vamos tentar inserir dados diretamente
    // Se a tabela não existir, o Supabase pode criá-la automaticamente
    const testData = {
      key: 'test_creation',
      html: '<div>Teste de criação</div>',
      updated_at: new Date().toISOString()
    }
    
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('ui_blocks')
      .insert(testData)
      .select('*')
      .single()
    
    if (insertError) {
      console.error('❌ Erro ao inserir dados de teste:', insertError)
      console.error('Código:', insertError.code)
      console.error('Detalhes:', insertError.details)
      
      // Se o erro for de tabela não existente, vamos tentar uma abordagem manual
      if (insertError.code === '42P01' || insertError.message.includes('does not exist')) {
        console.log('\n3. A tabela realmente não existe. Você precisa criar manualmente no Supabase.')
        console.log('\nExecute este SQL no editor SQL do Supabase:')
        console.log('----------------------------------------')
        console.log(`-- Creates the table used to manage header/footer content
create table if not exists public.ui_blocks (
  key text primary key,
  html text,
  updated_at timestamptz default now()
);

-- Enable RLS (Row Level Security)
alter table public.ui_blocks enable row level security;

-- Create policy to allow admin access
create policy "Admin can manage ui_blocks" on public.ui_blocks
  for all using (true);

-- Optional initial content (safe to run multiple times)
insert into public.ui_blocks(key, html) values
  ('login_header', '<div style="padding:12px;text-align:center;">Cabeçalho do Login</div>'),
  ('login_footer', '<div style="padding:12px;text-align:center;font-size:12px;color:#666;">© 2025</div>'),
  ('transmissao_header', '<div style="padding:12px;text-align:center;">Cabeçalho da Transmissão</div>'),
  ('transmissao_footer', '<div style="padding:12px;text-align:center;font-size:12px;color:#666;">Rodapé</div>')
on conflict (key) do nothing;`)
        console.log('----------------------------------------')
        return false
      }
      
      return false
    }
    
    console.log('✅ Tabela criada e dados de teste inseridos:', insertData)
    
    // Remover dados de teste
    const { error: deleteError } = await supabaseAdmin
      .from('ui_blocks')
      .delete()
      .eq('key', 'test_creation')
    
    if (deleteError) {
      console.log('⚠️  Não foi possível remover dados de teste:', deleteError.message)
    } else {
      console.log('✅ Dados de teste removidos')
    }
    
    // Inserir dados iniciais
    console.log('\n4. Inserindo dados iniciais...')
    const initialData = [
      { key: 'login_header', html: '<div style="padding:12px;text-align:center;">Cabeçalho do Login</div>' },
      { key: 'login_footer', html: '<div style="padding:12px;text-align:center;font-size:12px;color:#666;">© 2025</div>' },
      { key: 'transmissao_header', html: '<div style="padding:12px;text-align:center;">Cabeçalho da Transmissão</div>' },
      { key: 'transmissao_footer', html: '<div style="padding:12px;text-align:center;font-size:12px;color:#666;">Rodapé</div>' }
    ]
    
    for (const item of initialData) {
      const { error: upsertError } = await supabaseAdmin
        .from('ui_blocks')
        .upsert({ ...item, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      
      if (upsertError) {
        console.log(`⚠️  Erro ao inserir ${item.key}:`, upsertError.message)
      } else {
        console.log(`✅ ${item.key} inserido com sucesso`)
      }
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return false
  }
}

async function main() {
  console.log('=== Criação da Tabela ui_blocks ===\n')
  
  const success = await createUIBlocksTable()
  
  if (success) {
    console.log('\n✅ Tabela ui_blocks criada e configurada com sucesso!')
    console.log('Agora o salvamento de UI Blocks deve funcionar na área administrativa.')
  } else {
    console.log('\n❌ Falha ao criar a tabela ui_blocks.')
    console.log('Você precisa criar a tabela manualmente no Supabase usando o SQL fornecido acima.')
  }
}

main().catch(console.error)