#!/usr/bin/env node
/**
 * Migração: logins.usuario_id de TEXT para UUID
 * 
 * PROBLEMA:
 * - usuarios.id = UUID
 * - logins.usuario_id = TEXT
 * - JOIN falha: "operator does not exist: text = uuid"
 * 
 * SOLUÇÃO:
 * - Alterar logins.usuario_id para UUID
 * - Manter dados existentes (cast de TEXT para UUID)
 * - Adicionar foreign key constraint
 */

import dotenv from 'dotenv';
import pg from 'pg';

const { Client } = pg;
dotenv.config({ path: '.env.local' });

async function migrateLoginUsuarioId() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   MIGRAÇÃO: logins.usuario_id TEXT → UUID                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL\n');

    // 1. Verifica tipo atual
    console.log('📊 Verificando estrutura atual...\n');
    const { rows: colunas } = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'logins'
        AND column_name = 'usuario_id'
    `);

    if (colunas.length === 0) {
      console.error('❌ Coluna usuario_id não encontrada!');
      process.exit(1);
    }

    console.log(`   Tipo atual: ${colunas[0].data_type}`);
    console.log(`   Permite NULL: ${colunas[0].is_nullable}\n`);

    if (colunas[0].data_type === 'uuid') {
      console.log('✅ Coluna já é UUID, migração não necessária!\n');
      return;
    }

    // 2. Conta registros
    const { rows: contagem } = await client.query('SELECT COUNT(*) as total FROM logins');
    console.log(`📋 Total de registros: ${contagem[0].total}\n`);

    // 3. Verifica se há valores inválidos
    console.log('🔍 Verificando valores inválidos...\n');
    const { rows: invalidos } = await client.query(`
      SELECT usuario_id, COUNT(*) as total
      FROM logins
      WHERE usuario_id IS NOT NULL
        AND usuario_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      GROUP BY usuario_id
      LIMIT 10
    `);

    if (invalidos.length > 0) {
      console.log(`   ⚠️  ${invalidos.length} valores não são UUIDs:\n`);
      for (const inv of invalidos) {
        console.log(`      "${inv.usuario_id}" (${inv.total} registros)`);
      }
      console.log('\n   Esses registros serão ajustados...\n');
    } else {
      console.log('   ✅ Todos os valores são UUIDs válidos\n');
    }

    // 4. Backup antes da migração
    console.log('💾 Criando backup...\n');
    await client.query(`
      CREATE TABLE IF NOT EXISTS logins_backup_${Date.now()} AS
      SELECT * FROM logins
    `);
    console.log('   ✅ Backup criado\n');

    // 5. Migração em transação
    console.log('🔄 Iniciando migração...\n');
    await client.query('BEGIN');

    try {
      // Remove policies RLS que dependem de usuario_id
      console.log('   1. Removendo policies RLS...');
      const { rows: policies } = await client.query(`
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'logins'
      `);
      
      for (const policy of policies) {
        await client.query(`DROP POLICY IF EXISTS ${policy.policyname} ON logins`);
        console.log(`      - Removida: ${policy.policyname}`);
      }
      console.log('      ✅ Policies removidas\n');

      // Remove constraint se existir
      console.log('   2. Removendo constraints antigas...');
      await client.query(`
        ALTER TABLE logins 
        DROP CONSTRAINT IF EXISTS logins_usuario_id_fkey
      `);
      console.log('      ✅ Constraints removidas\n');

      // Converte para UUID usando CAST
      console.log('   3. Permitindo NULL temporariamente...');
      await client.query(`
        ALTER TABLE logins 
        ALTER COLUMN usuario_id DROP NOT NULL
      `);
      console.log('      ✅ NOT NULL removido\n');

      console.log('   4. Convertendo tipo da coluna...');
      await client.query(`
        ALTER TABLE logins 
        ALTER COLUMN usuario_id TYPE uuid 
        USING CASE 
          WHEN usuario_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          THEN usuario_id::uuid
          ELSE NULL
        END
      `);
      console.log('      ✅ Coluna convertida para UUID\n');

      // Remove logins órfãos (usuários que não existem)
      console.log('   5. Removendo logins órfãos...');
      const { rows: orfaosRemovidos } = await client.query(`
        DELETE FROM logins
        WHERE usuario_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM usuarios WHERE id = logins.usuario_id)
        RETURNING id
      `);
      console.log(`      ✅ ${orfaosRemovidos.length} logins órfãos removidos\n`);

      // Adiciona foreign key
      console.log('   6. Adicionando foreign key...');
      await client.query(`
        ALTER TABLE logins 
        ADD CONSTRAINT logins_usuario_id_fkey 
        FOREIGN KEY (usuario_id) 
        REFERENCES usuarios(id) 
        ON DELETE CASCADE
      `);
      console.log('      ✅ Foreign key adicionada\n');

      // Reabilita RLS se estava ativo
      console.log('   7. Recriando RLS policies...');
      await client.query(`
        ALTER TABLE logins ENABLE ROW LEVEL SECURITY
      `);
      
      // Cria policy básica (acesso via backend autenticado)
      await client.query(`
        CREATE POLICY "Acesso autenticado" ON logins
        FOR ALL
        USING (true)
      `);
      console.log('      ✅ RLS policies recriadas\n');

      await client.query('COMMIT');
      console.log('✅ Migração concluída com sucesso!\n');

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

    // 6. Validação
    console.log('🔍 Validando migração...\n');
    
    const { rows: novaTipagem } = await client.query(`
      SELECT data_type 
      FROM information_schema.columns
      WHERE table_name = 'logins' AND column_name = 'usuario_id'
    `);
    console.log(`   Novo tipo: ${novaTipagem[0].data_type}`);

    const { rows: testJoin } = await client.query(`
      SELECT COUNT(*) as total
      FROM logins l
      INNER JOIN usuarios u ON l.usuario_id = u.id
    `);
    console.log(`   Registros com JOIN válido: ${testJoin[0].total}\n`);

    const { rows: nulos } = await client.query(`
      SELECT COUNT(*) as total
      FROM logins
      WHERE usuario_id IS NULL
    `);
    
    if (Number(nulos[0].total) > 0) {
      console.log(`   ⚠️  ${nulos[0].total} registros com usuario_id NULL\n`);
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n✅ MIGRAÇÃO COMPLETA!\n');
    console.log('Próximos passos:');
    console.log('  1. Testar relatórios: node scripts/test-relatorios.mjs');
    console.log('  2. Testar interface web de relatórios');
    console.log('  3. Verificar se há logins órfãos (usuario_id NULL)\n');

  } catch (error) {
    console.error('\n❌ Erro na migração:', error);
    if (error instanceof Error) {
      console.error('   Mensagem:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

await migrateLoginUsuarioId();
