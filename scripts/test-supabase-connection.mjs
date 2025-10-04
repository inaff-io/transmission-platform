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

console.log('Environment variables loaded:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY)

// Initialize Supabase clients
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Test queries
async function testConnections() {
  try {
    console.log('\nTesting anon client:')
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('usuarios')
      .select('nome, cpf')
      .limit(1)

    if (anonError) {
      console.error('Anon client error:', anonError)
    } else {
      console.log('Anon client success:', anonData)
    }

    console.log('\nTesting admin client:')
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('usuarios')
      .select('nome, cpf')
      .limit(1)

    if (adminError) {
      console.error('Admin client error:', adminError)
    } else {
      console.log('Admin client success:', adminData)
    }
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testConnections()