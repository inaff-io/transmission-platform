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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Credenciais do Supabase não encontradas')
}

async function createUsers() {
  console.log('Iniciando criação de usuários...')
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    db: { schema: 'public' },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
  
  const usuarios = [
    {
      nome: 'Pedro Costa',
      email: 'pecosta26@gmail.com',
      cpf: '05701807401',
      categoria: 'Admin'
    },
    {
      nome: 'João Silva',
      email: 'joao.silva@gmail.com',
      cpf: '12345678900',
      categoria: 'Usuario'
    }
  ]

  try {
    for (const usuario of usuarios) {
      console.log(`Criando usuário ${usuario.email}...`)
      
      // Verifica se o usuário já existe
      const { data: existing } = await supabase
        .from('usuarios')
        .select('email')
        .eq('email', usuario.email)
        .single()

      if (existing) {
        console.log(`Usuário ${usuario.email} já existe.`)
        continue
      }

      // Cria o usuário
      const { error } = await supabase
        .from('usuarios')
        .insert(usuario)

      if (error) {
        console.error(`Erro ao criar ${usuario.email}:`, error)
      } else {
        console.log(`Usuário ${usuario.email} criado com sucesso.`)
      }
    }
  } catch (err) {
    console.error('Erro:', err)
  }
}

createUsers()
