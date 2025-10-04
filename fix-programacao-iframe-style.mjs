import pg from 'pg';

// Configuração do cliente PostgreSQL
const client = new pg.Client({
  user: 'postgres.apamlthhsppsjvbxzouv',
  password: 'Sucesso@1234',
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixProgramacaoIframeStyle() {
  try {
    await client.connect();
    console.log('✓ Conectado ao PostgreSQL');

    // Busca links de programação
    const result = await client.query(`
      SELECT id, url
      FROM links
      WHERE tipo = 'programacao'
    `);

    console.log(`\n📊 Links de programação encontrados: ${result.rows.length}`);

    for (const link of result.rows) {
      console.log(`\n🔍 Analisando link ID: ${link.id}`);
      
      // Verifica se é um iframe
      if (link.url.includes('<iframe')) {
        console.log('  → É um iframe');
        
        // Verifica se tem o estilo antigo (sem position: absolute)
        if (!link.url.includes('position: absolute')) {
          console.log('  ⚠️  Iframe sem position: absolute - precisa corrigir');
          
          // Extrai o src do iframe
          const srcMatch = link.url.match(/src="([^"]+)"/);
          if (srcMatch) {
            const src = srcMatch[1];
            console.log(`  📍 URL extraída: ${src}`);
            
            // Constrói o novo iframe com position absolute
            const newIframe = `<iframe src="${src}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
            
            // Atualiza no banco
            const now = new Date().toISOString();
            await client.query(`
              UPDATE links
              SET url = $1, atualizado_em = $2, updated_at = $3
              WHERE id = $4
            `, [newIframe, now, now, link.id]);
            
            console.log('  ✅ Iframe atualizado com sucesso!');
            console.log(`  📝 Novo formato: <iframe src="${src}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" ...>`);
          } else {
            console.log('  ❌ Não foi possível extrair o src do iframe');
          }
        } else {
          console.log('  ✅ Iframe já está com position: absolute - OK!');
        }
      } else {
        console.log('  → Não é um iframe HTML, é uma URL simples');
      }
    }

    console.log('\n✅ Processo concluído!');
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada');
  }
}

fixProgramacaoIframeStyle();
