#!/usr/bin/env node

/**
 * 🧪 TESTE DE CONEXÃO COM BANCO DE DADOS
 * 
 * Testa se as credenciais do banco estão corretas
 */

import pg from 'pg';
import { config } from 'dotenv';

// Carregar variáveis de ambiente do .env.local
config({ path: '.env.local' });

const DIRECT_URL = process.env.DIRECT_URL;
const DATABASE_URL = process.env.DATABASE_URL;

console.log('\n🧪 TESTANDO CONEXÃO COM BANCO DE DADOS\n');
console.log('═══════════════════════════════════════════════════\n');

if (!DIRECT_URL && !DATABASE_URL) {
  console.log('❌ ERRO: Nenhuma variável de ambiente configurada');
  console.log('\nConfigure .env.local com:');
  console.log('DIRECT_URL=postgresql://postgres.PROJECT:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres\n');
  process.exit(1);
}

const connectionString = DIRECT_URL || DATABASE_URL;
const usingDirect = !!DIRECT_URL;

console.log(`📡 Usando: ${usingDirect ? 'DIRECT_URL' : 'DATABASE_URL'}`);

try {
  const url = new URL(connectionString);
  console.log(`🌐 Host: ${url.hostname}`);
  console.log(`🔌 Port: ${url.port || '5432'}`);
  console.log(`💾 Database: ${url.pathname.substring(1)}`);
  console.log(`👤 User: ${url.username}`);
  console.log(`🔑 Password: ${url.password ? '***' + url.password.slice(-4) : 'NÃO DEFINIDA'}`);
} catch (error) {
  console.log('❌ ERRO: String de conexão inválida');
  console.log(`Valor: ${connectionString.substring(0, 50)}...`);
  process.exit(1);
}

console.log('\n🔄 Tentando conectar...\n');

const client = new pg.Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
});

try {
  console.log('⏳ Conectando ao banco...');
  await client.connect();
  console.log('✅ Conexão estabelecida com sucesso!\n');

  console.log('🔍 Testando query simples...');
  const result = await client.query('SELECT NOW() as now, version() as version');
  console.log('✅ Query executada com sucesso!\n');

  console.log('📊 Resultado:');
  console.log(`   Timestamp: ${result.rows[0].now}`);
  console.log(`   Versão: ${result.rows[0].version.split(',')[0]}\n`);

  console.log('🔍 Verificando tabelas...');
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);

  console.log(`✅ ${tables.rows.length} tabelas encontradas:\n`);
  tables.rows.forEach(row => {
    console.log(`   📋 ${row.table_name}`);
  });

  console.log('\n═══════════════════════════════════════════════════');
  console.log('🎉 SUCESSO! Banco de dados está acessível');
  console.log('═══════════════════════════════════════════════════\n');

  console.log('✅ As credenciais estão CORRETAS');
  console.log('✅ O projeto Supabase está ATIVO');
  console.log('✅ A conexão está FUNCIONANDO\n');

  console.log('💡 Se o erro ocorre apenas no Vercel:');
  console.log('   1. Verifique se DIRECT_URL no Vercel é idêntico ao local');
  console.log('   2. Certifique-se que salvou e fez redeploy');
  console.log('   3. Aguarde 2-3 minutos após o deploy\n');

} catch (error) {
  console.log('❌ ERRO AO CONECTAR!\n');
  console.log('═══════════════════════════════════════════════════');

  if (error.message.includes('Tenant or user not found')) {
    console.log('\n🚨 ERRO: "Tenant or user not found"\n');
    console.log('Causas mais comuns:\n');
    console.log('1️⃣  Senha incorreta');
    console.log('   ➡️  Verifique a senha no Supabase Dashboard');
    console.log('   ➡️  Settings → Database → Connection pooling\n');

    console.log('2️⃣  Projeto pausado/deletado');
    console.log('   ➡️  Acesse https://supabase.com/dashboard');
    console.log('   ➡️  Verifique se o projeto está "Active"\n');

    console.log('3️⃣  Nome do projeto incorreto');
    console.log('   ➡️  O "PROJECT" em postgres.PROJECT deve ser exato');
    console.log('   ➡️  Copie direto do Supabase Dashboard\n');

  } else if (error.message.includes('ENETUNREACH')) {
    console.log('\n🚨 ERRO: Rede inacessível (IPv6)\n');
    console.log('➡️  Este erro normalmente não ocorre localmente');
    console.log('➡️  Verifique sua conexão com a internet\n');

  } else if (error.message.includes('timeout')) {
    console.log('\n🚨 ERRO: Timeout de conexão\n');
    console.log('➡️  O banco pode estar sobrecarregado');
    console.log('➡️  Ou o projeto pode estar pausado');
    console.log('➡️  Tente novamente em 1 minuto\n');

  } else {
    console.log('\n🚨 ERRO DESCONHECIDO:\n');
    console.log(error);
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('📖 Para mais ajuda, execute:');
  console.log('   node scripts/diagnose-tenant-error.mjs\n');

  process.exit(1);

} finally {
  await client.end();
}
