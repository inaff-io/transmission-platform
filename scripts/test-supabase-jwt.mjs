import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const envPath = resolve(__dirname, '..', '.env.local')

// Carregar variáveis de ambiente do .env.local
const envConfig = dotenv.parse(fs.readFileSync(envPath))
for (const k in envConfig) {
  process.env[k] = envConfig[k]
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('=== Configuração do Supabase ===')
console.log('URL:', SUPABASE_URL)
console.log('ANON KEY:', SUPABASE_ANON_KEY)
console.log('SERVICE ROLE KEY:', SUPABASE_SERVICE_ROLE_KEY)
console.log('\n')

// Criar cliente Supabase com chave anon
console.log('=== Testando cliente anon ===')
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false
  }
})

// Criar cliente Supabase com chave service_role
console.log('=== Testando cliente service_role ===')
const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false
  }
})

// Função para testar uma query
async function testQuery(client, name) {
  try {
    console.log(`\nTestando query com cliente ${name}:`)
    const { data, error } = await client
      .from('usuarios')
      .select('id, cpf')
      .limit(1)
    
    if (error) {
      console.error('Erro:', error)
      return
    }

    console.log('Sucesso! Dados:', data)
  } catch (err) {
    console.error('Erro não tratado:', err)
  }
}

// Testar ambos os clientes
await testQuery(anonClient, 'anon')
await testQuery(serviceClient, 'service_role')