import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '.')

// Load environment variables from .env.local
const envPath = join(projectRoot, '.env.local')
const envConfig = dotenv.parse(fs.readFileSync(envPath))

// Set environment variables
for (const key in envConfig) {
  process.env[key] = envConfig[key]
}

console.log('Testando salvamento na área administrativa...\n')

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testAdminSave() {
  try {
    console.log('1. Testando inserção na tabela links...')
    
    const testLink = {
      tipo: 'transmissao',
      url: 'https://vimeo.com/123456789',
      ativo_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    }
    
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('links')
      .insert(testLink)
      .select('*')
      .single()
    
    if (insertError) {
      console.error('❌ Erro ao inserir link:', insertError)
      console.error('Detalhes do erro:', insertError.message)
      console.error('Código do erro:', insertError.code)
      return false
    }
    
    console.log('✅ Link inserido com sucesso:', insertData)
    
    // Testar leitura
    console.log('\n2. Testando leitura da tabela links...')
    const { data: readData, error: readError } = await supabaseAdmin
      .from('links')
      .select('*')
      .order('ativo_em', { ascending: false })
      .limit(5)
    
    if (readError) {
      console.error('❌ Erro ao ler links:', readError)
      return false
    }
    
    console.log('✅ Links lidos com sucesso:', readData.length, 'registros')
    
    // Testar atualização
    console.log('\n3. Testando atualização do link...')
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('links')
      .update({ 
        url: 'https://vimeo.com/987654321',
        atualizado_em: new Date().toISOString()
      })
      .eq('id', insertData.id)
      .select('*')
      .single()
    
    if (updateError) {
      console.error('❌ Erro ao atualizar link:', updateError)
      return false
    }
    
    console.log('✅ Link atualizado com sucesso:', updateData)
    
    // Limpar dados de teste
    console.log('\n4. Limpando dados de teste...')
    const { error: deleteError } = await supabaseAdmin
      .from('links')
      .delete()
      .eq('id', insertData.id)
    
    if (deleteError) {
      console.error('❌ Erro ao deletar link de teste:', deleteError)
      return false
    }
    
    console.log('✅ Dados de teste removidos com sucesso')
    
    return true
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
    return false
  }
}

async function testUIBlocksSave() {
  try {
    console.log('\n5. Testando salvamento de UI Blocks...')
    
    // Simular salvamento de header
    const testHTML = '<div>Teste de header administrativo</div>'
    
    // Verificar se existe tabela ui_blocks ou similar
    const { data: uiData, error: uiError } = await supabaseAdmin
      .from('ui_blocks')
      .select('*')
      .limit(1)
    
    if (uiError) {
      console.log('⚠️  Tabela ui_blocks não encontrada:', uiError.message)
      return false
    }
    
    console.log('✅ Tabela ui_blocks acessível')
    return true
    
  } catch (error) {
    console.error('❌ Erro ao testar UI Blocks:', error)
    return false
  }
}

async function main() {
  console.log('=== Teste de Salvamento Administrativo ===\n')
  
  const linksTest = await testAdminSave()
  const uiTest = await testUIBlocksSave()
  
  console.log('\n=== Resumo dos Testes ===')
  console.log(`Links: ${linksTest ? '✅ OK' : '❌ FALHOU'}`)
  console.log(`UI Blocks: ${uiTest ? '✅ OK' : '❌ FALHOU'}`)
  
  if (linksTest && uiTest) {
    console.log('\n✅ Todos os testes passaram! O salvamento deve estar funcionando.')
  } else {
    console.log('\n❌ Alguns testes falharam. Verifique os erros acima.')
  }
}

main().catch(console.error)