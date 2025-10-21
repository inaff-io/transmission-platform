#!/usr/bin/env node

/**
 * Script para diagnosticar erro IPv6 recorrente
 * Verifica configuração de variáveis de ambiente
 */

console.log('╔════════════════════════════════════════════════╗');
console.log('║   DIAGNÓSTICO: Erro IPv6 ENETUNREACH           ║');
console.log('╚════════════════════════════════════════════════╝\n');

console.log('📋 INFORMAÇÕES DO ERRO:\n');
console.log('❌ Erro: ENETUNREACH');
console.log('❌ Endereço IPv6: 2600:1f16:1cd0:330b:3c1d:e05f:897d:51f3:5432');
console.log('❌ Porta: 5432');
console.log('❌ Endpoint: GET /api/links/active\n');

console.log('═══════════════════════════════════════════════\n');
console.log('🔍 POSSÍVEIS CAUSAS:\n');

console.log('1️⃣  DIRECT_URL não está configurado no Vercel');
console.log('   ├─ Verificar: https://vercel.com/inaff-io/transmission-platform/settings/environment-variables');
console.log('   └─ Deve existir variável: DIRECT_URL\n');

console.log('2️⃣  DIRECT_URL configurado com valor ERRADO');
console.log('   ├─ Valor CORRETO (pooler IPv4):');
console.log('   │  postgresql://postgres:PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres');
console.log('   │');
console.log('   ├─ Valor ERRADO (conexão direta IPv6):');
console.log('   │  postgresql://postgres:PASSWORD@db.ywcmqgfbxrejuwcbeolu.supabase.co:5432/postgres');
console.log('   │');
console.log('   └─ Importante: Deve usar "pooler.supabase.com" NÃO "db...supabase.co"\n');

console.log('3️⃣  Variável configurada mas NÃO deployada');
console.log('   ├─ Depois de adicionar/modificar variável no Vercel');
console.log('   └─ É necessário fazer REDEPLOY da aplicação\n');

console.log('4️⃣  Código antigo ainda em produção');
console.log('   ├─ Verificar último commit em produção');
console.log('   └─ Deve ser commit b4dd0db ou 5c728ed (com correção IPv6)\n');

console.log('═══════════════════════════════════════════════\n');
console.log('✅ SOLUÇÃO PASSO A PASSO:\n');

console.log('PASSO 1: Verificar Variável no Vercel');
console.log('────────────────────────────────────────');
console.log('a) Acesse: https://vercel.com/inaff-io/transmission-platform/settings/environment-variables');
console.log('b) Procure por: DIRECT_URL');
console.log('c) Verifique o valor:\n');
console.log('   ✅ CORRETO:');
console.log('   postgresql://postgres:OMSmx9QqbMq4OXun@aws-0-us-east-1.pooler.supabase.com:5432/postgres\n');
console.log('   ❌ INCORRETO (se tiver "db.ywcmqgfbxrejuwcbeolu"):');
console.log('   postgresql://postgres:OMSmx9QqbMq4OXun@db.ywcmqgfbxrejuwcbeolu.supabase.co:5432/postgres\n');

console.log('PASSO 2: Corrigir se Necessário');
console.log('────────────────────────────────────────');
console.log('Se DIRECT_URL não existe ou está incorreto:');
console.log('a) Clique em "Edit" ou "Add"');
console.log('b) Name: DIRECT_URL');
console.log('c) Value: postgresql://postgres:OMSmx9QqbMq4OXun@aws-0-us-east-1.pooler.supabase.com:5432/postgres');
console.log('d) Environments: ✅ Production ✅ Preview ✅ Development');
console.log('e) Clique em "Save"\n');

