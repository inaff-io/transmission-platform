#!/usr/bin/env node

/**
 * Script de Teste Rápido: Chat com 10 Mensagens
 * 
 * Versão de teste rápido para validar o funcionamento antes do teste completo
 */

const BASE_URL = 'http://localhost:3000';
const TOTAL_MESSAGES = 10;
const INTERVAL_MS = 2000; // 2 segundos para teste rápido

const TEST_USER = {
  email: 'usuario.teste@example.com',
  cpf: '99988877766',
  nome: 'Usuário Teste Chat'
};

let stats = {
  enviadas: 0,
  sucesso: 0,
  falhas: 0,
  erros: [],
  iniciado: null,
  ultimaMensagem: null
};

async function login() {
  console.log('🔐 Fazendo login...');
  console.log(`   Email: ${TEST_USER.email}`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_USER.email,
        cpf: TEST_USER.cpf,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Login falhou: ${response.status} - ${errorData.error || 'Erro desconhecido'}`);
    }

    const data = await response.json();
    const setCookieHeader = response.headers.get('set-cookie');
    if (!setCookieHeader) {
      throw new Error('Token não encontrado no header Set-Cookie');
    }

    const authTokenMatch = setCookieHeader.match(/authToken=([^;]+)/);
    if (!authTokenMatch) {
      throw new Error('authToken não encontrado no cookie');
    }

    const token = authTokenMatch[1];
    
    console.log('✅ Login realizado com sucesso!');
    console.log(`   Usuário: ${data.user?.nome || TEST_USER.nome}`);
    console.log(`   Token: ${token.substring(0, 20)}...`);
    
    return token;
  } catch (error) {
    console.error('❌ Erro ao fazer login:', error.message);
    throw error;
  }
}

async function sendMessage(token, messageNumber) {
  const message = `Teste rápido - Mensagem #${messageNumber} de ${TOTAL_MESSAGES}`;
  
  try {
    const response = await fetch(`${BASE_URL}/api/chat/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `authToken=${token}`,
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`${response.status} - ${errorData.error || 'Erro desconhecido'}`);
    }

    const data = await response.json();
    stats.sucesso++;
    stats.ultimaMensagem = new Date().toISOString();
    
    return data.message;
  } catch (error) {
    stats.falhas++;
    stats.erros.push({
      numero: messageNumber,
      erro: error.message,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   TESTE RÁPIDO: CHAT COM 10 MENSAGENS         ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  console.log('⚙️  Configurações:');
  console.log(`   Total de mensagens: ${TOTAL_MESSAGES}`);
  console.log(`   Intervalo: ${INTERVAL_MS / 1000} segundos`);
  console.log(`   Tempo estimado: ~${Math.ceil(TOTAL_MESSAGES * INTERVAL_MS / 1000)} segundos`);
  console.log(`   URL base: ${BASE_URL}\n`);
  
  const token = await login();
  
  console.log('\n📤 Iniciando envio de mensagens...\n');
  
  stats.iniciado = Date.now();
  
  for (let i = 1; i <= TOTAL_MESSAGES; i++) {
    stats.enviadas = i;
    
    try {
      await sendMessage(token, i);
      console.log(`✅ Mensagem #${i}/${TOTAL_MESSAGES} enviada com sucesso`);
      
      if (i < TOTAL_MESSAGES) {
        await sleep(INTERVAL_MS);
      }
      
    } catch (error) {
      console.error(`❌ Erro ao enviar mensagem #${i}:`, error.message);
      
      if (i < TOTAL_MESSAGES) {
        await sleep(INTERVAL_MS);
      }
    }
  }
  
  console.log('\n\n╔════════════════════════════════════════════════╗');
  console.log('║            TESTE CONCLUÍDO                     ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  const tempoTotal = Math.floor((Date.now() - stats.iniciado) / 1000);
  const taxaSucesso = ((stats.sucesso / TOTAL_MESSAGES) * 100).toFixed(1);
  
  console.log('📊 Estatísticas Finais:');
  console.log(`   Total de mensagens: ${TOTAL_MESSAGES}`);
  console.log(`   Enviadas com sucesso: ${stats.sucesso}`);
  console.log(`   Falhas: ${stats.falhas}`);
  console.log(`   Taxa de sucesso: ${taxaSucesso}%`);
  console.log(`   Tempo total: ${tempoTotal}s`);
  
  if (stats.falhas > 0) {
    console.log(`\n⚠️  Erros encontrados:`);
    for (const e of stats.erros) {
      console.log(`   - Mensagem #${e.numero}: ${e.erro}`);
    }
  }
  
  if (stats.sucesso === TOTAL_MESSAGES) {
    console.log('\n🎉 Teste rápido concluído com 100% de sucesso!');
    console.log('✅ Sistema pronto para o teste completo de 500 mensagens!\n');
  } else if (taxaSucesso >= 80) {
    console.log('\n⚠️  Teste concluído com avisos. Verifique os erros antes do teste completo.\n');
  } else {
    console.log('\n❌ Teste falhou. Corrija os problemas antes de executar o teste completo.\n');
  }
}

main().catch(error => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});
