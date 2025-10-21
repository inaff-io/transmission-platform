#!/usr/bin/env node

/**
 * Debug detalhado: Chat POST error
 */

const BASE_URL = 'https://transmission-platform-xi.vercel.app';

async function debugChatPost() {
  try {
    console.log('🔐 1. Fazendo login...\n');
    
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'pecosta26@gmail.com' })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login falhou: ${loginResponse.status}`);
    }

    const setCookie = loginResponse.headers.get('set-cookie');
    const tokenMatch = setCookie?.match(/authToken=([^;]+)/);
    const token = tokenMatch?.[1];

    if (!token) {
      throw new Error('Token não encontrado');
    }

    console.log('✅ Login OK\n');

    console.log('📤 2. Tentando POST /api/chat/messages...\n');
    
    const testMessage = 'Debug test - ' + new Date().toISOString();
    
    const postResponse = await fetch(`${BASE_URL}/api/chat/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `authToken=${token}`
      },
      body: JSON.stringify({ message: testMessage })
    });

    console.log(`Status: ${postResponse.status}`);
    console.log(`Headers:`, Object.fromEntries(postResponse.headers));
    
    const responseText = await postResponse.text();
    console.log(`\nRaw Response:`);
    console.log(responseText);

    if (postResponse.ok) {
      console.log('\n✅ POST funcionou!');
      const data = JSON.parse(responseText);
      console.log('Mensagem criada:', data);
    } else {
      console.log('\n❌ POST falhou!');
      
      try {
        const errorData = JSON.parse(responseText);
        console.log('Error JSON:', JSON.stringify(errorData, null, 2));
        
        if (errorData.details) {
          console.log('\n🔍 Detalhes do erro:');
          console.log(errorData.details);
        }
      } catch (e) {
        console.log('Resposta não é JSON válido');
      }
    }

    // Tenta verificar logs do Vercel (se disponível)
    console.log('\n📋 Dica: Verificar logs em:');
    console.log('https://vercel.com/costa32s-projects/transmission-platform/deployments');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error);
  }
}

debugChatPost();
