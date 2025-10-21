#!/usr/bin/env node

/**
 * Migração: Adiciona coluna 'ativo' na tabela usuarios
 */

import pkg from 'pg';
const { Client } = pkg;

const dbConfig = {
  user: 'postgres.ywcmqgfbxrejuwcbeolu',
  password: 'OMSmx9QqbMq4OXun',
  host: 'aws-1-us-east-2.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
};

const client = new Client(dbConfig);

try {
  console.log('🔌 Conectando ao banco...');
  await client.connect();
  console.log('✅ Conectado!\n');

  // 1. Adiciona coluna
  console.log('📝 1. Adicionando coluna "ativo"...');
  try {
    await client.query(`
      ALTER TABLE usuarios 
      ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true
    `);
    console.log('✅ Coluna adicionada!');
  } catch (err) {
    if (err.code === '42701') {
      console.log('⚠️  Coluna já existe!');
    } else {
      throw err;
    }
  }

  // 2. Atualiza valores NULL
  console.log('\n📝 2. Atualizando valores NULL...');
  const updateResult = await client.query(`
    UPDATE usuarios 
    SET ativo = true 
    WHERE ativo IS NULL
  `);
  console.log(`✅ ${updateResult.rowCount} linhas atualizadas`);

  // 3. Adiciona NOT NULL constraint
  console.log('\n📝 3. Adicionando constraint NOT NULL...');
  try {
    await client.query(`
      ALTER TABLE usuarios 
      ALTER COLUMN ativo SET NOT NULL
    `);
    console.log('✅ Constraint adicionada!');
  } catch (err) {
    if (err.code === '42804') {
      console.log('⚠️  Constraint já existe!');
    } else {
      throw err;
    }
  }

  // 4. Validação
  console.log('\n🔍 Validação...');
  const validation = await client.query(`
    SELECT 
      column_name, 
      data_type, 
      is_nullable,
      column_default
    FROM information_schema.columns 
    WHERE table_name = 'usuarios' 
      AND column_name = 'ativo'
  `);

  if (validation.rows.length > 0) {
    console.log('\n✅ Coluna "ativo" confirmada:');
    console.table(validation.rows);
  } else {
    console.error('\n❌ ERRO: Coluna não encontrada!');
    process.exit(1);
  }

  // 5. Estatísticas
  const stats = await client.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE ativo = true) as ativos,
      COUNT(*) FILTER (WHERE ativo = false) as inativos
    FROM usuarios
  `);

  console.log('\n📊 Estatísticas:');
  console.table(stats.rows);

  console.log('\n━'.repeat(60));
  console.log('✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
  console.log('━'.repeat(60));

} catch (error) {
  console.error('\n❌ ERRO:');
  console.error(error);
  process.exit(1);
} finally {
  await client.end();
}
