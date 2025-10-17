import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' });

const { Pool } = pg

async function createLoadTestUser() {
  console.log('Iniciando criação do usuário de teste de carga...')
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })
  
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    const insertQuery = `
      INSERT INTO public.usuarios (
        id,
        nome,
        email,
        cpf,
        status,
        created_at,
        updated_at
      )
      VALUES 
        (
          gen_random_uuid(),
          'Load Test User',
          'loadtestuser@example.com',
          '00000000000',
          true,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      ON CONFLICT (email) DO NOTHING
      RETURNING *;
    `

    const result = await client.query(insertQuery)
    
    await client.query('COMMIT')

    if (result.rows.length > 0) {
      console.log('Usuário de teste de carga criado:', result.rows[0])
    } else {
      console.log('Usuário de teste de carga já existe no banco.')
      const existingUser = await client.query('SELECT * FROM public.usuarios WHERE email = $1', ['loadtestuser@example.com'])
      console.log('Usuário encontrado:', existingUser.rows[0])
    }

  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Erro:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

createLoadTestUser()