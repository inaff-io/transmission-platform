#!/usr/bin/env node
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

async function fixLinksConstraint() {
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
    console.log('🔍 Verificando constraints da tabela links...\n');
    
    // Verificar constraints existentes
    const constraints = await pool.query(`
      SELECT 
        conname AS constraint_name,
        pg_get_constraintdef(c.oid) AS constraint_definition
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE conrelid = 'links'::regclass
        AND contype = 'c'
      ORDER BY conname;
    `);
    
    console.log('📋 Constraints CHECK atuais:');
    for (const row of constraints.rows) {
      console.log(`\n  ▪ ${row.constraint_name}`);
      console.log(`    ${row.constraint_definition}`);
    }
    
    // Remover constraint antiga (se existir)
    const linksTipoCheck = constraints.rows.find(r => r.constraint_name === 'links_tipo_check');
    
    if (linksTipoCheck) {
      console.log('\n🗑️  Removendo constraint antiga "links_tipo_check"...');
      await pool.query('ALTER TABLE links DROP CONSTRAINT IF EXISTS links_tipo_check;');
      console.log('✅ Constraint removida');
    }
    
    // Criar nova constraint incluindo 'traducao'
    console.log('\n➕ Criando nova constraint com suporte a "traducao"...');
    await pool.query(`
      ALTER TABLE links 
      ADD CONSTRAINT links_tipo_check 
      CHECK (tipo IN ('transmissao', 'programacao', 'traducao'));
    `);
    console.log('✅ Nova constraint criada');
    
    // Verificar novamente
    console.log('\n🔍 Verificando nova constraint...');
    const newConstraints = await pool.query(`
      SELECT 
        conname AS constraint_name,
        pg_get_constraintdef(c.oid) AS constraint_definition
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE conrelid = 'links'::regclass
        AND contype = 'c'
      ORDER BY conname;
    `);
    
    console.log('\n📋 Constraints CHECK atualizadas:');
    for (const row of newConstraints.rows) {
      console.log(`\n  ▪ ${row.constraint_name}`);
      console.log(`    ${row.constraint_definition}`);
    }
    
    // Testar inserção
    console.log('\n🧪 Testando inserção de link de tradução...');
    const testUrl = 'https://www.snapsight.com/live-channel/l/93a696ad-92ee-436e-850a-68a971f9bf50/attendee/locations?lid=all';
    
    try {
      const result = await pool.query(`
        INSERT INTO links (tipo, url, ativo_em, atualizado_em)
        VALUES ('traducao', $1, NOW(), NOW())
        ON CONFLICT DO NOTHING
        RETURNING id, tipo, LEFT(url, 80) as url_preview;
      `, [testUrl]);
      
      if (result.rows.length > 0) {
        console.log('✅ Inserção de tradução funcionou!');
        console.log('\n📌 Link criado:');
        console.log(`   ID: ${result.rows[0].id}`);
        console.log(`   Tipo: ${result.rows[0].tipo}`);
        console.log(`   URL: ${result.rows[0].url_preview}...`);
      } else {
        console.log('ℹ️  Link de tradução já existe (não inserido novamente)');
      }
    } catch (insertError) {
      console.error('❌ Erro ao inserir:', insertError.message);
    }
    
    // Listar todos os links
    console.log('\n📊 Todos os links cadastrados:');
    const allLinks = await pool.query(`
      SELECT id, tipo, LEFT(url, 60) as url_preview, ativo_em
      FROM links
      ORDER BY tipo, atualizado_em DESC;
    `);
    
    for (const link of allLinks.rows) {
      console.log(`\n  ${link.tipo.toUpperCase()}`);
      console.log(`    ID: ${link.id}`);
      console.log(`    URL: ${link.url_preview}...`);
      console.log(`    Ativo em: ${link.ativo_em}`);
    }
    
    console.log('\n✅ Correção concluída com sucesso!');
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    if (error.detail) console.error('   Detalhe:', error.detail);
    throw error;
  } finally {
    await pool.end();
    console.log('\n🔌 Conexão encerrada');
  }
}

fixLinksConstraint().catch(console.error);
