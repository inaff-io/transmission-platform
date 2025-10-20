#!/usr/bin/env node

/**
 * Script de Teste: Simulação de Conversa Real no Chat
 * 
 * Simula múltiplos usuários reais do banco conversando no chat
 * para testar comportamento em situação real
 */

import pg from 'pg';
const { Client } = pg;

const BASE_URL = 'http://localhost:3000';
const connectionString = 'postgresql://postgres:OMSmx9QqbMq4OXun@db.ywcmqgfbxrejuwcbeolu.supabase.co:5432/postgres';

// Mensagens variadas para simular conversa real
const MENSAGENS_TEMPLATE = [
  "Olá a todos! Como está a transmissão?",
  "Muito bom esse conteúdo!",
  "Alguém pode me ajudar com uma dúvida?",
  "Excelente apresentação!",
  "Concordo totalmente com o palestrante",
  "Onde posso encontrar os materiais?",
  "Alguém mais está assistindo?",
  "Que horário termina o evento?",
  "Parabéns pela organização!",
  "Muito interessante esse tema",
  "Obrigado por compartilhar!",
  "Estou aprendendo muito aqui",
  "Qual o próximo tópico?",
  "Gostei muito da explicação",
  "Vocês vão disponibilizar a gravação?",
  "Já está disponível o certificado?",
  "Quantas pessoas estão online?",
  "O áudio está perfeito aqui",
  "Transmissão muito estável!",
  "Quando será o próximo evento?",
  "Posso fazer uma pergunta?",
  "Muito obrigado pela resposta!",
  "Estou com uma dúvida sobre o tema",
  "Alguém tem o link dos slides?",
  "Essa plataforma está ótima!",
];

let stats = {
  usuariosAtivos: 0,
  mensagensEnviadas: 0,
  mensagensSucesso: 0,
  mensagensFalha: 0,
  erros: [],
  iniciado: null,
  conversas: []
};

/**
 * Busca usuários reais do banco
 */
async function buscarUsuarios() {
  console.log('🔍 Buscando usuários do banco...\n');
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT id, nome, email, cpf, categoria, status
      FROM usuarios
      WHERE status = true
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`✅ Encontrados ${result.rowCount} usuários ativos\n`);
    
    return result.rows;
  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error.message);
    return [];
  } finally {
    await client.end();
  }
}

/**
 * Faz login de um usuário
 */
async function login(email, cpf) {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, cpf }),
    });

    if (!response.ok) {
      throw new Error(`Login falhou: ${response.status}`);
    }

    const data = await response.json();
    const setCookieHeader = response.headers.get('set-cookie');
    
    if (!setCookieHeader) {
      throw new Error('Token não encontrado');
    }

    const authTokenMatch = setCookieHeader.match(/authToken=([^;]+)/);
    if (!authTokenMatch) {
      throw new Error('authToken não encontrado');
    }

    return {
      token: authTokenMatch[1],
      usuario: data.user || { nome: 'Usuário' }
    };
  } catch (error) {
    console.error(`❌ Erro no login (${email}):`, error.message);
    return null;
  }
}

/**
 * Envia uma mensagem no chat
 */
