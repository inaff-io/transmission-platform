import pg from 'pg';

const client = new pg.Client({
  user: 'postgres.apamlthhsppsjvbxzouv',
  password: 'Sucesso@1234',
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function updateOldIframe() {
  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL');
    
    // Buscar links de programação com sandbox
    const result = await client.query(`
      SELECT * FROM links 
      WHERE tipo = 'programacao' 
      AND url LIKE '%sandbox=%'
    `);
    
    console.log(`\n📊 Encontrados ${result.rows.length} links com sandbox\n`);
    
    if (result.rows.length === 0) {
      console.log('Nenhum link para atualizar!');
      return;
    }
    
    // Atualizar cada link
    for (const link of result.rows) {
      console.log(`🔄 Atualizando link: ${link.id}`);
      console.log(`   URL antiga: ${link.url.substring(0, 80)}...`);
      
      // Extrai a URL do iframe antigo
      const match = link.url.match(/src="([^"]+)"/);
      if (match && match[1]) {
        const srcUrl = match[1];
        
        // Cria o novo iframe sem sandbox
        const newUrl = `<iframe src="${srcUrl}" style="width:100%; height:100%; border:none;" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
        
        console.log(`   URL nova: ${newUrl.substring(0, 80)}...`);
        
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
      SELECT id, tipo, LEFT(url, 100) as url_preview 
      FROM links 
      WHERE tipo = 'programacao'
      ORDER BY created_at DESC
    `);
    
    console.log('\n📋 Links de programação após atualização:');
    console.table(finalResult.rows);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

updateOldIframe();
