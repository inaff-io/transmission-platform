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
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Credenciais do Supabase não encontradas')
}

async function createUsers() {
  console.log('Iniciando criação de usuários...')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const usuarios = [
    {
      nome: 'Pedro Costa',
      email: 'pecosta26@gmail.com',
      cpf: '05701807401',
      status: true
    },
    {
      nome: 'João Silva',
      email: 'joao.silva@gmail.com',
      cpf: '12345678900',
      status: true
    }
  ]

  try {
    for (const usuario of usuarios) {
      console.log(`Criando usuário ${usuario.email}...`)
      
      // Verifica se o usuário já existe
      const { data: existing, error: queryError } = await supabase
        .from('usuarios')
        .select('email')
        .eq('email', usuario.email)
        .single()

      if (queryError && queryError.code !== 'PGRST116') {
        console.error(`Erro ao verificar ${usuario.email}:`, queryError)
        continue
      }

      if (existing) {
        console.log(`Usuário ${usuario.email} já existe.`)
        continue
      }

      // Cria o usuário
      const { error: insertError } = await supabase
        .from('usuarios')
        .insert(usuario)

      if (insertError) {
        console.error(`Erro ao criar ${usuario.email}:`, insertError)
      } else {
        console.log(`Usuário ${usuario.email} criado com sucesso.`)
      }
    }

    // Verifica os usuários criados
    const { data: allUsers, error: listError } = await supabase
      .from('usuarios')
      .select('*')

    if (listError) {
      console.error('Erro ao listar usuários:', listError)
    } else {
      console.log('Usuários no banco:', allUsers)
    }
  } catch (err) {
    console.error('Erro:', err)
  }
}

createUsers()
