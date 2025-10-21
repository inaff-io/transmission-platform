#!/usr/bin/env node

/**
 * Script para limpar dados de teste considerando foreign keys
 * Remove mensagens de chat e dados de teste de forma segura
 */

import pg from 'pg';

const connectionString = process.env.DIRECT_URL || 
                        process.env.DATABASE_URL || 
                        'postgresql://postgres:postgres@localhost:5432/postgres';

console.log('╔════════════════════════════════════════════════╗');
console.log('║   LIMPEZA DE DADOS DE TESTE - SAFE DELETE     ║');
console.log('╚════════════════════════════════════════════════╝\n');

async function cleanupTestData() {
  // Detecta se é localhost para não usar SSL
  const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  
  const { Client } = pg;
  const client = new Client({
    connectionString,
    ssl: isLocalhost ? false : {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');

    // 1. Verificar usuário de teste
    console.log('🔍 Verificando usuário de teste...\n');
    const userCheck = await client.query(`
      SELECT id, nome, email, cpf 
      FROM usuarios 
      WHERE id = 'usuario_teste_chat' OR cpf = '99988877766'
    `);

    if (userCheck.rows.length === 0) {
      console.log('ℹ️  Usuário de teste não encontrado (já foi removido ou nunca foi criado)\n');
    } else {
      console.log(`Usuário encontrado: ${userCheck.rows[0].nome} (${userCheck.rows[0].email})\n`);
    }

    // 2. Verificar mensagens de chat
    console.log('🔍 Verificando mensagens de chat...\n');
    const chatCount = await client.query(`
      SELECT COUNT(*) as total 
      FROM chat 
      WHERE usuario_id IN (
        SELECT id FROM usuarios 
        WHERE id = 'usuario_teste_chat' OR cpf = '99988877766'
      )
    `);

    const totalMessages = parseInt(chatCount.rows[0].total);
    console.log(`📊 Total de mensagens encontradas: ${totalMessages}\n`);

    if (totalMessages === 0) {
      console.log('ℹ️  Nenhuma mensagem de teste para limpar\n');
    } else {
      // 3. Deletar mensagens de chat primeiro (respeitando foreign keys)
      console.log('🗑️  Deletando mensagens de chat...\n');
      const deleteChat = await client.query(`
        DELETE FROM chat 
        WHERE usuario_id IN (
          SELECT id FROM usuarios 
          WHERE id = 'usuario_teste_chat' OR cpf = '99988877766'
        )
      `);

      console.log(`✅ ${deleteChat.rowCount} mensagens deletadas com sucesso!\n`);
    }

    // 4. Verificar logins
    console.log('🔍 Verificando logins...\n');
    const loginCount = await client.query(`
      SELECT COUNT(*) as total 
      FROM logins 
      WHERE usuario_id IN (
        SELECT id FROM usuarios 
        WHERE id = 'usuario_teste_chat' OR cpf = '99988877766'
      )
    `);

    const totalLogins = parseInt(loginCount.rows[0].total);
    console.log(`📊 Total de logins encontrados: ${totalLogins}\n`);

    if (totalLogins > 0) {
      // 5. Deletar logins (se existirem)
      console.log('🗑️  Deletando registros de login...\n');
      const deleteLogins = await client.query(`
        DELETE FROM logins 
        WHERE usuario_id IN (
          SELECT id FROM usuarios 
          WHERE id = 'usuario_teste_chat' OR cpf = '99988877766'
        )
      `);

      console.log(`✅ ${deleteLogins.rowCount} logins deletados com sucesso!\n`);
    }

    // 6. Perguntar antes de deletar usuário
    if (userCheck.rows.length > 0) {
      console.log('⚠️  ATENÇÃO: Deseja deletar o usuário de teste?\n');
      console.log('Opções:');
      console.log('  1. Deletar usuário permanentemente');
      console.log('  2. Apenas desativar usuário (recomendado)');
      console.log('  3. Manter usuário (apenas limpar mensagens/logins)\n');

      // Para este script, vamos apenas desativar (opção mais segura)
      console.log('🔧 Desativando usuário de teste (opção segura)...\n');
      
      const deactivate = await client.query(`
        UPDATE usuarios 
        SET status = false, ativo = false 
        WHERE id = 'usuario_teste_chat' OR cpf = '99988877766'
      `);

      if (deactivate.rowCount > 0) {
        console.log(`✅ Usuário desativado com sucesso!\n`);
      }
    }

    // 7. Resumo final
    console.log('═══════════════════════════════════════════════\n');
    console.log('📊 RESUMO DA LIMPEZA:\n');
    console.log(`   🗑️  Mensagens deletadas: ${totalMessages}`);
    console.log(`   🗑️  Logins deletados: ${totalLogins}`);
    console.log(`   👤 Usuário: ${userCheck.rows.length > 0 ? 'Desativado' : 'Não encontrado'}\n`);
    console.log('═══════════════════════════════════════════════\n');
    console.log('✅ LIMPEZA CONCLUÍDA COM SUCESSO!\n');

  } catch (error) {
    console.error('❌ Erro durante limpeza:', error);
    console.error('\nDetalhes:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Conexão fechada\n');
  }
}

// Executar limpeza
cleanupTestData();
