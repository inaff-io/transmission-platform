import pg from 'pg';

const client = new pg.Client({
  user: 'postgres.apamlthhsppsjvbxzouv',
  password: 'Sucesso@1234',
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function insertTestLink() {
  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL');
    
    const now = new Date().toISOString();
    
    // Inserir novo link de transmissão
    const result = await client.query(`
      INSERT INTO links (tipo, url, ativo_em, atualizado_em, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      'transmissao',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      now,
      now,
      now,
      now
    ]);
    
    console.log('\n✅ Link inserido com sucesso!');
    console.log(JSON.stringify(result.rows[0], null, 2));
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

insertTestLink();
