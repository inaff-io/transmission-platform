import pg from 'pg';

const client = new pg.Client({
  user: 'postgres.apamlthhsppsjvbxzouv',
  password: 'Sucesso@1234',
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function updateProgramacaoIframeStyles() {
  try {
    await client.connect();
    console.log('✓ Conectado ao PostgreSQL\n');

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
    console.log('📋 Atualizando iframe de programação...\n');
    console.log('ID:', link.id);
    console.log('\nURL anterior:');
    console.log(link.url.substring(0, 150) + '...\n');

    // Corrige o iframe para ter os estilos corretos
    const newUrl = `<iframe src="https://inaff.iweventos.com.br/evento/atsmt2025/programacao/lista" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" allowfullscreen></iframe>`;

    await client.query(
      'UPDATE links SET url = $1, updated_at = NOW() WHERE id = $2',
      [newUrl, link.id]
    );

    console.log('✅ Iframe atualizado com sucesso!\n');
    console.log('Nova URL:');
    console.log(newUrl);
    console.log('\n');
    console.log('Mudanças aplicadas:');
    console.log('  ✓ Adicionado: position: absolute');
    console.log('  ✓ Adicionado: top: 0; left: 0');
    console.log('  ✓ Mantido: width: 100%; height: 100%');
    console.log('  ✓ Mantido: border: none');
    console.log('  ✓ Mantido: allow com todas as permissões');
    console.log('  ✓ Mantido: allowfullscreen\n');

  } catch (error) {
    console.error('✗ Erro:', error);
  } finally {
    await client.end();
  }
}

updateProgramacaoIframeStyles();
