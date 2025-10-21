#!/usr/bin/env node

/**
 * Teste de login com usuário de teste real
 */

const PRODUCTION_URL = 'https://transmission-platform-xi.vercel.app';

console.log('╔════════════════════════════════════════════════╗');
console.log('║    TESTE LOGIN - USUÁRIO TESTE REAL            ║');
console.log('╚════════════════════════════════════════════════╝\n');

async function testRealLogin() {
  const testUser = {
    id: 'usuario_teste_chat',
    nome: 'Usuario Teste Chat',
    email: 'teste.chat@example.com',
    cpf: '99988877766'
  };
  
  console.log('👤 Usuário de Teste:');
  console.log(`   ID: ${testUser.id}`);
  console.log(`   Nome: ${testUser.nome}`);
  console.log(`   Email: ${testUser.email}`);
  console.log(`   CPF: ${testUser.cpf}\n`);
  
  console.log('═══════════════════════════════════════════════\n');
  
  // Teste 1: Login com EMAIL
  console.log('1️⃣  Teste: Login com EMAIL');
  console.log(`   Email: ${testUser.email}\n`);
  
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/auth/login/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email
      })
    });
    
    console.log(`   📡 Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log(`   📦 Resposta:\n${JSON.stringify(data, null, 2)}`);
    
    if (response.status === 200) {
      console.log(`\n   ✅ LOGIN BEM-SUCEDIDO!`);
      
      // Verificar cookies/headers de autenticação
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        console.log(`   🍪 Cookie de sessão recebido`);
        console.log(`   ${setCookie.substring(0, 100)}...`);
      }
      
      if (data.token) {
        console.log(`   🔑 Token JWT recebido`);
      }
      
      if (data.user) {
        console.log(`   👤 Dados do usuário:`);
        console.log(`      ID: ${data.user.id}`);
        console.log(`      Nome: ${data.user.nome}`);
        console.log(`      Email: ${data.user.email}`);
      }
    } else if (response.status === 404) {
      console.log(`\n   ⚠️  Usuário não encontrado no banco`);
      console.log(`   💡 Execute: node scripts/create-test-chat-user.mjs`);
    } else {
      console.log(`\n   ❌ Erro no login`);
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }
  
  console.log('\n═══════════════════════════════════════════════\n');
  
  // Teste 2: Login com CPF
  console.log('2️⃣  Teste: Login com CPF');
  console.log(`   CPF: ${testUser.cpf}\n`);
  
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/auth/login/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cpf: testUser.cpf
      })
    });
    
    console.log(`   📡 Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log(`   📦 Resposta:\n${JSON.stringify(data, null, 2)}`);
    
    if (response.status === 200) {
      console.log(`\n   ✅ LOGIN BEM-SUCEDIDO!`);
    } else if (response.status === 404) {
      console.log(`\n   ⚠️  Usuário não encontrado no banco`);
    } else {
      console.log(`\n   ❌ Erro no login`);
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }
  
  console.log('\n═══════════════════════════════════════════════\n');
  
  console.log('📊 RESUMO:\n');
  console.log('Se o usuário existe no banco:');
  console.log('  ✅ Login por EMAIL deve funcionar');
  console.log('  ✅ Login por CPF deve funcionar');
  console.log('  ✅ Cookie/Token deve ser retornado\n');
  
  console.log('Se recebeu 404:');
  console.log('  ⚠️  Usuário não existe no banco de produção');
  console.log('  💡 Execute: node scripts/create-test-chat-user.mjs');
  console.log('     Depois repita este teste\n');
  
  console.log('═══════════════════════════════════════════════\n');
  console.log('🔍 PRÓXIMOS PASSOS:\n');
  
  console.log('Se login funcionou:');
  console.log('  1. Testar acesso a rotas protegidas');
  console.log('  2. Testar funcionalidade de chat');
  console.log('  3. Testar dashboard admin\n');
  
  console.log('Se usuário não existe:');
  console.log('  1. Criar usuário de teste no banco');
  console.log('  2. Ou usar interface web para criar novo usuário');
  console.log('  3. Repetir testes de login\n');
  
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║         FIM DO TESTE DE LOGIN REAL             ║');
  console.log('╚════════════════════════════════════════════════╝\n');
}

testRealLogin().catch(console.error);
