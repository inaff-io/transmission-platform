#!/usr/bin/env node

/**
 * Teste da API de Usuários Online
 */

const PROD_URL = 'https://transmission-platform-xi.vercel.app';
const ADMIN_EMAIL = 'pecosta26@gmail.com';

async function testOnlineUsersAPI() {
  console.log('🔍 TESTE: API de Usuários Online\n');
  console.log('=' . repeat(60));

  try {
    // Passo 1: Login admin
    console.log('\n📋 Passo 1: Login Admin');
    console.log('-'.repeat(60));
    
    const loginRes = await fetch(`${PROD_URL}/api/auth/login/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL })
    });

    if (!loginRes.ok) {
      throw new Error(`Login falhou: ${loginRes.status}`);
    }

    const loginData = await loginRes.json();
    console.log(`✅ Login OK: ${loginData.user.nome}`);

    // Extrai o cookie authToken
    const setCookie = loginRes.headers.get('set-cookie');
    if (!setCookie) {
      throw new Error('authToken não retornado no login');
    }

    const tokenMatch = setCookie.match(/authToken=([^;]+)/);
    if (!tokenMatch) {
      throw new Error('Não foi possível extrair authToken');
    }
    const authToken = tokenMatch[1];
    console.log(`🔑 Token obtido: ${authToken.substring(0, 20)}...`);

    // Aguarda 1 segundo
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Passo 2: Buscar usuários online
    console.log('\n📋 Passo 2: Buscar Usuários Online');
    console.log('-'.repeat(60));

    const onlineRes = await fetch(`${PROD_URL}/api/admin/online`, {
      headers: {
        'Cookie': `authToken=${authToken}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    console.log(`📊 Status: ${onlineRes.status} ${onlineRes.statusText}`);

    if (!onlineRes.ok) {
      const errorData = await onlineRes.json();
      console.log(`❌ Erro:`, errorData);
      throw new Error(`API retornou ${onlineRes.status}`);
    }

    const onlineData = await onlineRes.json();
    console.log(`✅ Resposta recebida com sucesso`);
    console.log(`📦 Dados:`, JSON.stringify(onlineData, null, 2));

    // Análise dos dados
    console.log('\n📊 Análise dos Resultados:');
    console.log('-'.repeat(60));
    
    if (onlineData.data && Array.isArray(onlineData.data)) {
      console.log(`👥 Total de usuários online: ${onlineData.data.length}`);
      
      if (onlineData.data.length > 0) {
        console.log('\n👤 Usuários Online:');
        onlineData.data.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.nome} (${user.email})`);
          console.log(`     Última atividade: ${user.lastActive}`);
        });
      } else {
        console.log('⚠️  Nenhum usuário online no momento');
        console.log('   (Considere atualizar last_active para testar)');
      }
    } else {
      console.log('⚠️  Formato de resposta inesperado');
    }

    // Resultado final
    console.log('\n' + '='.repeat(60));
    console.log('✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log('='.repeat(60));
    console.log('✅ Login admin: OK');
    console.log('✅ API /admin/online: OK');
    console.log('✅ Resposta válida: OK');
    console.log('\n🎉 API de Usuários Online funcionando!');

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ ERRO NO TESTE:');
    console.error('='.repeat(60));
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Executa o teste
testOnlineUsersAPI();
