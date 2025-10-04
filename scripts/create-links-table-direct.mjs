import pg from 'pg'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const { Client } = pg

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

console.log('Creating links table using direct PostgreSQL connection...\n')

async function createLinksTable() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
  })

  try {
    await client.connect()
    console.log('Connected to PostgreSQL database')

    // Create the links table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.links (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('transmissao', 'programacao')),
        url TEXT NOT NULL,
        ativo_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    await client.query(createTableSQL)
    console.log('✅ Links table created successfully!')

    // Create indexes
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_links_tipo ON public.links(tipo);
      CREATE INDEX IF NOT EXISTS idx_links_ativo_em ON public.links(ativo_em DESC);
      CREATE INDEX IF NOT EXISTS idx_links_atualizado_em ON public.links(atualizado_em DESC);
    `

    await client.query(indexSQL)
    console.log('✅ Indexes created successfully!')

    // Insert sample data
    const insertSQL = `
      INSERT INTO public.links (tipo, url) VALUES 
      ('transmissao', 'https://www.youtube.com/embed/DtyBnYuAsJY?si=F8N0DTPYbv5apyJT'),
      ('programacao', 'https://www.youtube.com/embed/sample-programming-video')
      ON CONFLICT DO NOTHING;
    `

    const result = await client.query(insertSQL)
    console.log('✅ Sample data inserted successfully!')
    console.log(`   Rows inserted: ${result.rowCount}`)

    // Verify the table
    const verifySQL = 'SELECT * FROM public.links ORDER BY created_at DESC LIMIT 5;'
    const verifyResult = await client.query(verifySQL)
    
    console.log('\n=== Table Contents ===')
    console.log(`Total records: ${verifyResult.rows.length}`)
    verifyResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.tipo}: ${row.url.substring(0, 50)}...`)
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
    console.log('\nDatabase connection closed')
  }
}

async function main() {
  console.log('=== Creating Links Table (Direct PostgreSQL) ===\n')
  await createLinksTable()
  console.log('\n=== Done ===')
}

main().catch(console.error)