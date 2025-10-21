#!/usr/bin/env node

/**
 * 🔍 VERIFICAR USUÁRIOS NO BANCO
 * 
 * Lista todos os usuários cadastrados usando conexão direta PostgreSQL
 */

import pg from 'pg';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config({ path: '.env.local' });

console.log('\n🔍 VERIFICANDO USUÁRIOS NO BANCO DE DADOS\n');
console.log('═══════════════════════════════════════════════════\n');

const DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!DIRECT_URL) {
  console.log('❌ ERRO: DIRECT_URL ou DATABASE_URL não configurado\n');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: DIRECT_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
});

try {
  console.log('⏳ Conectando ao banco...\n');
  await client.connect();
  console.log('✅ Conectado!\n');

  // Buscar todos os usuários
  const result = await client.query(`
    SELECT 
      id,
      nome,
      email,
      cpf,
      tipo,
      ativo,
      created_at
    FROM usuarios
    ORDER BY created_at DESC
  `);

  if (result.rows.length === 0) {
    console.log('⚠️  NENHUM USUÁRIO ENCONTRADO NO BANCO!\n');
    console.log('Você precisa criar um usuário primeiro.\n');
    console.log('Execute:');
    console.log('  node scripts/create-admin-user.mjs\n');
    process.exit(0);
  }

  console.log(`📊 TOTAL: ${result.rows.length} usuários encontrados\n`);
  console.log('═══════════════════════════════════════════════════\n');

  for (const user of result.rows) {
    const ativoIcon = user.ativo ? '✅' : '❌';
    const tipoIcon = user.tipo === 'admin' ? '👑' : '👤';
    
    console.log(`${ativoIcon} ${tipoIcon} ${user.nome}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email || '(não cadastrado)'}`);
    console.log(`   CPF: ${user.cpf || '(não cadastrado)'}`);
    console.log(`   Tipo: ${user.tipo}`);
    console.log(`   Ativo: ${user.ativo ? 'Sim' : 'Não'}`);
    console.log(`   Criado: ${user.created_at}`);
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════\n');

  // Verificar usuários admin
  const admins = result.rows.filter(u => u.tipo === 'admin' && u.ativo);
  const users = result.rows.filter(u => u.tipo === 'usuario' && u.ativo);

  console.log('📈 ESTATÍSTICAS:\n');
  console.log(`   👑 Admins ativos: ${admins.length}`);
  console.log(`   👤 Usuários ativos: ${users.length}`);
  console.log(`   ❌ Inativos: ${result.rows.filter(u => !u.ativo).length}`);
  console.log('');

  // Verificar usuários sem email OU CPF
  const semCredenciais = result.rows.filter(u => !u.email && !u.cpf);
  if (semCredenciais.length > 0) {
    console.log('⚠️  ATENÇÃO: Usuários sem email NEM CPF:\n');
    for (const user of semCredenciais) {
      console.log(`   ❌ ${user.nome} (ID: ${user.id})`);
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════\n');
  console.log('💡 DICAS PARA LOGIN:\n');
  console.log('1. Use o EMAIL ou CPF cadastrado');
  console.log('2. Usuário deve estar ATIVO (ativo = true)');
  console.log('3. Senha deve estar configurada no banco');
  console.log('4. Admin usa /admin, Usuário usa /login\n');

} catch (error) {
  console.log('❌ ERRO:\n');
  console.log(error.message);
  console.log('');
} finally {
  await client.end();
}
