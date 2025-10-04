import pg from 'pg';

const client = new pg.Client({
  user: 'postgres.apamlthhsppsjvbxzouv',
  password: 'Sucesso@1234',
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkLinks() {
  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL\n');
    
    const result = await client.query(`SELECT * FROM links ORDER BY created_at DESC`);
    
    console.log(`📊 Total de links: ${result.rows.length}\n`);
    
    result.rows.forEach((link, i) => {
      console.log(`🔗 Link ${i + 1}:`);
      console.log(`   ID: ${link.id}`);
      console.log(`   Tipo: ${link.tipo}`);
      console.log(`   URL (início): ${link.url.substring(0, 150)}`);
      console.log(`   Tem <div: ${link.url.includes('<div')}`);
      console.log(`   Tem <iframe: ${link.url.includes('<iframe')}`);
      console.log(`   Created: ${link.created_at}\n`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkLinks();
