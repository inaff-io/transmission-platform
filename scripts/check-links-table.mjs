import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = new pg.Client({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

await client.connect();

const res = await client.query(`
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'links' 
  ORDER BY ordinal_position
`);

console.log('\n📋 Estrutura da tabela links:\n');
res.rows.forEach(r => {
  console.log(`   ${r.column_name} (${r.data_type})`);
});

const count = await client.query('SELECT COUNT(*) as total FROM links');
console.log(`\n📊 Total de links: ${count.rows[0].total}\n`);

await client.end();
