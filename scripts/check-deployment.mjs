#!/usr/bin/env node

/**
 * Script para verificar o status do deployment no Vercel
 * Testa as principais funcionalidades da aplicação
 */

const PRODUCTION_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://transmission-platform.vercel.app';

console.log('╔════════════════════════════════════════════════╗');
console.log('║   VERIFICAÇÃO DE DEPLOYMENT - VERCEL          ║');
console.log('╚════════════════════════════════════════════════╝\n');

console.log(`🌐 URL de Produção: ${PRODUCTION_URL}\n`);

/**
 * Testa se uma URL está respondendo
 */
async function checkEndpoint(url, description) {
  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const duration = Date.now() - startTime;
    
    const status = response.ok ? '✅' : '❌';
    console.log(`${status} ${description}`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Tempo: ${duration}ms`);
    console.log(`   URL: ${url}\n`);
    
    return response.ok;
  } catch (error) {
    console.log(`❌ ${description}`);
    console.log(`   Erro: ${error.message}`);
    console.log(`   URL: ${url}\n`);
    return false;
  }
}

/**
 * Executa todos os testes
 */
async function runTests() {
  console.log('📋 Iniciando testes...\n');
  
  const tests = [
    {
      url: PRODUCTION_URL,
      description: 'Página Principal (Home)'
    },
    {
      url: `${PRODUCTION_URL}/inscricao`,
      description: 'Página de Inscrição (Nova)'
    },
    {
      url: `${PRODUCTION_URL}/api/health`,
      description: 'API Health Check'
    },
    {
      url: `${PRODUCTION_URL}/api/links/active`,
      description: 'API Links Ativos'
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await checkEndpoint(test.url, test.description);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('═══════════════════════════════════════════════\n');
  console.log('📊 RESULTADO DOS TESTES:\n');
  console.log(`   ✅ Passou: ${passed}`);
  console.log(`   ❌ Falhou: ${failed}`);
  console.log(`   📈 Taxa de sucesso: ${Math.round((passed / tests.length) * 100)}%\n`);
  
  if (failed === 0) {
    console.log('🎉 DEPLOYMENT VALIDADO COM SUCESSO!\n');
    console.log('✅ Todas as funcionalidades estão respondendo corretamente.');
    console.log('✅ A aplicação está no ar e funcionando!\n');
  } else {
    console.log('⚠️  ALGUNS TESTES FALHARAM\n');
    console.log('Possíveis causas:');
    console.log('- Deploy ainda em progresso (aguarde 2-5 minutos)');
    console.log('- Problemas de rede ou DNS');
    console.log('- URL de produção incorreta\n');
    console.log('💡 Tente executar o script novamente em alguns minutos.\n');
  }
  
  console.log('═══════════════════════════════════════════════\n');
  
  // Instruções finais
  console.log('📝 PRÓXIMOS PASSOS:\n');
  console.log('1. Acesse o Vercel Dashboard:');
  console.log('   https://vercel.com/inaff-io\n');
  console.log('2. Verifique os logs de build e deployment\n');
  console.log('3. Teste manualmente:');
  console.log(`   - Logo panorâmico: ${PRODUCTION_URL}/inscricao`);
  console.log(`   - Sistema de chat: ${PRODUCTION_URL}/transmission`);
  console.log(`   - Admin: ${PRODUCTION_URL}/admin\n`);
  
  return failed === 0;
}

// Executar testes
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erro ao executar testes:', error);
    process.exit(1);
  });
