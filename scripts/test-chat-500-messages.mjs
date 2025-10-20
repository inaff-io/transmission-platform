#!/usr/bin/env node

/**
 * Script de Teste: Chat com 500 Mensagens
 * 
 * Objetivo: Testar o sistema de chat enviando 500 mensagens
 * com intervalo de 10 segundos entre cada mensagem.
 * 
 * Configuração:
 * - Total de mensagens: 500
 * - Intervalo: 10 segundos (10000ms)
 * - Usuário: Normal (não admin)
 * - Tempo estimado: ~83 minutos (500 × 10s)
 */

// Configurações
const BASE_URL = 'http://localhost:3000';
const TOTAL_MESSAGES = 500;
const INTERVAL_MS = 10000; // 10 segundos

// Credenciais do usuário de teste (normal)
const TEST_USER = {
  email: 'usuario.teste@example.com',
  cpf: '99988877766',
  nome: 'Usuário Teste Chat'
};

// Estatísticas
let stats = {
  enviadas: 0,
  sucesso: 0,
  falhas: 0,
  erros: [],
  iniciado: null,
  ultimaMensagem: null
};

/**
 * Faz login e retorna o token
 */
async function login() {
  console.log('🔐 Fazendo login...');
  console.log(`   Email: ${TEST_USER.email}`);
  console.log(`   CPF: ${TEST_USER.cpf}`);
  
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
    
    // Extrai o token do cookie Set-Cookie
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
    console.log(`   Usuário: ${data.usuario?.nome || TEST_USER.nome}`);
    console.log(`   Categoria: ${data.usuario?.categoria || 'user'}`);
    console.log(`   Token: ${token.substring(0, 20)}...`);
    
    return token;
  } catch (error) {
    console.error('❌ Erro ao fazer login:', error.message);
    throw error;
  }
}

/**
 * Envia uma mensagem no chat
 */
