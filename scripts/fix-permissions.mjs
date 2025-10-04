import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

// Configuração do dotenv
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixPermissions() {
  try {
    console.log('Corrigindo permissões do banco de dados...')

    // SQL para corrigir as permissões
    const sql = `
      -- Garante que estamos no schema correto
      SET search_path TO public;

      -- Garante que o usuário anon tem acesso às tabelas
      GRANT USAGE ON SCHEMA public TO anon;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
      GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

      -- Garante que o usuário authenticated tem acesso às tabelas
      GRANT USAGE ON SCHEMA public TO authenticated;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
      GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

      -- Garante que o usuário service_role tem acesso total
      GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
      GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
    `

    const { error } = await supabase.rpc('exec', { sql })
    
    if (error) {
      throw error
    }

    console.log('Permissões corrigidas com sucesso!')
  } catch (error) {
    console.error('Erro ao corrigir permissões:', error)
    process.exit(1)
  }
}

fixPermissions()