#!/usr/bin/env node

/**
 * Migração: Corrige tabela chat para usar UUID
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

  // 1. Backup de mensagens existentes
  console.log('💾 Fazendo backup das mensagens...');
  const backup = await client.query('SELECT * FROM chat');
  console.log(`✅ ${backup.rows.length} mensagens salvas em backup\n`);

  // 2. Drop tabela chat antiga
  console.log('🗑️  Dropando tabela chat antiga...');
  await client.query('DROP TABLE IF EXISTS chat CASCADE');
  console.log('✅ Tabela dropada\n');

  // 3. Cria tabela nova com UUID
  console.log('📝 Criando tabela chat com UUID...');
  await client.query(`
    CREATE TABLE chat (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      usuario_id uuid REFERENCES usuarios(id) ON DELETE CASCADE,
      mensagem text NOT NULL,
      created_at timestamp DEFAULT now(),
      updated_at timestamp DEFAULT now()
    )
  `);
  console.log('✅ Tabela criada\n');

  // 4. Restaura mensagens (se houver)
  if (backup.rows.length > 0) {
    console.log('♻️  Restaurando mensagens...');
    
    for (const msg of backup.rows) {
      try {
        await client.query(
          `INSERT INTO chat (usuario_id, mensagem, created_at, updated_at)
           VALUES ($1, $2, $3, $4)`,
          [
            msg.usuario_id,
            msg.mensagem,
            msg.created_at,
            msg.updated_at
          ]
        );
      } catch (err) {
        console.log(`⚠️  Pulando mensagem (usuário não existe): ${msg.usuario_id}`);
      }
    }
    
    const restored = await client.query('SELECT COUNT(*) FROM chat');
    console.log(`✅ ${restored.rows[0].count} mensagens restauradas\n`);
  }

  // 5. Validação
  console.log('🔍 Validando estrutura...\n');
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

  // 6. Teste de INSERT
  console.log('\n🧪 Testando INSERT...');
  const testUserId = '58700cef-5b1d-4d34-ba89-4f06c9cff006';
  const testMessage = 'Teste após migração - ' + new Date().toISOString();

  const result = await client.query(
    `INSERT INTO chat (usuario_id, mensagem)
     VALUES ($1, $2)
     RETURNING *`,
    [testUserId, testMessage]
  );

  console.log('✅ INSERT funcionou!');
  console.table(result.rows);

  // Deleta mensagem de teste
  await client.query('DELETE FROM chat WHERE id = $1', [result.rows[0].id]);
  console.log('\n🗑️  Mensagem de teste deletada');

  console.log('\n━'.repeat(60));
  console.log('✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
  console.log('━'.repeat(60));

} catch (error) {
  console.error('\n❌ ERRO:', error.message);
  console.error(error);
  process.exit(1);
} finally {
  await client.end();
}
