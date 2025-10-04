import pg from 'pg';

const client = new pg.Client({
  user: 'postgres.apamlthhsppsjvbxzouv',
  password: 'Sucesso@1234',
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function updateYoutubeIframeRestricted() {
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

    // Iframe do YouTube com parâmetros que bloqueiam/ocultam botões:
    // - controls=1: Mostra controles básicos
    // - modestbranding=1: Remove logo do YouTube (deprecado mas ainda funciona em alguns casos)
    // - rel=0: Não mostra vídeos relacionados
    // - showinfo=0: Não mostra informações do vídeo (deprecado)
    // - fs=1: Permite fullscreen
    // - cc_load_policy=0: Não carrega legendas automaticamente
    // - iv_load_policy=3: Oculta anotações
    // - autohide=1: Oculta controles automaticamente
    const youtubeIframe = '<iframe src="https://www.youtube.com/embed/pUHzOcFgAvI?si=vbnM8bIQYST5PgpO&controls=1&modestbranding=1&rel=0&showinfo=0&fs=1&cc_load_policy=0&iv_load_policy=3&autohide=1" title="YouTube video player" style="width:100%; height:100%; border:none;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
    
    // Insere o novo link ativo
    const result = await client.query(`
      INSERT INTO links (tipo, url, ativo_em, atualizado_em, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW(), NOW(), NOW())
      RETURNING id, ativo_em
    `, ['transmissao', youtubeIframe]);

    console.log('✅ Novo iframe do YouTube RESTRITO criado!');
    console.log(`   ID: ${result.rows[0].id}`);
    console.log(`   Ativo desde: ${result.rows[0].ativo_em}`);
    console.log(`\n📝 Parâmetros aplicados:`);
    console.log(`   ✓ controls=1 - Mantém controles básicos (play/pause/volume)`);
    console.log(`   ✓ modestbranding=1 - Remove logo do YouTube`);
    console.log(`   ✓ rel=0 - Não mostra vídeos relacionados`);
    console.log(`   ✓ showinfo=0 - Oculta informações do vídeo`);
    console.log(`   ✓ fs=1 - Permite fullscreen`);
    console.log(`   ✓ cc_load_policy=0 - Não carrega legendas automaticamente`);
    console.log(`   ✓ iv_load_policy=3 - Oculta anotações`);
    console.log(`   ✓ autohide=1 - Oculta controles automaticamente`);
    console.log(`\n📝 HTML do iframe:`);
    console.log(youtubeIframe);
    console.log(`\n🌐 Verifique agora em:`);
    console.log(`   → http://localhost:3002/transmission`);
    console.log(`\n✨ O vídeo do YouTube deve aparecer com controles restritos!`);
    console.log(`\n⚠️  NOTA: O YouTube removeu alguns parâmetros (como mostrar/ocultar o botão`);
    console.log(`   "Assistir no YouTube"). Isso agora é controlado pelo YouTube e não pode`);
    console.log(`   ser totalmente removido via parâmetros do iframe.`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada');
  }
}

updateYoutubeIframeRestricted();
