import pg from 'pg';

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

async function insertTestLink() {
  try {
    await client.connect();
    
    // Remover link anterior de programação se existir
    await client.query(`
      DELETE FROM links 
      WHERE tipo = 'programacao'
    `);
    
    // Inserir novo link com proxy interno
    const iframeHtml = `<iframe 
      src="/api/proxy-secure" 
      style="width:100%; height:100%; border:none;" 
      allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
      allowfullscreen
    ></iframe>`;
    
    await client.query(`
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
      )
    `, [iframeHtml]);
    
    console.log('✅ Link inserido com sucesso!');
    console.log('📝 HTML inserido:');
    console.log(iframeHtml);
    console.log('\nPor favor, verifique a página:');
    console.log('http://localhost:3002/transmission');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
  }
}

insertTestLink();