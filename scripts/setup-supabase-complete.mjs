import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import fs from 'node:fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

// Load environment variables from .env.local
const envPath = join(projectRoot, '.env.local')
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath))
  for (const key in envConfig) {
    process.env[key] = envConfig[key]
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!')
  console.error('Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

console.log('🚀 Configurando Supabase completamente...\n')
console.log('📍 URL:', supabaseUrl)
console.log('')

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// SQL para criar as tabelas links e abas
const createLinksTableSQL = `
-- Criar tabela LINKS
CREATE TABLE IF NOT EXISTS public.links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT CHECK (tipo IN ('transmissao','programacao')),
  url TEXT NOT NULL,
  ativo_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para LINKS
CREATE INDEX IF NOT EXISTS idx_links_tipo ON public.links(tipo);
CREATE INDEX IF NOT EXISTS idx_links_ativo_em ON public.links(ativo_em DESC);
CREATE INDEX IF NOT EXISTS idx_links_atualizado_em ON public.links(atualizado_em DESC);
`

const createAbasTableSQL = `
-- Criar tabela ABAS
CREATE TABLE IF NOT EXISTS public.abas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  habilitada BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para ABAS
CREATE INDEX IF NOT EXISTS idx_abas_nome ON public.abas(nome);
CREATE INDEX IF NOT EXISTS idx_abas_habilitada ON public.abas(habilitada);
`

const enableRLSSQL = `
-- Habilitar Row Level Security
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abas ENABLE ROW LEVEL SECURITY;
`

const createPoliciesSQL = `
-- Políticas para LINKS
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'links' AND policyname = 'Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON public.links FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'links' AND policyname = 'Enable insert for authenticated users only'
  ) THEN
    CREATE POLICY "Enable insert for authenticated users only" ON public.links FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'links' AND policyname = 'Enable update for authenticated users only'
  ) THEN
    CREATE POLICY "Enable update for authenticated users only" ON public.links FOR UPDATE USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'links' AND policyname = 'Enable delete for authenticated users only'
  ) THEN
    CREATE POLICY "Enable delete for authenticated users only" ON public.links FOR DELETE USING (true);
  END IF;
END $$;

-- Políticas para ABAS
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'abas' AND policyname = 'Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON public.abas FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'abas' AND policyname = 'Enable insert for authenticated users only'
  ) THEN
    CREATE POLICY "Enable insert for authenticated users only" ON public.abas FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'abas' AND policyname = 'Enable update for authenticated users only'
  ) THEN
    CREATE POLICY "Enable update for authenticated users only" ON public.abas FOR UPDATE USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'abas' AND policyname = 'Enable delete for authenticated users only'
  ) THEN
    CREATE POLICY "Enable delete for authenticated users only" ON public.abas FOR DELETE USING (true);
  END IF;
END $$;
`

async function executeSQL(description, sql) {
  try {
    console.log(`📝 ${description}...`)
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      // Se exec_sql não existir, tentamos via REST API diretamente
      if (error.code === 'PGRST202') {
        console.log('   ⚠️  Função exec_sql não disponível, usando método alternativo...')
        return false
      }
      throw error
    }
    
    console.log(`   ✅ ${description} - Concluído!`)
    return true
  } catch (err) {
    console.error(`   ❌ Erro: ${err.message}`)
    return false
  }
}

async function checkTable(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1)
    
    if (error && error.code === '42P01') {
      // Tabela não existe
      return false
    }
    
    return true
  } catch {
    return false
  }
}

async function insertInitialData() {
  console.log('\n📋 Inserindo dados iniciais...')
  
  // Verificar e inserir abas
  try {
    const { data: existingAbas } = await supabase
      .from('abas')
      .select('nome')
    
    const existingNames = new Set((existingAbas || []).map(a => a.nome))
    
    const defaultAbas = [
      { nome: 'programacao', habilitada: true },
      { nome: 'materiais', habilitada: false },
      { nome: 'chat', habilitada: false },
      { nome: 'qa', habilitada: false }
    ]
    
    for (const aba of defaultAbas) {
      if (!existingNames.has(aba.nome)) {
        await supabase.from('abas').insert(aba)
        console.log(`   ✅ Aba "${aba.nome}" criada`)
      } else {
        console.log(`   ℹ️  Aba "${aba.nome}" já existe`)
      }
    }
  } catch (err) {
    console.error('   ❌ Erro ao inserir abas:', err.message)
  }
  
  // Verificar e inserir link de exemplo
  try {
    const { data: existingLinks } = await supabase
      .from('links')
      .select('*')
      .eq('tipo', 'transmissao')
    
    if (!existingLinks || existingLinks.length === 0) {
      await supabase.from('links').insert({
        tipo: 'transmissao',
        url: 'https://www.youtube.com/embed/DtyBnYuAsJY'
      })
      console.log('   ✅ Link de transmissão de exemplo criado')
    } else {
      console.log('   ℹ️  Links já existem')
    }
  } catch (err) {
    console.error('   ❌ Erro ao inserir link:', err.message)
  }
}

async function verifySetup() {
  console.log('\n🔍 Verificando configuração final...\n')
  
  const tables = ['usuarios', 'logins', 'links', 'abas']
  const status = {}
  
  for (const table of tables) {
    const exists = await checkTable(table)
    status[table] = exists
    console.log(`   ${exists ? '✅' : '❌'} ${table}`)
  }
  
  const allExist = Object.values(status).every(Boolean)
  
  if (allExist) {
    console.log('\n✨ Todas as tabelas estão prontas!')
    
    // Mostrar contagem de registros
    console.log('\n📊 Contagem de registros:')
    for (const table of tables) {
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        console.log(`   ${table}: ${count} registro(s)`)
      } catch {
        console.log(`   ${table}: erro ao contar`)
      }
    }
  } else {
    console.log('\n⚠️  Algumas tabelas ainda precisam ser criadas manualmente')
  }
  
  return allExist
}

async function main() {
  console.log('🔍 Verificando tabelas existentes...\n')
  
  const linksExist = await checkTable('links')
  const abasExist = await checkTable('abas')
  
  console.log(`   ${linksExist ? '✅' : '❌'} links`)
  console.log(`   ${abasExist ? '✅' : '❌'} abas`)
  
  if (linksExist && abasExist) {
    console.log('\n✅ Tabelas já existem!')
    await insertInitialData()
    await verifySetup()
    return
  }
  
  console.log('\n⚙️  Criando tabelas faltantes...\n')
  
  // Tentar criar via exec_sql
  let success = true
  
  if (!linksExist) {
    success = await executeSQL('Criando tabela links', createLinksTableSQL)
  }
  
  if (!abasExist) {
    success = await executeSQL('Criando tabela abas', createAbasTableSQL) && success
  }
  
  if (success) {
    await executeSQL('Habilitando RLS', enableRLSSQL)
    await executeSQL('Criando políticas de acesso', createPoliciesSQL)
  }
  
  // Se exec_sql não funcionar, mostrar instruções
  if (!success) {
    console.log('\n' + '='.repeat(80))
    console.log('⚠️  Método automático não disponível')
    console.log('='.repeat(80))
    console.log('\n📋 Execute este SQL manualmente no Supabase Dashboard:')
    console.log('🔗 https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/sql/new\n')
    console.log('--- Copie o conteúdo do arquivo: scripts/CREATE-MISSING-TABLES.sql ---\n')
    return
  }
  
  // Inserir dados iniciais
  await insertInitialData()
  
  // Verificar
  await verifySetup()
}

main().catch(err => {
  console.error('\n❌ Erro fatal:', err.message)
  process.exit(1)
})
