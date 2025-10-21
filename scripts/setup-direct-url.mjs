#!/usr/bin/env node

/**
 * Script para obter a URL do Connection Pooler do Supabase
 * e instruções para configurar no Vercel
 */

console.log('╔════════════════════════════════════════════════╗');
console.log('║   CONFIGURAÇÃO: DIRECT_URL NO VERCEL          ║');
console.log('╚════════════════════════════════════════════════╝\n');

console.log('🔧 PASSO A PASSO PARA CORRIGIR ERRO IPv6\n');
console.log('═══════════════════════════════════════════════\n');

console.log('📋 ETAPA 1: OBTER URL DO POOLER NO SUPABASE\n');
console.log('1. Acesse o Supabase Dashboard:');
console.log('   https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/settings/database\n');
console.log('2. Procure por "Connection Pooling" ou "Pooler"\n');
console.log('3. Copie a Connection String que termina com ".pooler.supabase.com"\n');
console.log('═══════════════════════════════════════════════\n');

console.log('📋 ETAPA 2: CONFIGURAR NO VERCEL\n');
console.log('Opção A - Via Dashboard (Recomendado):\n');
console.log('1. Acesse:');
console.log('   https://vercel.com/inaff-io/transmission-platform/settings/environment-variables\n');
console.log('2. Clique em "Add New" ou "Add Variable"\n');
console.log('3. Preencha:');
console.log('   Name: DIRECT_URL');
console.log('   Value: <cole a URL do pooler aqui>\n');
console.log('4. Selecione os ambientes:');
console.log('   ✅ Production');
console.log('   ✅ Preview');
console.log('   ✅ Development\n');
console.log('5. Clique em "Save"\n');
console.log('═══════════════════════════════════════════════\n');

console.log('Opção B - Via CLI:\n');
console.log('```bash');
console.log('vercel env add DIRECT_URL production');
console.log('# Cole a URL do pooler quando solicitado');
console.log('```\n');
console.log('═══════════════════════════════════════════════\n');

console.log('📋 ETAPA 3: REDEPLOY\n');
console.log('Após adicionar a variável, faça um redeploy:\n');
console.log('Opção A - Automático (já feito com git push)');
console.log('  O Vercel vai detectar o novo commit e deployar\n');
console.log('Opção B - Manual via Dashboard');
console.log('  1. Vá em Deployments');
console.log('  2. Clique nos 3 pontinhos do último deployment');
console.log('  3. Clique em "Redeploy"\n');
console.log('═══════════════════════════════════════════════\n');

console.log('🔍 EXEMPLO DE URL DO POOLER:\n');
console.log('Formato esperado:');
console.log('postgresql://postgres:<PASSWORD>@aws-0-us-east-1.pooler.supabase.com:5432/postgres\n');
console.log('Onde:');
console.log('  <PASSWORD> = OMSmx9QqbMq4OXun (sua senha atual)\n');
console.log('IMPORTANTE: Use a mesma senha que está em DATABASE_URL!\n');
console.log('═══════════════════════════════════════════════\n');

console.log('✅ COMO VERIFICAR SE FUNCIONOU:\n');
console.log('1. Aguarde o redeploy (~2-3 minutos)\n');
console.log('2. Teste o endpoint:');
console.log('   curl https://transmission-platform.vercel.app/api/links/active\n');
console.log('3. Verifique os logs:');
console.log('   https://vercel.com/inaff-io/transmission-platform/logs\n');
console.log('4. Procure por:');
console.log('   ✅ Sem erros "ENETUNREACH"');
console.log('   ✅ Status 200 nas requisições');
console.log('   ✅ Dados retornados corretamente\n');
console.log('═══════════════════════════════════════════════\n');

console.log('⚠️  CASO NÃO ENCONTRE O POOLER NO SUPABASE:\n');
console.log('O Pooler pode estar em uma dessas localizações:\n');
console.log('• Database Settings > Connection Pooling');
console.log('• Project Settings > Database > Connection string');
console.log('• Procure por "Pooler" ou "IPv4"');
console.log('• URL termina com ".pooler.supabase.com"\n');
console.log('Se não encontrar, o Supabase pode usar IPv4 por padrão.');
console.log('Neste caso, apenas configure DIRECT_URL=DATABASE_URL\n');
console.log('═══════════════════════════════════════════════\n');

console.log('📝 RESUMO DOS LINKS:\n');
console.log('🔗 Supabase Database Settings:');
console.log('   https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/settings/database\n');
console.log('🔗 Vercel Environment Variables:');
console.log('   https://vercel.com/inaff-io/transmission-platform/settings/environment-variables\n');
console.log('🔗 Vercel Logs:');
console.log('   https://vercel.com/inaff-io/transmission-platform/logs\n');
console.log('═══════════════════════════════════════════════\n');

console.log('✨ COMMIT JÁ REALIZADO!\n');
console.log('Commit: b4dd0db');
console.log('Mensagem: fix: Corrige erro de conexão IPv6 no Vercel');
console.log('Status: ✅ Push realizado para inaff-io/transmission-platform\n');
console.log('Próximo passo: Configurar DIRECT_URL no Vercel\n');
console.log('═══════════════════════════════════════════════\n');
