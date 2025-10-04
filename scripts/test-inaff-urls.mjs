import pg from 'pg';

// Função para criar um cliente PostgreSQL
function createPgClient() {
  return new pg.Client({
    user: 'postgres.apamlthhsppsjvbxzouv',
    password: 'Sucesso@1234',
    host: 'aws-1-sa-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    }
  });
}

// Lista de variações da URL para testar
const urlVariations = [
  'https://inaff.iweventos.com.br/evento/atsmt2025/programacao/lista',
  'https://inaff.iweventos.com.br/evento/atsmt2025/programacao',
  'https://inaff.iweventos.com.br/evento/atsmt2025/programacao/lista/embed',
  'https://inaff.iweventos.com.br/evento/atsmt2025/programacao/embed',
  'https://inaff.iweventos.com.br/evento/atsmt2025/programacao/lista/embed/web',
  'https://inaff.iweventos.com.br/evento/atsmt2025/programacao/lista?embed=true',
];

async function testUrl(url) {
  const client = createPgClient();
  
  try {
    await client.connect();
    console.log('\n🔄 Testando URL:', url);
    
    // Remover qualquer link de programação existente
    await client.query(`
      DELETE FROM links 
      WHERE tipo = 'programacao'
    `);
    
    // Inserir novo link com iframe
    const iframeHtml = `<iframe src="${url}" style="width:100%; height:100%; border:none;" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" allowfullscreen></iframe>`;
    
    const result = await client.query(`
      INSERT INTO links (
        tipo,
        url,
        ativo_em,
        atualizado_em,
        created_at,
        updated_at
      ) VALUES (
        'programacao',
        $1,
        NOW(),
        NOW(),
        NOW(),
        NOW()
      ) RETURNING *
    `, [iframeHtml]);

    console.log('✅ Link inserido com sucesso!');
    console.log('📋 HTML do iframe:');
    console.log(iframeHtml);
    console.log('\n⚠️ Por favor, verifique se o conteúdo aparece em:');
    console.log('http://localhost:3002/transmission');
    
    // Aguardar input do usuário
    console.log('\n❓ O conteúdo apareceu? [S/N]');
    process.stdout.write('> ');
    
    // Aguardar 10 segundos antes da próxima tentativa
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
  }
}

// Testar cada variação
async function runTests() {
  console.log('🚀 Iniciando testes de URLs...\n');
  
  for (const url of urlVariations) {
    await testUrl(url);
  }
  
  console.log('\n✨ Testes concluídos!');
  process.exit(0);
}

runTests();