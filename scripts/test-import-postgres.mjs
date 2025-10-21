#!/usr/bin/env node
/**
 * Teste do endpoint de importação Excel após migração para PostgreSQL
 * Execução: node scripts/test-import-postgres.mjs
 */

import dotenv from 'dotenv';
import pg from 'pg';

const { Pool } = pg;
dotenv.config({ path: '.env.local' });

async function testImport() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     TESTE: Importação Excel - PostgreSQL Direct               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const pool = new Pool({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000
  });

  // Simula os dados que viriam do Excel
  const testUsers = [
    {
      nome: 'Teste Import PostgreSQL 1',
      email: 'teste.import.pg1@example.com',
      cpf: '11111111111',
      categoria: 'user'
    },
    {
      nome: 'Teste Import PostgreSQL 2',
      email: 'teste.import.pg2@example.com',
      cpf: '22222222222',
      categoria: 'admin'
    }
  ];

  console.log('📋 Dados a importar:\n');
  for (const [index, user] of testUsers.entries()) {
    console.log(`   ${index + 1}. ${user.nome}`);
    console.log(`      Email: ${user.email}`);
    console.log(`      CPF: ${user.cpf}`);
    console.log(`      Categoria: ${user.categoria}\n`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🔄 Importando usuários...\n');

  const results = {
    success: 0,
    errors: []
  };

  for (const userData of testUsers) {
    try {
      const cpf = userData.cpf.replaceAll(/\D/g, '');
      const email = userData.email.toLowerCase();
      const categoria = userData.categoria;

      // Verifica se já existe
      const { rows: existing } = await pool.query(
        'SELECT id FROM usuarios WHERE email = $1 OR cpf = $2',
        [email, cpf]
      );

      if (existing.length > 0) {
        console.log(`   ⚠️  ${userData.nome} - JÁ EXISTE, atualizando...`);
        
        await pool.query(
          `UPDATE usuarios 
           SET nome = $1, categoria = $2, updated_at = NOW()
           WHERE id = $3`,
          [userData.nome, categoria, existing[0].id]
        );
        
        console.log(`   ✅ Atualizado!\n`);
        results.success++;
      } else {
        console.log(`   ➕ ${userData.nome} - Criando novo...`);
        
        // PostgreSQL gera UUID automaticamente via gen_random_uuid()
        const { rows } = await pool.query(
          `INSERT INTO usuarios (nome, email, cpf, categoria, status, ativo, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
           RETURNING id`,
          [userData.nome, email, cpf, categoria, true, true]
        );
        
        console.log(`   ✅ Criado com ID: ${rows[0].id}\n`);
        results.success++;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ ERRO: ${errorMsg}\n`);
      results.errors.push(`${userData.nome}: ${errorMsg}`);
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📊 RESULTADO DA IMPORTAÇÃO:\n');
  console.log(`   ✅ Sucesso: ${results.success} usuário(s)`);
  console.log(`   ❌ Erros: ${results.errors.length} erro(s)`);

  if (results.errors.length > 0) {
    console.log('\n⚠️  Erros encontrados:\n');
    for (const [index, err] of results.errors.entries()) {
      console.log(`   ${index + 1}. ${err}`);
    }
  }

  // Verifica usuários no banco
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🔍 Verificando no banco de dados...\n');

  const { rows: created } = await pool.query(
    `SELECT id, nome, email, cpf, categoria, ativo, status
     FROM usuarios
     WHERE email = ANY($1)
     ORDER BY nome`,
    [testUsers.map(u => u.email.toLowerCase())]
  );

  console.log(`📋 ${created.length} usuário(s) encontrado(s):\n`);
  for (const [index, user] of created.entries()) {
    console.log(`   ${index + 1}. ${user.nome}`);
    console.log(`      ID: ${user.id}`);
    console.log(`      Email: ${user.email}`);
    console.log(`      CPF: ${user.cpf}`);
    console.log(`      Categoria: ${user.categoria}`);
    console.log(`      Ativo: ${user.ativo ? '✅' : '❌'}`);
    console.log(`      Status: ${user.status ? '✅' : '❌'}\n`);
  }

  await pool.end();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (results.success === testUsers.length && results.errors.length === 0) {
    console.log('\n✅ TESTE PASSOU - Importação funcionando!\n');
    return 0;
  } else {
    console.log('\n❌ TESTE FALHOU - Verifique os erros acima\n');
    return 1;
  }
}

// Executa teste
await testImport().then(code => process.exit(code));
