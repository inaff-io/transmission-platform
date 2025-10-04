import pg from 'pg';

const client = new pg.Client({
  user: 'postgres.apamlthhsppsjvbxzouv',
  password: 'Sucesso@1234',
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function updateYoutubeIframeWithOverlay() {
  try {
    await client.connect();
    console.log('✓ Conectado ao PostgreSQL\n');

    // Desativa todos os links de transmissão existentes
    await client.query(`
      UPDATE links 
      SET ativo_em = NULL 
      WHERE tipo = 'transmissao'
    `);
    console.log('✓ Todos os links de transmissão desativados\n');

    // Iframe do YouTube com div overlay que bloqueia cliques em certas áreas
    const youtubeIframeWithOverlay = `
<div style="position: relative; width: 100%; height: 100%;">
  <iframe 
    src="https://www.youtube.com/embed/pUHzOcFgAvI?si=vbnM8bIQYST5PgpO&controls=1&modestbranding=1&rel=0&showinfo=0&fs=1&cc_load_policy=0&iv_load_policy=3&autohide=1" 
    title="YouTube video player" 
    style="width:100%; height:100%; border:none; position: absolute; top: 0; left: 0;" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
    referrerpolicy="strict-origin-when-cross-origin" 
    allowfullscreen>
  </iframe>
  <!-- Overlay no canto superior direito para bloquear botão "Assistir no YouTube" -->
  <div style="position: absolute; top: 10px; right: 10px; width: 80px; height: 40px; background: transparent; z-index: 10; pointer-events: all;"></div>
  <!-- Overlay no canto inferior direito para bloquear botões de compartilhar/info -->
  <div style="position: absolute; bottom: 10px; right: 10px; width: 150px; height: 40px; background: transparent; z-index: 10; pointer-events: all;"></div>
</div>`.trim();
    
    // Insere o novo link ativo
    const result = await client.query(`
      INSERT INTO links (tipo, url, ativo_em, atualizado_em, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW(), NOW(), NOW())
      RETURNING id, ativo_em
    `, ['transmissao', youtubeIframeWithOverlay]);

    console.log('✅ Novo iframe do YouTube com OVERLAY criado!');
    console.log(`   ID: ${result.rows[0].id}`);
    console.log(`   Ativo desde: ${result.rows[0].ativo_em}`);
    console.log(`\n📝 Estratégia aplicada:`);
    console.log(`   ✓ Iframe com parâmetros restritivos`);
    console.log(`   ✓ Overlay transparente no canto superior direito (bloqueia "Assistir no YouTube")`);
    console.log(`   ✓ Overlay transparente no canto inferior direito (bloqueia compartilhar/info)`);
    console.log(`   ✓ pointer-events: all nos overlays para interceptar cliques`);
    console.log(`\n⚠️  LIMITAÇÕES:`);
    console.log(`   - Os botões ainda serão VISÍVEIS, mas não funcionarão quando clicados`);
    console.log(`   - Em fullscreen, os overlays podem não funcionar`);
    console.log(`   - O usuário pode inspecionar o código e remover os overlays`);
    console.log(`\n🌐 Verifique agora em:`);
    console.log(`   → http://localhost:3002/transmission`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada');
  }
}

updateYoutubeIframeWithOverlay();
