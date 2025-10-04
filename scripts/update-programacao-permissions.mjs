import pg from 'pg';

const client = new pg.Client({
  user: 'postgres.apamlthhsppsjvbxzouv',
  password: 'Sucesso@1234',
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function updateProgramacaoPermissions() {
  try {
    await client.connect();
    console.log('✓ Conectado ao PostgreSQL');

    // Busca todos os links de programação
    const result = await client.query(`
      SELECT id, url, tipo
      FROM links
      WHERE tipo = 'programacao'
    `);

    console.log(`\nEncontrados ${result.rows.length} links de programação\n`);

    for (const link of result.rows) {
      console.log(`Link ID: ${link.id}`);
      console.log(`URL atual: ${link.url.substring(0, 100)}...`);

      let newUrl = link.url;

      // Se é um iframe HTML
      if (link.url.trim().startsWith('<iframe')) {
        // Verifica se já tem as permissões corretas
        if (link.url.includes('allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"')) {
          console.log('✓ Já tem as permissões corretas\n');
          continue;
        }

        // Remove atributo allow antigo se existir
        newUrl = newUrl.replace(/allow="[^"]*"/g, '');
        
        // Remove sandbox se existir
        newUrl = newUrl.replace(/sandbox="[^"]*"/g, '');
        
        // Adiciona o novo atributo allow antes de allowfullscreen ou no final da tag
        if (newUrl.includes('allowfullscreen')) {
          newUrl = newUrl.replace('allowfullscreen', 'allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" allowfullscreen');
        } else {
          newUrl = newUrl.replace('></iframe>', ' allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" allowfullscreen></iframe>');
        }
      }
      // Se é uma URL simples, converte para iframe
      else if (!link.url.trim().startsWith('<div')) {
        newUrl = `<iframe src="${link.url}" style="width:100%; height:100%; border:none;" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" allowfullscreen></iframe>`;
      }

      // Atualiza no banco se mudou
      if (newUrl !== link.url) {
        await client.query(
          'UPDATE links SET url = $1, updated_at = NOW() WHERE id = $2',
          [newUrl, link.id]
        );
        console.log('✓ Atualizado com as novas permissões\n');
      }
    }

    console.log('✓ Processo concluído!');
  } catch (error) {
    console.error('✗ Erro:', error);
  } finally {
    await client.end();
  }
}

updateProgramacaoPermissions();
