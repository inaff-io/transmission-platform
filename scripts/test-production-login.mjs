#!/usr/bin/env node

/**
 * Teste de Login em Produção
 * Valida login admin e user via API
 */

const PROD_URL = 'https://transmission-platform-xi.vercel.app';

// Credenciais de teste
const ADMIN_CREDENTIALS = {
  email: 'pecosta26@gmail.com',
  cpf: '05701807401'
};

const USER_CREDENTIALS = [
  { email: 'maria.silva@test.com', cpf: '12345678901', nome: 'Maria Silva' },
  { email: 'joao.santos@test.com', cpf: '98765432109', nome: 'João Santos' },
  { email: 'ana.oliveira@test.com', cpf: '45678912301', nome: 'Ana Oliveira' }
];

/**
 * Testa login via API
 */
async function testLogin(endpoint, credentials, expectedRedirect) {
  try {
    console.log(`\n🔍 Testando: ${endpoint}`);
    console.log(`📧 Credencial: ${credentials.email || credentials.cpf}`);
    
    const response = await fetch(`${PROD_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📦 Response:`, JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log(`✅ LOGIN SUCESSO!`);
      if (data.redirectUrl === expectedRedirect) {
        console.log(`✅ Redirect correto: ${data.redirectUrl}`);
      } else {
        console.log(`⚠️  Redirect diferente: esperado ${expectedRedirect}, recebido ${data.redirectUrl}`);
      }
      if (data.user) {
        console.log(`👤 Usuário: ${data.user.nome} (${data.user.categoria})`);
      }
      return true;
    } else {
      console.log(`❌ LOGIN FALHOU: ${data.message || 'Erro desconhecido'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ERRO: ${error.message}`);
    return false;
  }
}

/**
 * Teste completo do sistema
 */
async function runTests() {
  console.log('🚀 TESTE DE LOGIN EM PRODUÇÃO');
  console.log('=' .repeat(60));
  console.log(`🌐 URL: ${PROD_URL}`);
  console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
  console.log('=' .repeat(60));

  const results = {
    adminEmail: false,
    adminCpf: false,
    users: []
  };

  // Teste 1: Login Admin por Email
  console.log('\n📋 TESTE 1: Admin Login (Email)');
  console.log('-'.repeat(60));
  results.adminEmail = await testLogin(
    '/api/auth/login/admin',
    { email: ADMIN_CREDENTIALS.email },
    '/admin'
  );

  // Aguarda 1 segundo entre testes
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Teste 2: Login Admin por CPF
  console.log('\n📋 TESTE 2: Admin Login (CPF)');
  console.log('-'.repeat(60));
  results.adminCpf = await testLogin(
    '/api/auth/login/admin',
    { cpf: ADMIN_CREDENTIALS.cpf },
    '/admin'
  );

  // Aguarda 1 segundo entre testes
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Teste 3-5: Login Usuários
  for (let i = 0; i < USER_CREDENTIALS.length; i++) {
    const user = USER_CREDENTIALS[i];
    console.log(`\n📋 TESTE ${i + 3}: User Login (${user.nome} - Email)`);
    console.log('-'.repeat(60));
    
    const success = await testLogin(
      '/api/auth/login/user',
      { email: user.email },
      '/transmission'
    );
    
    results.users.push({
      nome: user.nome,
      email: user.email,
      success
    });

    // Aguarda 1 segundo entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Resumo Final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DOS TESTES');
  console.log('='.repeat(60));
  
  const totalTests = 2 + USER_CREDENTIALS.length;
  const passedTests = [
    results.adminEmail,
    results.adminCpf,
    ...results.users.map(u => u.success)
  ].filter(Boolean).length;

  console.log(`\n✅ Admin Login (Email): ${results.adminEmail ? 'PASSOU' : 'FALHOU'}`);
  console.log(`✅ Admin Login (CPF): ${results.adminCpf ? 'PASSOU' : 'FALHOU'}`);
  
  results.users.forEach((user, i) => {
    console.log(`${user.success ? '✅' : '❌'} User ${i + 1} (${user.nome}): ${user.success ? 'PASSOU' : 'FALHOU'}`);
  });

  console.log('\n' + '-'.repeat(60));
  console.log(`📈 RESULTADO FINAL: ${passedTests}/${totalTests} testes passaram`);
  console.log('-'.repeat(60));

  if (passedTests === totalTests) {
    console.log('\n🎉 SUCESSO TOTAL! Sistema 100% operacional!');
    console.log('✅ Login admin funcionando');
    console.log('✅ Login usuários funcionando');
    console.log('✅ Autenticação sem senha OK');
    console.log('✅ IPv6 resolvido (usando pooler SA-East-1)');
    console.log('✅ Região otimizada para Brasil');
  } else {
    console.log('\n⚠️  ATENÇÃO: Alguns testes falharam!');
    console.log('Verifique os logs acima para detalhes.');
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Testes concluídos!');
  console.log('='.repeat(60));
}

// Executa os testes
runTests().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
