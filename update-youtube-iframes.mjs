import pg from 'pg';

const client = new pg.Client({
  user: 'postgres.apamlthhsppsjvbxzouv',
  password: 'Sucesso@1234',
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function updateYouTubeIframes() {
  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL');
    
    // Buscar links do YouTube com iframe antigo (sem wrapper div)
    const result = await client.query(`
      SELECT * FROM links 
      WHERE tipo = 'transmissao' 
      AND url LIKE '%youtube.com/embed%'
      AND url LIKE '%<iframe%'
      AND url NOT LIKE '%<div%'
    `);
    
    console.log(`\n📊 Encontrados ${result.rows.length} links do YouTube para atualizar\n`);
    
    if (result.rows.length === 0) {
      console.log('Nenhum link para atualizar!');
      return;
    }
    
    // Atualizar cada link
    for (const link of result.rows) {
      console.log(`🔄 Atualizando link: ${link.id}`);
      
      // Extrai o ID do vídeo do iframe
      const match = link.url.match(/youtube\.com\/embed\/([^"?]+)/);
      if (match && match[1]) {
        const videoId = match[1];
        
        // Cria o novo iframe com wrapper responsivo
        const newUrl = `<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;"></iframe></div>`;
        
        console.log(`   Video ID: ${videoId}`);
        console.log(`   Novo formato: ${newUrl.substring(0, 100)}...`);
        
        // Atualiza no banco
        await client.query(`
          UPDATE links 
          SET url = $1, atualizado_em = NOW() 
          WHERE id = $2
        `, [newUrl, link.id]);
        
        console.log(`   ✅ Link atualizado com sucesso!\n`);
      }
    }
    
    // Verifica os links atualizados
    const finalResult = await client.query(`
      SELECT id, tipo, LEFT(url, 120) as url_preview 
      FROM links 
      WHERE tipo = 'transmissao'
      ORDER BY created_at DESC
    `);
    
    console.log('\n📋 Links de transmissão após atualização:');
    console.table(finalResult.rows);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

updateYouTubeIframes();
