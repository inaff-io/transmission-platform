import pg from 'pg';

const client = new pg.Client({
  user: 'postgres.apamlthhsppsjvbxzouv',
  password: 'Sucesso@1234',
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function activateYoutubeTransmission() {
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

    // URL do YouTube (pode ser no formato normal ou embed)
    const youtubeUrl = 'https://www.youtube.com/live/pUHzOcFgAvI?si=vbnM8bIQYST5PgpO';
    
    // Insere o novo link ativo
    const result = await client.query(`
      INSERT INTO links (tipo, url, ativo_em, atualizado_em, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW(), NOW(), NOW())
      RETURNING id, ativo_em
    `, ['transmissao', youtubeUrl]);

    console.log('✅ Novo link de transmissão do YouTube ATIVO criado!');
    console.log(`   ID: ${result.rows[0].id}`);
    console.log(`   Ativo desde: ${result.rows[0].ativo_em}`);
    console.log(`   URL: ${youtubeUrl}`);
    console.log(`\n🌐 Verifique agora em:`);
    console.log(`   → http://localhost:3002/transmission`);
    console.log(`\n✨ O vídeo do YouTube deve aparecer agora!`);
    console.log(`\nℹ️  O sistema vai detectar automaticamente que é um link do YouTube`);
    console.log(`   e renderizar usando o componente YouTubePlayer apropriado.`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada');
  }
}

activateYoutubeTransmission();
