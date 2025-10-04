import pg from 'pg';

const client = new pg.Client({
  user: 'postgres.apamlthhsppsjvbxzouv',
  password: 'Sucesso@1234',
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function updateYoutubeIframe() {
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

    // Iframe de incorporação do YouTube (adaptado para 100% de largura e altura)
    const youtubeIframe = '<iframe src="https://www.youtube.com/embed/pUHzOcFgAvI?si=vbnM8bIQYST5PgpO" title="YouTube video player" style="width:100%; height:100%; border:none;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
    
    // Insere o novo link ativo
    const result = await client.query(`
      INSERT INTO links (tipo, url, ativo_em, atualizado_em, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW(), NOW(), NOW())
      RETURNING id, ativo_em
    `, ['transmissao', youtubeIframe]);

    console.log('✅ Novo iframe do YouTube ATIVO criado!');
    console.log(`   ID: ${result.rows[0].id}`);
    console.log(`   Ativo desde: ${result.rows[0].ativo_em}`);
    console.log(`\n📝 HTML do iframe:`);
    console.log(youtubeIframe);
    console.log(`\n🌐 Verifique agora em:`);
    console.log(`   → http://localhost:3002/transmission`);
    console.log(`\n✨ O vídeo do YouTube deve aparecer agora usando o iframe de incorporação!`);
    console.log(`\nℹ️  O iframe foi ajustado para ocupar 100% da largura e altura do container.`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada');
  }
}

updateYoutubeIframe();
