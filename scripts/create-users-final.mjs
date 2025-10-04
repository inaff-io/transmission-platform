import pg from 'pg'
const { Pool } = pg

async function createUsers() {
  console.log('Iniciando criação de usuários...')
  
  const pool = new Pool({
    user: 'postgres',
    password: 'Sucesso@1234',
    host: 'db.ywcmqgfbxrejuwcbeolu.supabase.co',
    port: 5432,
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    }
  })
  
  const client = await pool.connect()
  
  try {
    // Inicia uma transação
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
          'Pedro Costa',
          'pecosta26@gmail.com',
          '05701807401',
          true,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        ),
        (
          gen_random_uuid(),
          'João Silva',
          'joao.silva@gmail.com',
          '12345678900',
          true,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      ON CONFLICT (email) DO NOTHING
      RETURNING *;
    `

    const result = await client.query(insertQuery)
    
    // Confirma a transação
    await client.query('COMMIT')

    if (result.rows.length > 0) {
      console.log('Usuários criados:', result.rows)
    } else {
      console.log('Usuários já existem no banco.')
      
      // Lista os usuários existentes
      const existingUsers = await client.query('SELECT * FROM public.usuarios WHERE email IN ($1, $2)', [
        'pecosta26@gmail.com',
        'joao.silva@gmail.com'
      ])
      
      console.log('Usuários encontrados:', existingUsers.rows)
    }

  } catch (err) {
    // Reverte a transação em caso de erro
    await client.query('ROLLBACK')
    console.error('Erro:', err)
  } finally {
    // Libera o cliente
    client.release()
    // Fecha o pool de conexões
    await pool.end()
  }
}

createUsers()
