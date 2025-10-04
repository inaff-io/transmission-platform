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

console.log('Creating links table...\n')

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createLinksTable() {
  try {
    console.log('Creating links table...')
    
    // Create the links table
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.links (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('transmissao', 'programacao')),
          url TEXT NOT NULL,
          ativo_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_links_tipo ON public.links(tipo);
        CREATE INDEX IF NOT EXISTS idx_links_ativo_em ON public.links(ativo_em DESC);
        CREATE INDEX IF NOT EXISTS idx_links_atualizado_em ON public.links(atualizado_em DESC);
        
        -- Enable RLS (Row Level Security)
        ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
        
        -- Create policy to allow all operations for authenticated users
        DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.links;
        CREATE POLICY "Allow all operations for authenticated users" ON public.links
          FOR ALL USING (true);
        
        -- Grant permissions
        GRANT ALL ON public.links TO authenticated;
        GRANT ALL ON public.links TO service_role;
      `
    })
    
    if (error) {
      console.log('❌ Error creating links table:', error.message)
      return false
    } else {
      console.log('✅ Links table created successfully!')
      return true
    }
  } catch (err) {
    console.log('❌ Error creating links table:', err.message)
    return false
  }
}

async function insertSampleData() {
  try {
    console.log('Inserting sample data...')
    
    const { data, error } = await supabaseAdmin
      .from('links')
      .insert([
        {
          tipo: 'transmissao',
          url: 'https://www.youtube.com/embed/DtyBnYuAsJY?si=F8N0DTPYbv5apyJT'
        },
        {
          tipo: 'programacao',
          url: 'https://www.youtube.com/embed/sample-programming-video'
        }
      ])
    
    if (error) {
      console.log('❌ Error inserting sample data:', error.message)
      return false
    } else {
      console.log('✅ Sample data inserted successfully!')
      return true
    }
  } catch (err) {
    console.log('❌ Error inserting sample data:', err.message)
    return false
  }
}

async function main() {
  console.log('=== Creating Links Table ===\n')
  
  const tableCreated = await createLinksTable()
  
  if (tableCreated) {
    console.log()
    await insertSampleData()
  }
  
  console.log('\n=== Done ===')
}

main().catch(console.error)