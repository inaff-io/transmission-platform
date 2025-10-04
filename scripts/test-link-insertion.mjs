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
const envConfig = dotenv.parse(fs.readFileSync(envPath))

// Set environment variables
for (const key in envConfig) {
  process.env[key] = envConfig[key]
}

console.log('Testando inserção de links...\n')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testLinkInsertion() {
  try {
    // Inserir transmissão e programação fornecidos
    const now = new Date().toISOString()

    console.log('Inserindo link de transmissão fornecido...')
    const transmissao = {
      tipo: 'transmissao',
      url: 'https://www.youtube.com/watch?v=lnEuLNv_7Qw&list=RDlnEuLNv_7Qw&start_radio=1',
      ativo_em: now,
      atualizado_em: now
    }
    const { data: txData, error: txError } = await supabase
      .from('links')
      .insert(transmissao)
      .select()
    if (txError) {
      console.error('Erro ao inserir transmissão:', txError)
    } else {
      console.log('Transmissão inserida com sucesso:', txData)
    }

    console.log('\nInserindo link de programação fornecido...')
    const programacao = {
      tipo: 'programacao',
      url: 'https://assistenciafarmaceutica.com.br/evento/faff2025/programacao/lista/embed/',
      ativo_em: now,
      atualizado_em: now
    }
    const { data: prgData, error: prgError } = await supabase
      .from('links')
      .insert(programacao)
      .select()
    if (prgError) {
      console.error('Erro ao inserir programação:', prgError)
    } else {
      console.log('Programação inserida com sucesso:', prgData)
    }

    // Verifica as tabelas existentes
    console.log('\nVerificando tabelas existentes...')
    const { data: tables, error: tablesError } = await supabase
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')

    if (tablesError) {
      console.error('Erro ao listar tabelas:', tablesError)
    } else {
      console.log('Tabelas encontradas:', tables)
    }

  } catch (error) {
    console.error('Erro durante o teste:', error)
  }
}

testLinkInsertion()