#!/usr/bin/env node

import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:OMSmx9QqbMq4OXun@db.ywcmqgfbxrejuwcbeolu.supabase.co:5432/postgres';

async function main() {
  console.log('🔧 Criando usuário de teste (CPF atualizado)...\n');

  const client = new Client({ connectionString });

  try {
    await client.connect();

    // Deleta se já existir
    await client.query("DELETE FROM usuarios WHERE email = 'usuario.teste@example.com'");
    console.log('🗑️  Deletado usuário anterior (se existia)\n');

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
        '99988877766',
        'user',
        true,
        NOW(),
        NOW()
      )
      RETURNING *
    `);

    const usuario = result.rows[0];

    console.log('✅ Usuário criado com sucesso!\n');
    console.log('📋 Dados:');
    console.log(`   ID: ${usuario.id}`);
    console.log(`   Nome: ${usuario.nome}`);
    console.log(`   Email: ${usuario.email}`);
    console.log(`   CPF: ${usuario.cpf}`);
    console.log(`   Categoria: ${usuario.categoria}`);
    console.log(`   Status: ${usuario.status}\n`);
    
    console.log('✨ Pronto! Execute agora: node scripts/test-chat-quick.mjs\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