async function sendMessage(token, messageNumber) {
  const message = `Teste de carga - Mensagem #${messageNumber} de ${TOTAL_MESSAGES}`;
  
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

/**
 * Formata o tempo decorrido
 */
function formatElapsedTime(start) {
  const elapsed = Date.now() - start;
  const seconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Formata o tempo estimado restante
 */
function formatETA(remaining) {
  const etaMs = remaining * INTERVAL_MS;
  const seconds = Math.floor(etaMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Exibe o progresso
 */
function showProgress(current, total, start) {
  const percentage = ((current / total) * 100).toFixed(1);
  const barLength = 30;
  const filled = Math.floor((current / total) * barLength);
  const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
  const remaining = total - current;
  const eta = formatETA(remaining);
  const elapsed = formatElapsedTime(start);
  
  console.log(`\n📊 Progresso: [${bar}] ${percentage}%`);
  console.log(`   Enviadas: ${current}/${total}`);
  console.log(`   Sucesso: ${stats.sucesso}`);
  console.log(`   Falhas: ${stats.falhas}`);
  console.log(`   Tempo decorrido: ${elapsed}`);
  console.log(`   Tempo estimado restante: ${eta}`);
  
  if (stats.falhas > 0) {
    console.log(`\n⚠️  Últimos erros (${Math.min(3, stats.erros.length)}):`);
    stats.erros.slice(-3).forEach(e => {
      console.log(`   Mensagem #${e.numero}: ${e.erro}`);
    });
  }
}

/**
 * Aguarda um intervalo (com cancelamento)
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Função principal
 */
async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   TESTE DE CARGA: CHAT COM 500 MENSAGENS      ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  console.log('⚙️  Configurações:');
  console.log(`   Total de mensagens: ${TOTAL_MESSAGES}`);
  console.log(`   Intervalo: ${INTERVAL_MS / 1000} segundos`);
  console.log(`   Tempo estimado: ~${Math.ceil(TOTAL_MESSAGES * INTERVAL_MS / 1000 / 60)} minutos`);
  console.log(`   URL base: ${BASE_URL}\n`);
  
  // Faz login
  const token = await login();
  
  console.log('\n📤 Iniciando envio de mensagens...');
  console.log('   (Pressione Ctrl+C para cancelar)\n');
  
  stats.iniciado = Date.now();
  
  // Loop de envio
  for (let i = 1; i <= TOTAL_MESSAGES; i++) {
    stats.enviadas = i;
    
    try {
      const message = await sendMessage(token, i);
      
      // Exibe progresso a cada 10 mensagens
      if (i % 10 === 0 || i === 1) {
        showProgress(i, TOTAL_MESSAGES, stats.iniciado);
      } else {
        // Feedback rápido para as outras
        process.stdout.write(`\r✅ Mensagem #${i} enviada com sucesso`);
      }
      
      // Aguarda intervalo (exceto na última mensagem)
      if (i < TOTAL_MESSAGES) {
        await sleep(INTERVAL_MS);
      }
      
    } catch (error) {
      console.error(`\n❌ Erro ao enviar mensagem #${i}:`, error.message);
      
      // Se houver muitos erros seguidos, pergunta se quer continuar
      if (stats.falhas > 5 && stats.falhas === i) {
        console.error('\n⚠️  Muitos erros consecutivos detectados!');
        console.error('   Verifique se o servidor está rodando e se as credenciais estão corretas.');
        process.exit(1);
      }
      
      // Aguarda intervalo mesmo em caso de erro
      if (i < TOTAL_MESSAGES) {
        await sleep(INTERVAL_MS);
      }
    }
  }
  
  // Relatório final
  console.log('\n\n╔════════════════════════════════════════════════╗');
  console.log('║            TESTE CONCLUÍDO                     ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  const tempoTotal = formatElapsedTime(stats.iniciado);
  const taxaSucesso = ((stats.sucesso / TOTAL_MESSAGES) * 100).toFixed(1);
  
  console.log('📊 Estatísticas Finais:');
  console.log(`   Total de mensagens: ${TOTAL_MESSAGES}`);
  console.log(`   Enviadas com sucesso: ${stats.sucesso}`);
  console.log(`   Falhas: ${stats.falhas}`);
  console.log(`   Taxa de sucesso: ${taxaSucesso}%`);
  console.log(`   Tempo total: ${tempoTotal}`);
  console.log(`   Primeira mensagem: ${new Date(stats.iniciado).toLocaleString('pt-BR')}`);
  console.log(`   Última mensagem: ${stats.ultimaMensagem ? new Date(stats.ultimaMensagem).toLocaleString('pt-BR') : 'N/A'}`);
  
  if (stats.falhas > 0) {
    console.log(`\n⚠️  Total de erros: ${stats.erros.length}`);
    console.log('   Primeiros 5 erros:');
    stats.erros.slice(0, 5).forEach(e => {
      console.log(`   - Mensagem #${e.numero}: ${e.erro}`);
    });
  }
  
  if (stats.sucesso === TOTAL_MESSAGES) {
    console.log('\n🎉 Teste concluído com 100% de sucesso!');
  } else if (taxaSucesso >= 95) {
    console.log('\n✅ Teste concluído com sucesso (>95% de taxa de sucesso)');
  } else if (taxaSucesso >= 80) {
    console.log('\n⚠️  Teste concluído com avisos (80-95% de taxa de sucesso)');
  } else {
    console.log('\n❌ Teste concluído com problemas (<80% de taxa de sucesso)');
  }
  
  console.log('\n✨ Teste finalizado!\n');
}

// Tratamento de interrupção (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Teste interrompido pelo usuário!');
  console.log(`   Mensagens enviadas: ${stats.enviadas}/${TOTAL_MESSAGES}`);
  console.log(`   Sucesso: ${stats.sucesso}`);
  console.log(`   Falhas: ${stats.falhas}`);
  
  if (stats.iniciado) {
    const tempoDecorrido = formatElapsedTime(stats.iniciado);
    console.log(`   Tempo decorrido: ${tempoDecorrido}`);
  }
  
  console.log('\n👋 Até logo!\n');
  process.exit(0);
});

// Executa o teste
main().catch(error => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});
