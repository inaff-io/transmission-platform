#!/usr/bin/env node

/**
 * Script: Verificar se usuário existe no banco
 */

import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:OMSmx9QqbMq4OXun@db.ywcmqgfbxrejuwcbeolu.supabase.co:5432/postgres';

async function main() {
  console.log('🔍 Verificando usuário no banco...\n');

  const client = new Client({ connectionString });

  try {
    await client.connect();

    // Busca por email
    const byEmail = await client.query(
      "SELECT * FROM usuarios WHERE email = 'usuario.teste@example.com'"
    );

    // Busca por CPF
    const byCpf = await client.query(
      "SELECT * FROM usuarios WHERE cpf = '12345678901'"
    );

    // Busca por ID
    const byId = await client.query(
      "SELECT * FROM usuarios WHERE id = 'usuario_teste_chat'"
    );

    console.log('📊 Resultados:');
    console.log(`   Por Email: ${byEmail.rowCount} registro(s)`);
    console.log(`   Por CPF: ${byCpf.rowCount} registro(s)`);
    console.log(`   Por ID: ${byId.rowCount} registro(s)\n`);

    if (byEmail.rowCount > 0) {
      const user = byEmail.rows[0];
      console.log('✅ Usuário encontrado por EMAIL:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Nome: ${user.nome}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   CPF: ${user.cpf}`);
      console.log(`   Categoria: ${user.categoria}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Updated: ${user.updated_at}\n`);
    }

    if (byCpf.rowCount > 0) {
      const user = byCpf.rows[0];
      console.log('✅ Usuário encontrado por CPF:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}\n`);
    }

    if (byId.rowCount > 0) {
      const user = byId.rows[0];
      console.log('✅ Usuário encontrado por ID:');
      console.log(`   Email: ${user.email}\n`);
    }

    if (byEmail.rowCount === 0 && byCpf.rowCount === 0 && byId.rowCount === 0) {
      console.log('❌ Usuário NÃO encontrado no banco!\n');
      console.log('Execute o SQL manualmente no Supabase:\n');
      console.log('https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/sql\n');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

main();
