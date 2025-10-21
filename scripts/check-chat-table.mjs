#!/usr/bin/env node

/**
 * Verifica estrutura da tabela chat no Supabase
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
  console.log('🔌 Conectando...\n');
  await client.connect();

  // 1. Verifica estrutura da tabela
  console.log('📋 Estrutura da tabela chat:\n');
  const schema = await client.query(`
    SELECT 
      column_name, 
      data_type, 
      is_nullable,
      column_default
    FROM information_schema.columns 
    WHERE table_name = 'chat'
    ORDER BY ordinal_position
  `);

  console.table(schema.rows);

  // 2. Testa INSERT simples
  console.log('\n🧪 Testando INSERT...\n');
  
  const testUserId = '58700cef-5b1d-4d34-ba89-4f06c9cff006'; // Pedro Costa
  const testMessage = 'Teste direto - ' + new Date().toISOString();

  try {
    const result = await client.query(
      `INSERT INTO chat (usuario_id, mensagem)
       VALUES ($1, $2)
       RETURNING *`,
      [testUserId, testMessage]
    );

    console.log('✅ INSERT funcionou!');
    console.log('Mensagem criada:');
    console.table(result.rows);

    // Deleta mensagem de teste
    await client.query('DELETE FROM chat WHERE id = $1', [result.rows[0].id]);
    console.log('\n🗑️  Mensagem de teste deletada');

  } catch (err) {
    console.error('❌ INSERT falhou!');
    console.error('Erro:', err.message);
    console.error('Code:', err.code);
    console.error('Detail:', err.detail);
  }

  // 3. Verifica foreign key
  console.log('\n🔗 Foreign Keys:\n');
  const fks = await client.query(`
    SELECT
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'chat'
      AND tc.constraint_type = 'FOREIGN KEY'
  `);

  if (fks.rows.length > 0) {
    console.table(fks.rows);
  } else {
    console.log('Nenhuma foreign key encontrada');
  }

} catch (error) {
  console.error('❌ Erro:', error.message);
  console.error(error);
} finally {
  await client.end();
}
