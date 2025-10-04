import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function insertProgramacaoLink() {
  try {
    // Insert test programming link
    const { data, error } = await supabase
      .from('links')
      .insert([
        {
          tipo: 'programacao',
          url: 'https://www.youtube.com/embed/test-programacao'
        }
      ])
      .select()

    if (error) {
      console.error('Error inserting programming link:', error)
    } else {
      console.log('Programming link inserted successfully:', data)
    }

    // Fetch all programming links to verify
    const { data: allLinks, error: fetchError } = await supabase
      .from('links')
      .select('*')
      .eq('tipo', 'programacao')
      .order('created_at', { ascending: false })
      .limit(5)

    if (fetchError) {
      console.error('Error fetching programming links:', fetchError)
    } else {
      console.log('\nMost recent programming links in database:')
      console.table(allLinks)
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

insertProgramacaoLink()