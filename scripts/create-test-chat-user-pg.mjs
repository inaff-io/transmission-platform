#!/usr/bin/env node

/**
 * Script: Criar Usuário de Teste usando conexão direta PostgreSQL
 */

import pg from 'pg';
const { Client } = pg;

// Credenciais do Supabase
const connectionString = 'postgresql://postgres:OMSmx9QqbMq4OXun@db.ywcmqgfbxrejuwcbeolu.supabase.co:5432/postgres';

async function main() {
  console.log('🔧 Criando usuário de teste para chat...\n');

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');

    // Deleta se já existir
    await client.query("DELETE FROM usuarios WHERE id = 'usuario_teste_chat'");

    // Cria o usuário
    const result = await client.query(`
      INSERT INTO usuarios (
        id,
        nome,
        email,
        cpf,
        categoria,
        status,
        created_at,
        updated_at
      ) VALUES (
        'usuario_teste_chat',
        'Usuário Teste Chat',
        'usuario.teste@example.com',
        '12345678901',
        'user',
        true,
        NOW(),
        NOW()
      )
      RETURNING *
    `);

    const usuario = result.rows[0];

    console.log('✅ Usuário criado com sucesso!\n');
    console.log('📋 Dados do usuário:');
    console.log(`   ID: ${usuario.id}`);
    console.log(`   Nome: ${usuario.nome}`);
    console.log(`   Email: ${usuario.email}`);
    console.log(`   CPF: ${usuario.cpf}`);
    console.log(`   Categoria: ${usuario.categoria}`);
    console.log(`   Status: ${usuario.status}`);
    
    console.log('\n✨ Pronto para usar nos testes de chat!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Execute: node scripts/test-chat-quick.mjs');
    console.log('   2. Se passar, execute: node scripts/test-chat-500-messages.mjs\n');
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
