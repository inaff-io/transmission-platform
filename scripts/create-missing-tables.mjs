import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'
import pg from 'pg'

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

console.log('🚀 Criando tabelas links e abas via conexão direta...\n')

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ POSTGRES_URL ou DATABASE_URL não encontrada')
  process.exit(1)
}

const { Client } = pg

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    console.log('📡 Conectando ao banco...')
    await client.connect()
    console.log('✅ Conectado!\n')

    // Criar tabela links
    console.log('📝 Criando tabela links...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tipo TEXT CHECK (tipo IN ('transmissao','programacao')),
        url TEXT NOT NULL,
        ativo_em TIMESTAMP DEFAULT NOW(),
        atualizado_em TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✅ Tabela links criada')

    // Criar índices para links
    console.log('📝 Criando índices para links...')
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_links_tipo ON links(tipo);
      CREATE INDEX IF NOT EXISTS idx_links_ativo_em ON links(ativo_em DESC);
      CREATE INDEX IF NOT EXISTS idx_links_atualizado_em ON links(atualizado_em DESC);
    `)
    console.log('✅ Índices criados')

    // Criar tabela abas
    console.log('📝 Criando tabela abas...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS abas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome TEXT NOT NULL UNIQUE,
        habilitada BOOLEAN DEFAULT FALSE,
        criado_em TIMESTAMP DEFAULT NOW(),
        atualizado_em TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✅ Tabela abas criada')

    // Inserir abas padrão
    console.log('📝 Inserindo abas padrão...')
    await client.query(`
      INSERT INTO abas (nome, habilitada) VALUES
        ('programacao', TRUE),
        ('materiais', FALSE),
        ('chat', FALSE),
        ('qa', FALSE)
      ON CONFLICT (nome) DO NOTHING;
    `)
    console.log('✅ Abas padrão inseridas')

    // Inserir link de exemplo
    console.log('📝 Verificando links...')
    const { rows } = await client.query(`SELECT COUNT(*) FROM links WHERE tipo = 'transmissao'`)
    if (parseInt(rows[0].count) === 0) {
      await client.query(`
        INSERT INTO links (tipo, url) VALUES
          ('transmissao', 'https://www.youtube.com/embed/DtyBnYuAsJY')
      `)
      console.log('✅ Link de transmissão de exemplo inserido')
    } else {
      console.log('ℹ️  Links já existem')
    }

    console.log('\n✨ Banco de dados configurado com sucesso!\n')
  } catch (err) {
    console.error('\n❌ Erro:', err.message)
    console.error('Detalhes:', err)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
