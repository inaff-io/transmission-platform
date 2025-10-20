#!/usr/bin/env node

/**
 * Script: Criar Usuário de Teste via API Pública
 * 
 * Cria o usuário através da API de inscrição pública
 */

console.log('🔧 Criando usuário de teste via API de inscrição...\n');

const usuario = {
  nome: 'Usuário Teste Chat',
  email: 'usuario.teste@example.com',
  cpf: '12345678901'
};

async function criarUsuario() {
  try {
    console.log('📤 Enviando dados para /api/inscricao...');
    console.log(`   Nome: ${usuario.nome}`);
    console.log(`   Email: ${usuario.email}`);
    console.log(`   CPF: ${usuario.cpf}\n`);
    
    const response = await fetch('http://localhost:3000/api/inscricao', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(usuario),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 409) {
        console.log('ℹ️  Usuário já existe!');
        console.log('   Isso significa que o usuário já foi criado anteriormente.');
        console.log('   Você pode prosseguir com os testes de chat.\n');
        console.log('✅ Pronto para testar!\n');
        return;
      }
      
      throw new Error(`Erro ${response.status}: ${data.error || 'Erro desconhecido'}`);
    }

    console.log('✅ Usuário criado com sucesso!\n');
    console.log('📋 Dados do usuário:');
    console.log(`   ID: ${data.usuario?.id || 'N/A'}`);
    console.log(`   Nome: ${data.usuario?.nome || usuario.nome}`);
    console.log(`   Email: ${data.usuario?.email || usuario.email}`);
    console.log(`   CPF: ${usuario.cpf}`);
    console.log(`   Categoria: user`);
    
    console.log('\n✨ Pronto para usar nos testes de chat!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Execute: node scripts/test-chat-quick.mjs');
    console.log('   2. Se passar, execute: node scripts/test-chat-500-messages.mjs\n');
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error.message);
    console.error('\n💡 Dicas:');
    console.error('   - Verifique se o servidor está rodando: npm run dev');
    console.error('   - Verifique se o Supabase está acessível');
    console.error('   - Ou crie manualmente pelo SQL Editor do Supabase\n');
    process.exit(1);
  }
}

criarUsuario();
