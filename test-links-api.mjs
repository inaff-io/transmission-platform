import pg from 'pg';

const client = new pg.Client({
  user: 'postgres.apamlthhsppsjvbxzouv',
  password: 'Sucesso@1234',
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL');
    
    // Buscar links
    const linksResult = await client.query(`
      SELECT * FROM links 
      ORDER BY atualizado_em DESC NULLS LAST, ativo_em DESC NULLS LAST
    `);
    console.log('\n📊 Links encontrados:', linksResult.rows.length);
    console.log(JSON.stringify(linksResult.rows, null, 2));
    
    // Buscar programações
    const progResult = await client.query(`
      SELECT id, titulo, url_iframe, ordem, created_at, updated_at 
      FROM programacoes 
      ORDER BY ordem DESC
    `);
    console.log('\n📋 Programações encontradas:', progResult.rows.length);
    console.log(JSON.stringify(progResult.rows, null, 2));
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

test();