console.log('PASSO 3: Redeploy da Aplicação');
console.log('────────────────────────────────────────');
console.log('IMPORTANTE: Após salvar variável, REDEPLOY é obrigatório!\n');
console.log('Opção A - Via Dashboard:');
console.log('  1. Acesse: https://vercel.com/inaff-io/transmission-platform');
console.log('  2. Aba "Deployments"');
console.log('  3. Clique nos "..." do último deployment');
console.log('  4. Clique em "Redeploy"\n');
console.log('Opção B - Via Git Push:');
console.log('  git commit --allow-empty -m "chore: trigger redeploy for DIRECT_URL"');
console.log('  git push inaff main\n');
console.log('Opção C - Via CLI:');
console.log('  vercel --prod\n');

console.log('PASSO 4: Validar Correção');
console.log('────────────────────────────────────────');
console.log('Após redeploy, execute:');
console.log('  node scripts/check-deployment.mjs\n');
console.log('Resultado esperado:');
console.log('  ✅ Status: 200 OK');
console.log('  ✅ Tempo: < 200ms');
console.log('  ✅ Dados: array com links\n');

console.log('═══════════════════════════════════════════════\n');
console.log('📊 VERIFICAÇÃO RÁPIDA - AMBIENTE LOCAL:\n');

const DIRECT_URL = process.env.DIRECT_URL;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DIRECT_URL && !DATABASE_URL) {
  console.log('⚠️  NENHUMA variável configurada localmente');
  console.log('   Isto é normal se .env.local não existe');
  console.log('   Mas DIRECT_URL DEVE existir no Vercel!\n');
} else {
  if (DIRECT_URL) {
    console.log('✅ DIRECT_URL encontrado localmente');
    const isPooler = DIRECT_URL.includes('pooler.supabase.com');
    const isIPv4 = DIRECT_URL.includes('aws-0-');
    
    if (isPooler && isIPv4) {
      console.log('   ✅ Valor CORRETO (pooler IPv4)');
      console.log(`   URL: ${DIRECT_URL.substring(0, 60)}...`);
    } else {
      console.log('   ❌ Valor INCORRETO (não é pooler)');
      console.log(`   URL: ${DIRECT_URL.substring(0, 60)}...`);
      console.log('   ⚠️  Deve conter: "pooler.supabase.com"');
    }
    console.log('');
  } else {
    console.log('⚠️  DIRECT_URL NÃO encontrado localmente');
    console.log('   Mas deve existir no Vercel!\n');
  }
  
  if (DATABASE_URL) {
    console.log('ℹ️  DATABASE_URL encontrado localmente');
    const isDirect = DATABASE_URL.includes('db.') && !DATABASE_URL.includes('pooler');
    if (isDirect) {
      console.log('   ⚠️  É conexão direta (pode usar IPv6)');
      console.log('   ✅ OK se DIRECT_URL estiver configurado (tem prioridade)');
    }
    console.log('');
  }
}

console.log('═══════════════════════════════════════════════\n');
console.log('🔧 COMANDOS ÚTEIS:\n');
console.log('# Ver variáveis configuradas no Vercel:');
console.log('vercel env ls\n');
console.log('# Ver logs em tempo real:');
console.log('vercel logs --follow\n');
console.log('# Forçar novo deploy:');
console.log('git commit --allow-empty -m "chore: redeploy" && git push inaff main\n');

console.log('═══════════════════════════════════════════════\n');
console.log('📚 DOCUMENTAÇÃO:\n');
console.log('- CORRECAO-CONEXAO-IPV6.md - Guia completo da correção');
console.log('- SUCESSO-CORRECAO-IPV6.md - Validação e métricas');
console.log('- scripts/setup-direct-url.mjs - Instruções de configuração\n');

console.log('╔════════════════════════════════════════════════╗');
console.log('║   FIM DO DIAGNÓSTICO                           ║');
console.log('╚════════════════════════════════════════════════╝\n');

console.log('🎯 AÇÃO RECOMENDADA:');
console.log('   1. Verificar DIRECT_URL no painel Vercel');
console.log('   2. Corrigir valor se necessário (usar pooler)');
console.log('   3. Fazer REDEPLOY');
console.log('   4. Validar com check-deployment.mjs\n');
