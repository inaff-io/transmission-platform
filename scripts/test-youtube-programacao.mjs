import pg from 'pg';

const client = new pg.Client({
  user: 'postgres.apamlthhsppsjvbxzouv',
  password: 'Sucesso@1234',
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function insertSimpleTestLink() {
  try {
    await client.connect();
    console.log('✓ Conectado ao PostgreSQL\n');

    // Link super simples de teste - YouTube embed direto
    const youtubeTestUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ'; // Rick Astley - Never Gonna Give You Up
    
    console.log('🔄 Inserindo link de teste SUPER SIMPLES (YouTube embed direto)...\n');

    // Deleta links de programação antigos
    await client.query(`DELETE FROM links WHERE tipo = 'programacao'`);
    console.log('✓ Links antigos removidos\n');

    // Cria o iframe HTML mais simples possível
    const iframeHtml = `<iframe src="${youtubeTestUrl}" style="width:100%; height:100%; border:none;" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" allowfullscreen></iframe>`;

    // Insere o novo link de teste
    const result = await client.query(`
      INSERT INTO links (tipo, url, ativo_em, atualizado_em, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW(), NOW(), NOW())
      RETURNING id, tipo, url
    `, ['programacao', iframeHtml]);

    console.log('✅ Link de teste inserido com sucesso!\n');
    console.log('📝 Detalhes:');
    console.log('  ID:', result.rows[0].id);
    console.log('  Tipo:', result.rows[0].tipo);
    console.log('  URL:', youtubeTestUrl);
    console.log('  Descrição: YouTube embed direto (Rick Astley)\n');
    
    console.log('  Iframe HTML completo:');
    console.log('  ' + iframeHtml + '\n');

    console.log('🎯 Este é o teste mais simples possível!');
    console.log('  - YouTube SEMPRE funciona em iframe');
    console.log('  - Se não aparecer, o problema é na renderização do frontend\n');

    console.log('📊 O que verificar agora:');
    console.log('  1. Abra http://localhost:3002/transmission');
    console.log('  2. Abra DevTools (F12) > Console');
    console.log('  3. Veja se há algum erro JavaScript');
    console.log('  4. Vá na aba Elements/Elementos');
    console.log('  5. Procure por: <section class="w-full xl:w-[30%]');
    console.log('  6. Veja se o iframe está lá dentro\n');

  } catch (error) {
    console.error('✗ Erro:', error);
  } finally {
    await client.end();
  }
}

insertSimpleTestLink();
