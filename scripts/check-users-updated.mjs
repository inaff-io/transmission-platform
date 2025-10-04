import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env.local')

console.log('Carregando variáveis de ambiente de:', envPath)
const envConfig = dotenv.parse(fs.readFileSync(envPath))

for (const k in envConfig) {
  process.env[k] = envConfig[k]
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('URL do Supabase:', supabaseUrl)
console.log('Service Key presente:', !!supabaseServiceKey)

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Credenciais do Supabase não encontradas no .env.local')
}

async function checkUsers() {
  console.log('\n=== Verificando usuários no banco de dados ===\n')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  
  try {
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar usuários:', error)
      throw error
    }
    
    console.log(`Total de usuários encontrados: ${usuarios?.length || 0}\n`)
    
    if (usuarios && usuarios.length > 0) {
      console.log('Lista de usuários:')
      console.log('==================\n')
      
      usuarios.forEach((user, index) => {
        console.log(`${index + 1}. ${user.nome}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   CPF: ${user.cpf}`)
        console.log(`   Categoria: ${user.categoria}`)
        console.log(`   Status: ${user.status ? 'Ativo' : 'Inativo'}`)
        console.log(`   Criado em: ${user.created_at}`)
        console.log(`   ID: ${user.id}`)
        console.log('')
      })
    } else {
      console.log('Nenhum usuário encontrado no banco de dados.')
      console.log('Execute o script create-admin-user.mjs para criar um usuário.')
    }
  } catch (err) {
    console.error('Erro ao verificar usuários:', err.message)
    process.exit(1)
  }
}

console.log('Iniciando verificação...')
await checkUsers()
console.log('Verificação concluída!')
