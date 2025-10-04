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
    
    // Inserir novo link com as configurações especificadas
    const iframeHtml = `<iframe 
      src="https://inaff.iweventos.com.br/evento/atsmt2025/programacao/lista" 
      style="width:100%; height:100vh; border:none;"
      sandbox="allow-same-origin allow-scripts"
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