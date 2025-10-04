import pg from 'pg';

const client = new pg.Client({
  user: 'postgres.apamlthhsppsjvbxzouv',
  password: 'Sucesso@1234',
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function testDifferentLink() {
  try {
    await client.connect();
    console.log('✓ Conectado ao PostgreSQL\n');

    // URLs de teste para programação
    const testLinks = [
      {
        name: 'Google Calendar Embed (Teste 1)',
        url: 'https://calendar.google.com/calendar/embed?src=pt.brazilian%23holiday%40group.v.calendar.google.com&ctz=America%2FSao_Paulo'
      },
      {
        name: 'Wikipedia (Teste 2)',
        url: 'https://pt.wikipedia.org/wiki/Brasil'
      },
      {
        name: 'Example.com (Teste 3)',
        url: 'https://example.com'
      }
    ];

    console.log('📋 URLs de teste disponíveis:\n');
    testLinks.forEach((link, index) => {
      console.log(`${index + 1}. ${link.name}`);
      console.log(`   URL: ${link.url}\n`);
    });

    // Vou usar o Google Calendar como teste (geralmente permite iframe)
    const testLink = testLinks[0];
    
    console.log(`🔄 Inserindo link de teste: ${testLink.name}\n`);

    // Primeiro, deleta links de programação antigos
    await client.query(`DELETE FROM links WHERE tipo = 'programacao'`);
    console.log('✓ Links antigos removidos\n');

    // Cria o iframe HTML com todas as permissões
    const iframeHtml = `<iframe src="${testLink.url}" style="width:100%; height:100%; border:none;" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" allowfullscreen></iframe>`;

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
    console.log('  Nome:', testLink.name);
    console.log('  URL original:', testLink.url);
    console.log('\n  Iframe HTML gerado:');
    console.log('  ' + iframeHtml.substring(0, 100) + '...\n');

    console.log('🎯 Próximos passos:');
    console.log('  1. Abra http://localhost:3002/transmission no navegador');
    console.log('  2. Verifique se o link de teste aparece na seção "Programação"');
    console.log('  3. Se aparecer, significa que o sistema está funcionando!');
    console.log('  4. Se não aparecer, pode ser restrição do site externo\n');

    console.log('💡 Para testar outros links:');
    console.log('  - Edite este arquivo e mude testLinks[0] para [1] ou [2]');
    console.log('  - Ou adicione sua própria URL ao array testLinks\n');

  } catch (error) {
    console.error('✗ Erro:', error);
  } finally {
    await client.end();
  }
}

testDifferentLink();
