import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addTipoColumn() {
  try {
    console.log('Verificando se a coluna tipo já existe...')
    
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('programacoes')
      .select()
      .limit(1)
    
    if (columnsError) {
      console.error('Erro ao verificar colunas:', columnsError)
      return
    }
    
    const firstRow = columns[0]
    if (firstRow && 'tipo' in firstRow) {
      console.log('A coluna tipo já existe!')
      return
    }
    
    console.log('Adicionando coluna tipo à tabela programacoes...')
    
    const { error } = await supabaseAdmin
      .from('programacoes')
      .update({ tipo: 'programacao' })
      .is('tipo', null)
    
    if (error) {
      console.error('Erro ao atualizar registros:', error)
      return
    }
    
    console.log('Coluna tipo adicionada e registros atualizados com sucesso!')
  } catch (error) {
    console.error('Erro:', error)
  }
}

addTipoColumn()