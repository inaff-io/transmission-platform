import pg from 'pg';

const client = new pg.Client({
  user: 'postgres.apamlthhsppsjvbxzouv',
  password: 'Sucesso@1234',
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkCurrentLinks() {
  try {
    await client.connect();
    console.log('✓ Conectado ao PostgreSQL\n');

    // Verifica todos os links de programação
    const result = await client.query(`
      SELECT 
        id, 
        tipo, 
        LEFT(url, 100) as url_preview,
        ativo_em,
        atualizado_em,
        created_at
      FROM links 
      WHERE tipo = 'programacao'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log(`📊 Total de links de programação: ${result.rows.length}\n`);

    if (result.rows.length === 0) {
      console.log('⚠️  Nenhum link de programação encontrado!\n');
      return;
    }

    result.rows.forEach((link, index) => {
      console.log(`${index + 1}. Link ID: ${link.id}`);
      console.log(`   Tipo: ${link.tipo}`);
      console.log(`   Ativo em: ${link.ativo_em || 'DESATIVADO'}`);
      console.log(`   URL: ${link.url_preview}...`);
      console.log(`   Criado em: ${link.created_at}`);
      console.log('');
    });

    // Verifica quais links estão ATIVOS agora
    const activeResult = await client.query(`
      SELECT 
        id, 
        tipo, 
        LEFT(url, 100) as url_preview,
        ativo_em
      FROM links 
      WHERE tipo = 'programacao' AND ativo_em IS NOT NULL
      ORDER BY ativo_em DESC
    `);

    console.log('\n🟢 Links ATIVOS de programação:\n');
    if (activeResult.rows.length === 0) {
      console.log('⚠️  NENHUM link de programação está ATIVO no momento!\n');
      console.log('💡 Isso explica por que nada está aparecendo na página.\n');
    } else {
      activeResult.rows.forEach((link, index) => {
        console.log(`${index + 1}. Link ID: ${link.id}`);
        console.log(`   Ativo desde: ${link.ativo_em}`);
        console.log(`   URL: ${link.url_preview}...`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
    console.log('🔌 Conexão encerrada');
  }
}

checkCurrentLinks();
