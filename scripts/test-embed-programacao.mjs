import pg from 'pg';

const client = new pg.Client({
  user: 'postgres.apamlthhsppsjvbxzouv',
  password: 'Sucesso@1234',
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function testEmbedProgramacao() {
  try {
    await client.connect();
    console.log('✓ Conectado ao PostgreSQL\n');

    // Desativa todos os links de programação existentes
    await client.query(`
      UPDATE links 
      SET ativo_em = NULL 
      WHERE tipo = 'programacao'
    `);
    console.log('✓ Links antigos desativados\n');

    // Testa diferentes formatos de embed
    const testFormats = [
      {
        name: 'URL Embed Direta',
        url: 'https://inaff.iweventos.com.br/evento/atsmt2025/programacao/lista/embed'
      },
      {
        name: 'Iframe Simples com Embed',
        url: '<iframe src="https://inaff.iweventos.com.br/evento/atsmt2025/programacao/lista/embed" style="width:100%; height:100%; border:none;" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>'
      },
      {
        name: 'Iframe com Sandbox e Embed',
        url: '<iframe src="https://inaff.iweventos.com.br/evento/atsmt2025/programacao/lista/embed" style="width:100%; height:100%; border:none;" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads" allowfullscreen></iframe>'
      },
      {
        name: 'Iframe via Proxy com Embed',
        url: '<iframe src="/api/iframe-proxy?url=https://inaff.iweventos.com.br/evento/atsmt2025/programacao/lista/embed" style="width:100%; height:100%; border:none;" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads" allowfullscreen></iframe>'
      },
      {
        name: 'URL Lista (sem embed)',
        url: 'https://inaff.iweventos.com.br/evento/atsmt2025/programacao/lista'
      }
    ];

    console.log('🧪 Testando formatos de embed:\n');

    for (let i = 0; i < testFormats.length; i++) {
      const format = testFormats[i];
      console.log(`\n${i + 1}. Testando: ${format.name}`);
      console.log('─'.repeat(60));

      // Insere o link de teste
      const result = await client.query(`
        INSERT INTO links (tipo, url, ativo_em, atualizado_em, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW(), NOW(), NOW())
        RETURNING id
      `, ['programacao', format.url]);

      console.log(`   ✓ Link inserido com ID: ${result.rows[0].id}`);
      console.log(`   📝 URL: ${format.url.substring(0, 80)}${format.url.length > 80 ? '...' : ''}`);
      console.log(`\n   🌐 Aguarde 5 segundos e verifique em:`);
      console.log(`   → http://localhost:3002/transmission`);
      console.log(`   → http://localhost:3002/programacao`);
      
      // Aguarda 10 segundos para teste
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Desativa este link
      await client.query('UPDATE links SET ativo_em = NULL WHERE id = $1', [result.rows[0].id]);
      console.log(`   ✓ Link desativado\n`);
    }

    console.log('\n✅ Testes concluídos!');
    console.log('\n📊 Qual formato funcionou melhor?');
    console.log('   1. URL Embed Direta');
    console.log('   2. Iframe Simples com Embed');
    console.log('   3. Iframe com Sandbox e Embed');
    console.log('   4. Iframe via Proxy com Embed');
    console.log('   5. URL Lista (sem embed)');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada');
  }
}

testEmbedProgramacao();
