import pg from 'pg';

const client = new pg.Client({
  user: 'postgres.apamlthhsppsjvbxzouv',
  password: 'Sucesso@1234',
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function restoreOriginalLink() {
  try {
    await client.connect();
    console.log('✓ Conectado ao PostgreSQL\n');

    // Link original de programação
    const originalUrl = 'https://inaff.iweventos.com.br/evento/atsmt2025/programacao/lista';
    const iframeHtml = `<iframe src="${originalUrl}" style="width:100%; height:100%; border:none;" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" allowfullscreen></iframe>`;

    console.log('🔄 Restaurando link original de programação...\n');

    // Deleta links de programação de teste
    await client.query(`DELETE FROM links WHERE tipo = 'programacao'`);

    // Insere o link original de volta
    const result = await client.query(`
      INSERT INTO links (tipo, url, ativo_em, atualizado_em, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW(), NOW(), NOW())
      RETURNING id
    `, ['programacao', iframeHtml]);

    console.log('✅ Link original restaurado com sucesso!\n');
    console.log('📝 Detalhes:');
    console.log('  ID:', result.rows[0].id);
    console.log('  URL:', originalUrl);
    console.log('\n✓ A programação original voltou!\n');

  } catch (error) {
    console.error('✗ Erro:', error);
  } finally {
    await client.end();
  }
}

restoreOriginalLink();
