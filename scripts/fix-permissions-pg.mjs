import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Configuração do dotenv
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

const { Pool } = pg

async function fixPermissions() {
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

    console.log('Corrigindo permissões...')
    
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

    await client.query(sql)
    console.log('Permissões corrigidas com sucesso!')

    // Teste de conexão
    const { rows } = await client.query('SELECT NOW()')
    console.log('Teste de conexão bem sucedido:', rows[0].now)

    client.release()
  } catch (error) {
    console.error('Erro:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

fixPermissions()