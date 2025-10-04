import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

// Configuração do dotenv
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

const { Pool } = pg

async function createTables() {
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

    // Lê o arquivo SQL
    const sqlPath = path.resolve(__dirname, 'create-tables-pg.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    // Executa o SQL
    console.log('Criando tabelas...')
    await client.query(sql)
    console.log('Tabelas criadas com sucesso!')

    // Verifica as tabelas criadas
    const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)
    console.log('\nTabelas encontradas:')
    tables.forEach(table => console.log('-', table.table_name))

    // Verifica os usuários criados
    const { rows: users } = await client.query('SELECT * FROM usuarios')
    console.log('\nUsuários encontrados:', users.length)
    users.forEach(user => {
      console.log('- Nome:', user.nome)
      console.log('  Email:', user.email)
      console.log('  CPF:', user.cpf)
      console.log('  Categoria:', user.categoria)
      console.log('---')
    })

    client.release()
  } catch (error) {
    console.error('Erro:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

createTables()