import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ywcmqgfbxrejuwcbeolu.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Y21xZ2ZieHJlanV3Y2Jlb2x1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzUwOTQ4NiwiZXhwIjoyMDczMDg1NDg2fQ.lzbZSx1Qk2oYiXIkF2OGA6qicTXRbF1IQ7UCB3tbNeU'

async function main() {
  console.log('Iniciando verificação do banco de dados...')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    db: {
      schema: 'public'
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
        'x-client-info': '@supabase/auth-helpers-nextjs',
        'x-supabase-auth-type': 'service_role'
      }
    }
  })

  try {
    // Tenta buscar usuário específico
    console.log('\nBuscando usuário admin...')
    const { data: adminUser, error: adminError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', 'pecosta26@gmail.com')
      .single()

    if (adminError) {
      console.error('Erro ao buscar admin:', adminError)
    } else {
      console.log('Usuário admin encontrado:', adminUser)
    }

    // Tenta listar todos os usuários
    console.log('\nListando todos os usuários...')
    const { data: users, error: usersError } = await supabase
      .from('usuarios')
      .select('*')

    if (usersError) {
      console.error('Erro ao listar usuários:', usersError)
    } else {
      console.log('Total de usuários:', users?.length)
      console.log('Usuários:', users)
    }

  } catch (error) {
    console.error('Erro geral:', error)
  }
}

main().catch(console.error)
