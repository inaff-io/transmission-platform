#!/usr/bin/env node

/**
 * 🔍 DIAGNÓSTICO: Erro "Tenant or user not found"
 * 
 * Este erro significa que o Supabase Pooler não consegue autenticar
 * as credenciais do banco de dados. Causas comuns:
 * 
 * 1. DIRECT_URL com senha incorreta
 * 2. Projeto Supabase pausado/deletado
 * 3. Senha do banco foi alterada no Supabase
 * 4. String de conexão malformada
 */

console.log('\n🔍 DIAGNÓSTICO: Erro "Tenant or user not found"\n');
console.log('═══════════════════════════════════════════════════\n');

// Verificar se temos acesso às variáveis de ambiente
const DIRECT_URL = process.env.DIRECT_URL;
const DATABASE_URL = process.env.DATABASE_URL;

console.log('📋 VARIÁVEIS DE AMBIENTE LOCAIS:\n');

if (DIRECT_URL) {
  const url = new URL(DIRECT_URL);
  console.log('✅ DIRECT_URL encontrado');
  console.log(`   Host: ${url.hostname}`);
  console.log(`   Port: ${url.port || '5432'}`);
  console.log(`   Database: ${url.pathname.substring(1)}`);
  console.log(`   User: ${url.username}`);
  console.log(`   Password: ${url.password ? '***' + url.password.slice(-4) : 'NÃO DEFINIDA'}`);
} else {
  console.log('❌ DIRECT_URL NÃO configurado localmente');
}

console.log('');

if (DATABASE_URL) {
  const url = new URL(DATABASE_URL);
  console.log('✅ DATABASE_URL encontrado');
  console.log(`   Host: ${url.hostname}`);
  console.log(`   Port: ${url.port || '6543'}`);
  console.log(`   Database: ${url.pathname.substring(1)}`);
  console.log(`   User: ${url.username}`);
  console.log(`   Password: ${url.password ? '***' + url.password.slice(-4) : 'NÃO DEFINIDA'}`);
} else {
  console.log('❌ DATABASE_URL NÃO configurado localmente');
}

console.log('\n═══════════════════════════════════════════════════\n');
console.log('🚨 CAUSAS COMUNS DO ERRO:\n');

console.log('1️⃣  SENHA INCORRETA NO VERCEL');
console.log('   ➡️  A variável DIRECT_URL no Vercel tem senha errada');
console.log('   ➡️  Verifique se a senha foi alterada no Supabase\n');

console.log('2️⃣  PROJETO SUPABASE PAUSADO');
console.log('   ➡️  Projetos gratuitos são pausados após inatividade');
console.log('   ➡️  Acesse: https://supabase.com/dashboard');
console.log('   ➡️  Verifique se o projeto está "Paused"\n');

console.log('3️⃣  PROJETO SUPABASE DELETADO');
console.log('   ➡️  Se o projeto foi deletado, precisa criar novo');
console.log('   ➡️  Ou migrar para PostgreSQL direto\n');

console.log('4️⃣  STRING DE CONEXÃO MALFORMADA');
console.log('   ➡️  Formato correto:');
console.log('   ➡️  postgresql://postgres.PROJECT:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres\n');

console.log('═══════════════════════════════════════════════════\n');
console.log('🔧 COMO CORRIGIR:\n');

console.log('OPÇÃO A: Verificar Senha do Supabase\n');
console.log('1. Acesse: https://supabase.com/dashboard/project/_/settings/database');
console.log('2. Procure por "Connection pooling"');
console.log('3. Modo: "Transaction"');
console.log('4. Copie a Connection String completa');
console.log('5. Cole em DIRECT_URL no Vercel\n');

console.log('OPÇÃO B: Resetar Senha do Banco\n');
console.log('1. Acesse: https://supabase.com/dashboard/project/_/settings/database');
console.log('2. Clique em "Database password"');
console.log('3. Clique "Generate new password"');
console.log('4. Copie a NOVA senha');
console.log('5. Atualize DIRECT_URL no Vercel com a nova senha\n');

console.log('OPÇÃO C: Verificar Estado do Projeto\n');
console.log('1. Acesse: https://supabase.com/dashboard');
console.log('2. Verifique se o projeto está "Active"');
console.log('3. Se estiver "Paused", clique em "Restore"');
console.log('4. Aguarde alguns minutos para reativar\n');

console.log('═══════════════════════════════════════════════════\n');
console.log('📝 PASSOS PARA ATUALIZAR NO VERCEL:\n');

console.log('1. Acesse: https://vercel.com/costa32s-projects/transmission-platform/settings/environment-variables');
console.log('2. Procure por: DIRECT_URL');
console.log('3. Clique em "Edit"');
console.log('4. Cole a nova Connection String');
console.log('5. Clique "Save"');
console.log('6. Redeploy:');
console.log('   git commit --allow-empty -m "chore: trigger redeploy after DIRECT_URL fix"');
console.log('   git push inaff main\n');

console.log('═══════════════════════════════════════════════════\n');
console.log('🧪 TESTAR CONEXÃO LOCAL:\n');

if (DIRECT_URL) {
  console.log('Execute para testar localmente:');
  console.log('node scripts/test-db-connection.mjs\n');
} else {
  console.log('❌ Configure .env.local primeiro com DIRECT_URL\n');
}

console.log('═══════════════════════════════════════════════════\n');
console.log('💡 DICA: Se o erro persistir, considere migrar para PostgreSQL');
console.log('   direto (sem Supabase). Veja: REMOVER-SUPABASE-GUIA.md\n');
