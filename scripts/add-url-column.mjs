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

async function addUrlColumn() {
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
    const sqlPath = path.resolve(__dirname, 'add-url-column.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    // Executa o SQL
    console.log('Adicionando coluna url...')
    await client.query(sql)
    console.log('Coluna url adicionada com sucesso!')

    // Verifica a estrutura da tabela
    const { rows } = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'programacoes'
      ORDER BY ordinal_position
    `)
    
    console.log('\nEstrutura atual da tabela programacoes:')
    rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`)
    })

    client.release()
  } catch (error) {
    console.error('Erro:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

addUrlColumn()