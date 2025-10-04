import pg from 'pg';

const client = new pg.Client({
  user: 'postgres.apamlthhsppsjvbxzouv',
  password: 'Sucesso@1234',
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function activateProgramacaoLink() {
  try {
    await client.connect();
    console.log('✓ Conectado ao PostgreSQL\n');

    // Desativa todos os links de programação primeiro
    await client.query(`
      UPDATE links 
      SET ativo_em = NULL 
      WHERE tipo = 'programacao'
    `);
    console.log('✓ Todos os links de programação desativados\n');

    // Insere um novo link ativo com iframe completo
    const iframeHtml = '<iframe src="https://inaff.iweventos.com.br/evento/atsmt2025/programacao/lista" style="width:100%; height:100%; border:none;" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads" allowfullscreen></iframe>';
    
    const result = await client.query(`
      INSERT INTO links (tipo, url, ativo_em, atualizado_em, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW(), NOW(), NOW())
      RETURNING id, ativo_em
    `, ['programacao', iframeHtml]);

    console.log('✅ Novo link de programação ATIVO criado!');
    console.log(`   ID: ${result.rows[0].id}`);
    console.log(`   Ativo desde: ${result.rows[0].ativo_em}`);
    console.log(`\n📝 HTML do iframe:`);
    console.log(iframeHtml);
    console.log(`\n🌐 Verifique agora em:`);
    console.log(`   → http://localhost:3002/transmission`);
    console.log(`   → http://localhost:3002/programacao`);
    console.log(`\n✨ O iframe deve aparecer agora!`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada');
  }
}

activateProgramacaoLink();
