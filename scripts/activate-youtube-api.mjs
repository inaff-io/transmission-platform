import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  user: 'postgres.apamlthhsppsjvbxzouv',
  password: 'Sucesso@1234',
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  
  try {
    await client.connect();
    console.log('✓ Conectado ao PostgreSQL');
    
    // Desativa todos os links de transmissão atuais
    await client.query(`
      UPDATE links
      SET ativo_em = NULL
      WHERE tipo = 'transmissao'
        AND ativo_em IS NOT NULL
    `);
    console.log('✓ Todos os links de transmissão desativados');
    
    // Insere novo link informando que estamos usando YouTube API
    // O videoId será extraído pela aplicação
    const result = await client.query(`
      INSERT INTO links (tipo, url, ativo_em)
      VALUES ($1, $2, NOW())
      RETURNING *
    `, [
      'transmissao',
      'https://www.youtube.com/watch?v=pUHzOcFgAvI'
    ]);
    
    const link = result.rows[0];
    console.log('\n✅ Link do YouTube ativado para uso com YouTube IFrame API!');
    console.log('ID:', link.id);
    console.log('URL:', link.url);
    console.log('Ativo desde:', link.ativo_em);
    console.log('\nℹ️  A aplicação agora usa controles customizados com a YouTube IFrame Player API');
    console.log('✓ Sem botões "Assistir no YouTube" ou compartilhamento');
    console.log('✓ Controles totalmente personalizados');
    console.log('✓ Fullscreen controlado pela aplicação');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
