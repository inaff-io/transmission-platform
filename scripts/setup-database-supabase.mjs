import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

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

console.log('🚀 Configurando banco de dados via Supabase...\n')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSql(description, sql) {
  console.log(`\n📝 ${description}...`)
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    if (error) {
      // Se a função exec_sql não existe, tenta criar as tabelas diretamente via query
      if (error.code === 'PGRST202' || error.message?.includes('exec_sql')) {
        console.log('⚠️  Função exec_sql não existe, executando via client...')
        // Para create/drop, usar diretamente o client não funciona bem
        // Vamos mostrar o SQL para executar no Supabase Dashboard
        console.log('\n📋 Execute este SQL no Supabase Dashboard → SQL Editor:\n')
        console.log('─'.repeat(80))
        console.log(sql)
        console.log('─'.repeat(80))
        return false
      }
      throw error
    }
    console.log('✅ Sucesso!')
    return true
  } catch (err) {
    console.error(`❌ Erro: ${err.message}`)
    console.error('Detalhes:', err)
    return false
  }
}

async function checkTables() {
  console.log('\n🔍 Verificando tabelas existentes...')
  try {
    const tables = ['usuarios', 'logins', 'links', 'abas']
    const results = {}
    
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('id').limit(1)
      results[table] = !error
      console.log(`  ${results[table] ? '✅' : '❌'} ${table}`)
    }
    
    return results
  } catch (err) {
    console.error('❌ Erro ao verificar tabelas:', err.message)
    return {}
  }
}

async function createTables() {
  const sql = `
-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria TEXT NOT NULL,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    status BOOLEAN DEFAULT TRUE,
    last_active TIMESTAMP,
    criado_em TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de logins
CREATE TABLE IF NOT EXISTS logins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    login_em TIMESTAMP DEFAULT NOW(),
    logout_em TIMESTAMP,
    tempo_logado INT,
    ip TEXT,
    navegador TEXT
);

-- Tabela de links
CREATE TABLE IF NOT EXISTS links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT CHECK (tipo IN ('transmissao','programacao')),
    url TEXT NOT NULL,
    ativo_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela de abas
CREATE TABLE IF NOT EXISTS abas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL UNIQUE,
    habilitada BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Inserir abas padrão
INSERT INTO abas (nome, habilitada) VALUES
    ('programacao', TRUE),
    ('materiais', FALSE),
    ('chat', FALSE),
    ('qa', FALSE)
ON CONFLICT (nome) DO NOTHING;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_logins_usuario_id ON logins(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logins_login_em ON logins(login_em DESC);
CREATE INDEX IF NOT EXISTS idx_links_tipo ON links(tipo);
CREATE INDEX IF NOT EXISTS idx_links_ativo_em ON links(ativo_em DESC);
`

  return await executeSql('Criando tabelas', sql)
}

async function insertSampleData() {
  console.log('\n📦 Inserindo dados de exemplo...')
  
  try {
    // Inserir link de transmissão de exemplo
    const { data: existingLinks, error: checkError } = await supabase
      .from('links')
      .select('id')
      .eq('tipo', 'transmissao')
      .limit(1)
    
    if (!checkError && (!existingLinks || existingLinks.length === 0)) {
      const { error: insertError } = await supabase
        .from('links')
        .insert([
          {
            tipo: 'transmissao',
            url: 'https://www.youtube.com/embed/DtyBnYuAsJY'
          }
        ])
      
      if (insertError) {
        console.error('❌ Erro ao inserir link:', insertError.message)
      } else {
        console.log('✅ Link de transmissão inserido')
      }
    } else {
      console.log('ℹ️  Link de transmissão já existe')
    }
  } catch (err) {
    console.error('❌ Erro:', err.message)
  }
}

async function main() {
  console.log('═'.repeat(80))
  console.log('  CONFIGURAÇÃO DO BANCO DE DADOS SUPABASE')
  console.log('═'.repeat(80))
  
  // Verifica estado atual
  const existingTables = await checkTables()
  
  const allExist = Object.values(existingTables).every(exists => exists)
  
  if (allExist) {
    console.log('\n✨ Todas as tabelas já existem!')
    await insertSampleData()
  } else {
    console.log('\n⚙️  Algumas tabelas precisam ser criadas...')
    const success = await createTables()
    
    if (success) {
      console.log('\n✅ Banco de dados configurado com sucesso!')
      await insertSampleData()
    } else {
      console.log('\n⚠️  Execute o SQL manualmente no Supabase Dashboard')
      console.log('   https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/sql/new')
    }
  }
  
  console.log('\n' + '═'.repeat(80))
  console.log('  Configuração concluída!')
  console.log('═'.repeat(80) + '\n')
}

main().catch(err => {
  console.error('\n❌ Erro fatal:', err)
  process.exit(1)
})
