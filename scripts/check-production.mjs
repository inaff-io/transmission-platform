#!/usr/bin/env node

/**
 * Verifica status da aplicação em produção
 */

const PRODUCTION_URL = 'https://transmission-platform-xi.vercel.app';

console.log('╔════════════════════════════════════════════════╗');
console.log('║   VERIFICAÇÃO DE PRODUÇÃO - VERCEL             ║');
console.log('╚════════════════════════════════════════════════╝\n');

console.log(`🌐 URL: ${PRODUCTION_URL}\n`);

async function checkProduction() {
  const endpoints = [
    { name: 'Homepage', path: '/' },
    { name: 'API Links Active', path: '/api/links/active' },
    { name: 'Admin Login', path: '/admin' },
  ];

  console.log('📊 Testando endpoints...\n');

  for (const endpoint of endpoints) {
    const url = `${PRODUCTION_URL}${endpoint.path}`;
    console.log(`🔍 ${endpoint.name}: ${endpoint.path}`);
    
    try {
      const startTime = Date.now();
      const response = await fetch(url);
      const duration = Date.now() - startTime;
      
      const status = response.status;
      const statusText = response.statusText;
      
      if (status >= 200 && status < 300) {
        console.log(`   ✅ Status: ${status} ${statusText}`);
        console.log(`   ⏱️  Tempo: ${duration}ms`);
        
        // Tentar ler resposta se for JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log(`   📦 Dados: ${JSON.stringify(data).substring(0, 100)}...`);
        }
      } else if (status >= 500) {
        console.log(`   ❌ Status: ${status} ${statusText} (ERRO SERVIDOR)`);
        console.log(`   ⏱️  Tempo: ${duration}ms`);
        
        // Tentar ler erro
        const text = await response.text();
        if (text) {
          console.log(`   💬 Resposta: ${text.substring(0, 200)}`);
        }
      } else {
        console.log(`   ⚠️  Status: ${status} ${statusText}`);
        console.log(`   ⏱️  Tempo: ${duration}ms`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERRO: ${error.message}`);
      
      // Se for erro de rede/timeout
      if (error.cause) {
        console.log(`   💡 Causa: ${error.cause.message || error.cause}`);
      }
    }
    
    console.log('');
  }

  console.log('═══════════════════════════════════════════════\n');
  console.log('🔍 DIAGNÓSTICO IPv6:\n');
  console.log('Se /api/links/active retornar erro 500 ou timeout:');
  console.log('➡️  Provável causa: DIRECT_URL não configurado no Vercel\n');
  
  console.log('✅ SOLUÇÃO:');
  console.log('1. Acesse: https://vercel.com/inaff-io/transmission-platform/settings/environment-variables');
  console.log('2. Adicione/Edite: DIRECT_URL');
  console.log('3. Valor: postgresql://postgres:PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres');
  console.log('4. Ambientes: Production, Preview, Development');
  console.log('5. REDEPLOY obrigatório!\n');
  
  console.log('📚 Documentação: ERRO-IPV6-VOLTOU.md\n');
}

checkProduction().catch(console.error);
