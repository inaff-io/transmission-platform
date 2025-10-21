#!/usr/bin/env node
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

async function addTraducaoLink() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  
  // Tentar primeiro com SSL
  let pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await pool.query('SELECT 1');
  } catch (error) {
    // Se falhar com SSL, tentar sem SSL
    console.log('⚠️  SSL não suportado, tentando sem SSL...');
    await pool.end();
    pool = new Pool({
      connectionString,
      ssl: false
    });
  }

  try {
    console.log('🔗 Conectando ao banco de dados...');
    
    // URL da tradução Snapsight (com /embed)
    const traducaoUrl = 'https://www.snapsight.com/live-channel/l/93a696ad-92ee-436e-850a-68a971f9bf50/attendee/locations?lid=all/embed';
    
    // Criar HTML do iframe para tradução
    const iframeHtml = `<iframe src="${traducaoUrl}" style="width:100%; height:100%; border:none;" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"></iframe>`;
    
    // Verificar se já existe um link de tradução
    const checkResult = await pool.query(
      `SELECT id, tipo, url FROM links WHERE tipo ILIKE '%trad%' ORDER BY atualizado_em DESC LIMIT 1`
    );
    
    if (checkResult.rows.length > 0) {
      console.log('📝 Link de tradução encontrado:', checkResult.rows[0]);
      console.log('\n🔄 Atualizando link de tradução...');
      
      await pool.query(
        `UPDATE links 
         SET url = $1, 
             tipo = 'traducao',
             atualizado_em = NOW() 
         WHERE id = $2`,
        [iframeHtml, checkResult.rows[0].id]
      );
      
      console.log('✅ Link de tradução atualizado com sucesso!');
    } else {
      console.log('➕ Nenhum link de tradução encontrado. Criando novo...');
      
      const insertResult = await pool.query(
        `INSERT INTO links (tipo, url, ativo_em, atualizado_em) 
         VALUES ('traducao', $1, NOW(), NOW()) 
         RETURNING id, tipo, url`,
        [iframeHtml]
      );
      
      console.log('✅ Link de tradução criado com sucesso!');
      console.log('📋 Dados:', insertResult.rows[0]);
    }
    
    // Verificar o resultado final
    console.log('\n📊 Verificando todos os links...');
    const allLinks = await pool.query(
      `SELECT id, tipo, LEFT(url, 100) as url_preview, ativo_em, atualizado_em 
       FROM links 
       ORDER BY tipo, atualizado_em DESC`
    );
    
    console.log('\n📌 Links cadastrados:');
    allLinks.rows.forEach((link, idx) => {
      console.log(`\n${idx + 1}. ${link.tipo.toUpperCase()}`);
      console.log(`   ID: ${link.id}`);
      console.log(`   URL: ${link.url_preview}...`);
      console.log(`   Ativo em: ${link.ativo_em}`);
      console.log(`   Atualizado em: ${link.atualizado_em}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await pool.end();
    console.log('\n✅ Conexão encerrada');
  }
}

addTraducaoLink().catch(console.error);
