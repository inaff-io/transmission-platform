import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import fs from 'node:fs'

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixDatabase() {
  console.log('🔧 Corrigindo estrutura do banco de dados...\n')
  
  // 1. Verificar estrutura da tabela logins
  console.log('1️⃣ Verificando tabela logins...')
  const { data: loginsData, error: loginsError } = await supabase
    .from('logins')
    .select('*')
    .limit(1)
  
  if (loginsError) {
    console.log('   ℹ️  Estrutura da tabela logins:', loginsError.message)
  } else {
    console.log('   ✅ Tabela logins OK')
  }
  
  // 2. Verificar se há constraint de FK
  console.log('\n2️⃣ Removendo constraint de FK se existir...')
  console.log('   📝 Execute este SQL no Supabase Dashboard se houver erro de FK:')
  console.log('   ---')
  console.log(`
-- Remover constraint de foreign key se existir
ALTER TABLE IF EXISTS public.logins 
  DROP CONSTRAINT IF EXISTS logins_usuario_id_fkey;

-- A tabela logins pode funcionar sem FK rígida
-- Isso permite registro de login mesmo com usuários de sistemas externos
  `)
  console.log('   ---\n')
  
  // 3. Verificar cache do Supabase
  console.log('3️⃣ Resetando cache do Supabase...')
  console.log('   📝 Para resetar o cache das tabelas:')
  console.log('   1. Acesse: https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/api')
  console.log('   2. Clique em "Refresh" ou "Reload Schema"')
  console.log('   3. Ou execute: POST https://ywcmqgfbxrejuwcbeolu.supabase.co/rest/v1/?apikey=YOUR_KEY com header "Prefer: schema-reload"\n')
  
  // 4. Verificar usuários
  console.log('4️⃣ Verificando usuários na tabela usuarios...')
  const { data: usuarios, error: usuariosError } = await supabase
    .from('usuarios')
    .select('id, email, categoria')
  
  if (usuariosError) {
    console.error('   ❌ Erro ao buscar usuários:', usuariosError.message)
  } else if (!usuarios || usuarios.length === 0) {
    console.log('   ⚠️  Nenhum usuário encontrado na tabela usuarios!')
    console.log('   📝 Você precisa inserir os usuários na tabela usuarios.')
  } else {
    console.log(`   ✅ ${usuarios.length} usuário(s) encontrado(s):`)
    for (const user of usuarios) {
      console.log(`      - ${user.email} (${user.categoria}) - ID: ${user.id}`)
    }
  }
  
  // 5. Verificar links e abas
  console.log('\n5️⃣ Verificando tabelas links e abas...')
  const { data: links } = await supabase.from('links').select('*')
  const { data: abas } = await supabase.from('abas').select('*')
  
  console.log(`   ✅ Links: ${links?.length || 0} registro(s)`)
  console.log(`   ✅ Abas: ${abas?.length || 0} registro(s)`)
  
  if (links && links.length > 0) {
    console.log('\n   📋 Links cadastrados:')
    for (const link of links) {
      console.log(`      - [${link.tipo}] ${link.url}`)
    }
  }
  
  if (abas && abas.length > 0) {
    console.log('\n   📋 Abas cadastradas:')
    for (const aba of abas) {
      console.log(`      - ${aba.nome}: ${aba.habilitada ? '✅ Habilitada' : '❌ Desabilitada'}`)
    }
  }
  
  console.log('\n✨ Verificação concluída!')
  console.log('\n📝 Próximos passos:')
  console.log('   1. Resetar o cache do Supabase no Dashboard')
  console.log('   2. Remover a constraint FK da tabela logins (se houver erro)')
  console.log('   3. Reiniciar o servidor Next.js: npm run dev')
}

fixDatabase().catch(err => {
  console.error('\n❌ Erro:', err.message)
  process.exit(1)
})
