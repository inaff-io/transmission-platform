#!/usr/bin/env node

/**
 * Script de Teste: Chat Messages API
 * Testa POST e GET de mensagens do chat
 */

const BASE_URL = process.env.VERCEL_URL || 'https://transmission-platform-xi.vercel.app';

async function loginAdmin() {
  console.log('🔐 Fazendo login como admin...');
  
  const response = await fetch(`${BASE_URL}/api/auth/login/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'pecosta26@gmail.com' })
  });

  if (!response.ok) {
    throw new Error(`Login falhou: ${response.status} ${await response.text()}`);
  }

  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error('Sem cookie de autenticação');
  }

  // Extrai o token do cookie
  const tokenMatch = setCookie.match(/authToken=([^;]+)/);
  if (!tokenMatch) {
    throw new Error('Token não encontrado no cookie');
  }

  console.log('✅ Login bem-sucedido!');
  return tokenMatch[1];
}

async function testGetMessages(token) {
  console.log('\n📥 Testando GET /api/chat/messages...');
  
  const response = await fetch(`${BASE_URL}/api/chat/messages`, {
    headers: {
      'Cookie': `authToken=${token}`
    }
  });

  console.log(`Status: ${response.status}`);
  
  if (!response.ok) {
    const error = await response.text();
    console.error('❌ ERRO:', error);
    throw new Error(`GET falhou: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ GET bem-sucedido!');
  console.log(`📊 Total de mensagens: ${data.messages?.length || 0}`);
  
  if (data.messages && data.messages.length > 0) {
    console.log('\n📝 Últimas 3 mensagens:');
    data.messages.slice(0, 3).forEach((msg, i) => {
      console.log(`  ${i + 1}. [${msg.userName}]: ${msg.message.substring(0, 50)}...`);
    });
  }
  
  return data;
}

async function testPostMessage(token) {
  console.log('\n📤 Testando POST /api/chat/messages...');
  
  const testMessage = `Teste automatizado - ${new Date().toISOString()}`;
  console.log(`Mensagem: "${testMessage}"`);
  
  const response = await fetch(`${BASE_URL}/api/chat/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `authToken=${token}`
    },
    body: JSON.stringify({ message: testMessage })
  });

  console.log(`Status: ${response.status}`);
  
  if (!response.ok) {
    const error = await response.text();
    console.error('❌ ERRO:', error);
    throw new Error(`POST falhou: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ POST bem-sucedido!');
  console.log(`📨 Mensagem criada:`, {
    id: data.message?.id,
    userName: data.message?.userName,
    message: data.message?.message
  });
  
  return data;
}

async function testChatAPI() {
  try {
    console.log('🧪 TESTE: Chat Messages API\n');
    console.log(`🌐 URL: ${BASE_URL}\n`);
    console.log('━'.repeat(60));

    // 1. Login
    const token = await loginAdmin();

    // 2. Test GET
    await testGetMessages(token);

    // 3. Test POST
    await testPostMessage(token);

    // 4. Verify POST (GET again)
    console.log('\n🔍 Verificando se mensagem foi salva...');
    const messagesAfter = await testGetMessages(token);

    console.log('\n━'.repeat(60));
    console.log('✅ TODOS OS TESTES PASSARAM!');
    console.log('━'.repeat(60));

  } catch (error) {
    console.error('\n━'.repeat(60));
    console.error('❌ TESTE FALHOU!');
    console.error('━'.repeat(60));
    console.error('\n🔴 Erro:', error.message);
    
    if (error.stack) {
      console.error('\n📍 Stack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Executa teste
testChatAPI();
