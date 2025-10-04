import pg from 'pg';

const client = new pg.Client({
  user: 'postgres.apamlthhsppsjvbxzouv',
  password: 'Sucesso@1234',
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function fixProgramacaoIframe() {
  try {
    await client.connect();
    console.log('✓ Conectado ao PostgreSQL\n');

    // Busca o link de programação
    const result = await client.query(`
      SELECT id, url
      FROM links
      WHERE tipo = 'programacao'
    `);

    if (result.rows.length === 0) {
      console.log('❌ Nenhum link de programação encontrado\n');
      return;
    }

    const link = result.rows[0];
    console.log('📋 Link encontrado:', link.id);
    console.log('URL anterior (primeiros 150 chars):');
    console.log(link.url.substring(0, 150) + '...\n');

    // Corrige o iframe removendo espaços extras
    let newUrl = link.url;
    
    // Remove espaços duplos antes de allow
    newUrl = newUrl.replace(/\s+allow=/g, ' allow=');
    
    // Remove espaços extras em geral
    newUrl = newUrl.replace(/\s{2,}/g, ' ');
    
    // Garante que não há espaços antes de >
    newUrl = newUrl.replace(/\s+>/g, '>');
    
    // Padroniza aspas
    newUrl = newUrl.replace(/'/g, '"');

    if (newUrl !== link.url) {
      await client.query(
        'UPDATE links SET url = $1, updated_at = NOW() WHERE id = $2',
        [newUrl, link.id]
      );
      
      console.log('✅ Iframe corrigido!');
      console.log('\nURL nova (primeiros 150 chars):');
      console.log(newUrl.substring(0, 150) + '...\n');
    } else {
      console.log('✓ Iframe já está correto, nenhuma alteração necessária\n');
    }

  } catch (error) {
    console.error('✗ Erro:', error);
  } finally {
    await client.end();
  }
}

fixProgramacaoIframe();