async function enviarMensagem(token, mensagem, nomeUsuario) {
  try {
    const response = await fetch(`${BASE_URL}/api/chat/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `authToken=${token}`,
      },
      body: JSON.stringify({ message: mensagem }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`${response.status} - ${errorData.error || 'Erro desconhecido'}`);
    }

    stats.mensagensSucesso++;
    return true;
  } catch (error) {
    stats.mensagensFalha++;
    stats.erros.push({
      usuario: nomeUsuario,
      mensagem: mensagem.substring(0, 30) + '...',
      erro: error.message,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Simula um usuário participando da conversa
 */
async function simularUsuario(usuario, totalMensagens, intervaloBase) {
  const loginData = await login(usuario.email, usuario.cpf);
  
  if (!loginData) {
    console.log(`⚠️  ${usuario.nome}: Falha no login`);
    return;
  }

  stats.usuariosAtivos++;
  console.log(`✅ ${usuario.nome}: Conectado`);
  
  // Cada usuário envia N mensagens com intervalo variável
  for (let i = 0; i < totalMensagens; i++) {
    // Intervalo aleatório entre mensagens (mais realista)
    const intervalo = intervaloBase + Math.random() * (intervaloBase * 2);
    await sleep(intervalo);
    
    // Escolhe mensagem aleatória
    const mensagem = MENSAGENS_TEMPLATE[Math.floor(Math.random() * MENSAGENS_TEMPLATE.length)];
    
    const sucesso = await enviarMensagem(loginData.token, mensagem, usuario.nome);
    stats.mensagensEnviadas++;
    
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const status = sucesso ? '✅' : '❌';
    
    console.log(`${status} [${timestamp}] ${usuario.nome}: ${mensagem.substring(0, 40)}...`);
    
    stats.conversas.push({
      usuario: usuario.nome,
      mensagem: mensagem.substring(0, 50),
      sucesso,
      timestamp
    });
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   SIMULAÇÃO DE CONVERSA REAL NO CHAT          ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  // Busca usuários do banco
  const usuarios = await buscarUsuarios();
  
  if (usuarios.length === 0) {
    console.error('❌ Nenhum usuário encontrado no banco!');
    process.exit(1);
  }
  
  // Configurações da simulação
  const USUARIOS_SIMULTANEOS = Math.min(5, usuarios.length); // Até 5 usuários ao mesmo tempo
  const MENSAGENS_POR_USUARIO = 5; // Cada usuário envia 5 mensagens
  const INTERVALO_BASE = 3000; // 3 segundos base entre mensagens
  
  console.log('⚙️  Configurações da simulação:');
  console.log(`   Usuários simultâneos: ${USUARIOS_SIMULTANEOS}`);
  console.log(`   Mensagens por usuário: ${MENSAGENS_POR_USUARIO}`);
  console.log(`   Total de mensagens: ${USUARIOS_SIMULTANEOS * MENSAGENS_POR_USUARIO}`);
  console.log(`   Intervalo base: ${INTERVALO_BASE / 1000}s (com variação aleatória)`);
  console.log(`   Tempo estimado: ~${Math.ceil(MENSAGENS_POR_USUARIO * INTERVALO_BASE * 2 / 1000)}s\n`);
  
  console.log('👥 Usuários que vão participar:');
  usuarios.slice(0, USUARIOS_SIMULTANEOS).forEach((u, i) => {
    console.log(`   ${i + 1}. ${u.nome} (${u.categoria})`);
  });
  console.log('\n📤 Iniciando conversa...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  stats.iniciado = Date.now();
  
  // Inicia todos os usuários simultaneamente (Promise.all)
  const usuariosSimultaneos = usuarios.slice(0, USUARIOS_SIMULTANEOS);
  
  await Promise.all(
    usuariosSimultaneos.map(usuario => 
      simularUsuario(usuario, MENSAGENS_POR_USUARIO, INTERVALO_BASE)
    )
  );
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║          SIMULAÇÃO CONCLUÍDA                   ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  const tempoTotal = Math.floor((Date.now() - stats.iniciado) / 1000);
  const taxaSucesso = stats.mensagensEnviadas > 0 
    ? ((stats.mensagensSucesso / stats.mensagensEnviadas) * 100).toFixed(1)
    : 0;
  
  console.log('📊 Estatísticas da Conversa:');
  console.log(`   Usuários ativos: ${stats.usuariosAtivos}/${USUARIOS_SIMULTANEOS}`);
  console.log(`   Total de mensagens: ${stats.mensagensEnviadas}`);
  console.log(`   Enviadas com sucesso: ${stats.mensagensSucesso}`);
  console.log(`   Falhas: ${stats.mensagensFalha}`);
  console.log(`   Taxa de sucesso: ${taxaSucesso}%`);
  console.log(`   Tempo total: ${tempoTotal}s`);
  
  if (stats.mensagensFalha > 0) {
    console.log(`\n⚠️  Erros encontrados: ${stats.erros.length}`);
    console.log('   Primeiros 5 erros:');
    stats.erros.slice(0, 5).forEach(e => {
      console.log(`   - ${e.usuario}: ${e.erro}`);
    });
  }
  
  console.log('\n💬 Últimas 10 mensagens da conversa:');
  stats.conversas.slice(-10).forEach(c => {
    const status = c.sucesso ? '✅' : '❌';
    console.log(`   ${status} [${c.timestamp}] ${c.usuario}: ${c.mensagem}...`);
  });
  
  if (taxaSucesso >= 95) {
    console.log('\n🎉 Simulação concluída com sucesso!');
    console.log('✅ O chat está funcionando perfeitamente com múltiplos usuários!\n');
  } else if (taxaSucesso >= 80) {
    console.log('\n⚠️  Simulação concluída com avisos');
    console.log('   Algumas mensagens falharam, verifique os erros acima.\n');
  } else {
    console.log('\n❌ Simulação concluída com problemas');
    console.log('   Taxa de sucesso baixa, verifique a configuração do servidor.\n');
  }
  
  console.log('💡 Dicas:');
  console.log('   - Acesse o chat no navegador para ver as mensagens em tempo real');
  console.log('   - As mensagens foram enviadas por usuários reais do banco');
  console.log('   - Execute novamente para simular outra conversa\n');
}

// Tratamento de interrupção
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Simulação interrompida!');
  console.log(`   Mensagens enviadas: ${stats.mensagensEnviadas}`);
  console.log(`   Sucesso: ${stats.mensagensSucesso}`);
  console.log(`   Falhas: ${stats.mensagensFalha}\n`);
  process.exit(0);
});

main().catch(error => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});
