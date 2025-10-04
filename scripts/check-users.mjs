import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env.local')
const envConfig = dotenv.parse(fs.readFileSync(envPath))

for (const k in envConfig) {
  process.env[k] = envConfig[k]
}

const supabaseUrl = 'https://ywcmqgfbxrejuwcbeolu.supabase.co'
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  throw new Error('Service key não encontrada')
}

// Não vamos mais logar a chave por segurança
console.log('Usando chave de serviço:')

async function checkUsers() {
  console.log('Verificando usuários no banco...')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('*')

    if (error) throw error
    console.log('Usuários encontrados:', usuarios?.length || 0)
    console.log('Lista de usuários:', usuarios)
  } catch (err) {
    console.error('Erro:', err)
  }
}

console.log('Iniciando verificação...')
await checkUsers()
