import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Configuração do dotenv
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

const { Pool } = pg

async function checkConnection() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    console.log('Conectando ao banco de dados...')
    const client = await pool.connect()
    console.log('Conexão estabelecida com sucesso!')

    // Verifica se a tabela usuarios existe
    const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)
    console.log('\nTabelas encontradas:')
    tables.forEach(table => console.log('-', table.table_name))

    // Tenta buscar usuários
    try {
      const { rows: users } = await client.query('SELECT * FROM usuarios')
      console.log('\nUsuários encontrados:', users.length)
      users.forEach(user => {
        console.log('- Nome:', user.nome)
        console.log('  Email:', user.email)
        console.log('  CPF:', user.cpf)
        console.log('  Categoria:', user.categoria)
        console.log('---')
      })
    } catch (error) {
      console.log('\nNão foi possível buscar usuários:', error.message)
    }

    client.release()
  } catch (error) {
    console.error('Erro:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

checkConnection()