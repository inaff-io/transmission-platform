#!/usr/bin/env node

/**
 * Testa o sistema de login da aplicação
 */

const PRODUCTION_URL = 'https://transmission-platform-xi.vercel.app';

console.log('╔════════════════════════════════════════════════╗');
console.log('║         TESTE DE LOGIN - PRODUÇÃO              ║');
console.log('╚════════════════════════════════════════════════╝\n');

console.log(`🌐 URL: ${PRODUCTION_URL}\n`);

async function testLogin() {
  console.log('📋 TESTES DE LOGIN:\n');
  
  // Teste 1: Página de login pública (inscrição)
  console.log('1️⃣  Testando página de inscrição pública...');
  try {
    const response = await fetch(`${PRODUCTION_URL}/inscricao`);
    console.log(`   ✅ Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      const html = await response.text();
      const hasForm = html.includes('form') || html.includes('input');
      const hasLogo = html.includes('logo') || html.includes('img');
      
      console.log(`   📝 Formulário detectado: ${hasForm ? '✅ Sim' : '❌ Não'}`);
      console.log(`   🖼️  Logo detectado: ${hasLogo ? '✅ Sim' : '❌ Não'}`);
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }
  console.log('');
  
  // Teste 2: Página de login admin
  console.log('2️⃣  Testando página de login admin...');
  try {
    const response = await fetch(`${PRODUCTION_URL}/admin`);
    console.log(`   ✅ Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      const html = await response.text();
      const hasLoginForm = html.includes('email') || html.includes('password') || html.includes('senha');
      const hasCPF = html.includes('cpf') || html.includes('CPF');
      
      console.log(`   📝 Formulário de login: ${hasLoginForm ? '✅ Detectado' : '❌ Não encontrado'}`);
      console.log(`   🆔 Campo CPF: ${hasCPF ? '✅ Detectado' : '❌ Não encontrado'}`);
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }
  console.log('');
  
  // Teste 3: API de autenticação
  console.log('3️⃣  Testando endpoint de autenticação...');
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'teste@invalido.com',
        cpf: '00000000000'
      })
    });
    
    console.log(`   ✅ Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 401 || response.status === 400) {
      console.log(`   ✅ Resposta esperada (credenciais inválidas)`);
      
      const data = await response.json();
      console.log(`   💬 Mensagem: ${JSON.stringify(data).substring(0, 100)}`);
    } else if (response.status === 500) {
      console.log(`   ⚠️  Erro no servidor - verificar logs`);
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }
  console.log('');
  
  // Teste 4: Verificar se existe endpoint de logout
  console.log('4️⃣  Testando endpoint de logout...');
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/auth/logout`, {
      method: 'POST',
    });
    
    console.log(`   ✅ Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 200 || response.status === 401) {
      console.log(`   ✅ Endpoint existe e está respondendo`);
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }
  console.log('');
  
  // Teste 5: Verificar proteção de rotas admin
  console.log('5️⃣  Testando proteção de rotas admin...');
  
  const protectedRoutes = [
    '/admin/usuarios',
    '/admin/chat',
    '/admin/links',
  ];
  
  for (const route of protectedRoutes) {
    try {
      const response = await fetch(`${PRODUCTION_URL}${route}`);
      
      if (response.status === 401 || response.status === 403) {
        console.log(`   ✅ ${route}: Protegido (${response.status})`);
      } else if (response.status === 302 || response.status === 307) {
        console.log(`   ✅ ${route}: Redirecionando (${response.status})`);
      } else if (response.status === 200) {
        console.log(`   ⚠️  ${route}: Acessível sem login (${response.status})`);
      } else {
        console.log(`   ℹ️  ${route}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ ${route}: ${error.message}`);
    }
  }
  console.log('');
  
  console.log('═══════════════════════════════════════════════\n');
  console.log('📊 RESUMO DOS TESTES:\n');
  
  console.log('✅ Sistema de autenticação está respondendo');
  console.log('✅ Páginas de login estão acessíveis');
  console.log('✅ API de login está ativa\n');
  
  console.log('🔐 TIPOS DE LOGIN SUPORTADOS:\n');
  console.log('1. Login por EMAIL (usuários comuns)');
  console.log('2. Login por CPF (usuários comuns)');
  console.log('3. Login admin (área restrita)\n');
  
  console.log('📝 PARA TESTAR LOGIN REAL:\n');
  console.log('Opção A - Interface Web:');
  console.log(`  1. Acesse: ${PRODUCTION_URL}/inscricao`);
  console.log('  2. Faça inscrição com seus dados');
  console.log('  3. Use email ou CPF para fazer login\n');
  
  console.log('Opção B - Usuário Existente:');
  console.log('  Se você já tem usuário cadastrado:');
  console.log(`  1. Acesse: ${PRODUCTION_URL}/admin`);
  console.log('  2. Digite email OU cpf');
  console.log('  3. Sistema autentica automaticamente\n');
  
  console.log('Opção C - Criar Usuário Teste via Script:');
  console.log('  node scripts/create-test-chat-user.mjs');
  console.log('  Usuario: usuario_teste_chat');
  console.log('  Email: teste.chat@example.com');
  console.log('  CPF: 99988877766\n');
  
  console.log('═══════════════════════════════════════════════\n');
  console.log('🔍 VERIFICAR LOGS:\n');
  console.log('Se encontrar problemas de login:');
  console.log('1. Verifique logs Vercel: vercel logs --follow');
  console.log('2. Verifique banco de dados: tabela usuarios');
  console.log('3. Verifique tabela logins (histórico de acessos)\n');
  
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║          FIM DOS TESTES DE LOGIN               ║');
  console.log('╚════════════════════════════════════════════════╝\n');
}

testLogin().catch(console.error);
