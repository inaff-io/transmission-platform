import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

// Load environment variables from .env.local
const envPath = join(projectRoot, '.env.local')
const envConfig = dotenv.parse(fs.readFileSync(envPath))

// Set environment variables
for (const key in envConfig) {
  process.env[key] = envConfig[key]
}

console.log('Checking database tables...\n')

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTable(tableName) {
  try {
    console.log(`Checking table '${tableName}'...`)
    
    // Try to select from the table
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .limit(1)
    
    if (error) {
      console.log(`❌ Table '${tableName}' error:`, error.message)
      return false
    } else {
      console.log(`✅ Table '${tableName}' exists and is accessible`)
      console.log(`   Sample data count: ${data ? data.length : 0}`)
      if (data && data.length > 0) {
        console.log(`   Sample record:`, Object.keys(data[0]))
      }
      return true
    }
  } catch (err) {
    console.log(`❌ Table '${tableName}' error:`, err.message)
    return false
  }
}

async function main() {
  console.log('=== Database Tables Check ===\n')
  
  const linksExists = await checkTable('links')
  console.log()
  
  const programacoesExists = await checkTable('programacoes')
  console.log()
  
  console.log('=== Summary ===')
  console.log(`Links table: ${linksExists ? '✅ OK' : '❌ Missing'}`)
  console.log(`Programacoes table: ${programacoesExists ? '✅ OK' : '❌ Missing'}`)
  
  if (!linksExists && !programacoesExists) {
    console.log('\n⚠️  Both tables are missing! The API will not work properly.')
  } else if (!linksExists) {
    console.log('\n⚠️  Links table is missing, but programacoes table exists as fallback.')
  } else if (!programacoesExists) {
    console.log('\n⚠️  Programacoes table is missing, but links table exists.')
  } else {
    console.log('\n✅ Both tables exist and are accessible!')
  }
}

main().catch(console.error)