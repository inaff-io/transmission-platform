import pg from 'pg'
const { Pool } = pg

async function checkUsers() {
  console.log('Verificando usuários no banco...')
  
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
    // Lista todos os usuários
    const result = await client.query('SELECT * FROM public.usuarios')
    
    console.log('Usuários encontrados:', result.rows)
    console.log('\nTotal de usuários:', result.rows.length)

    // Verifica especificamente os usuários que tentamos criar
    const specific = await client.query(`
      SELECT * FROM public.usuarios 
      WHERE email IN ($1, $2)
    `, ['pecosta26@gmail.com', 'joao.silva@gmail.com'])

    console.log('\nUsuários específicos:', specific.rows)

  } catch (err) {
    console.error('Erro:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

checkUsers()
