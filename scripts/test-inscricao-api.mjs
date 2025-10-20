#!/usr/bin/env node

/**
 * Script de Teste para API de Inscrição Pública
 * 
 * Testa a API /api/inscricao que não requer autenticação
 * 
 * Uso:
 *   node scripts/test-inscricao-api.mjs
 */

// Teste 1: Inscrição válida
async function testValidInscricao() {
  console.log('\n🧪 Teste 1: Inscrição válida');
  console.log('═══════════════════════════════════════\n');

  const testUser = {
    nome: 'Usuário Teste Inscrição',
    email: `teste.inscricao.${Date.now()}@exemplo.com`,
    cpf: '99988877766',
  };

  console.log('📤 Enviando dados:', {
    nome: testUser.nome,
    email: testUser.email,
    cpf: testUser.cpf,
  });

  try {
    const response = await fetch('http://localhost:3000/api/inscricao', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Inscrição criada com sucesso!');
      console.log('📋 Resposta:', data);
      return { success: true, userId: data.userId };
    } else {
      console.log('❌ Erro na inscrição');
      console.log('📋 Resposta:', data);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return { success: false, error: error.message };
  }
}

// Teste 2: Email inválido
async function testInvalidEmail() {
  console.log('\n🧪 Teste 2: Email inválido');
  console.log('═══════════════════════════════════════\n');

  const testUser = {
    nome: 'Teste Email Inválido',
    email: 'emailinvalido',
    cpf: '11122233344',
  };

  console.log('📤 Enviando email inválido:', testUser.email);

  try {
    const response = await fetch('http://localhost:3000/api/inscricao', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const data = await response.json();

    if (!response.ok && data.error === 'Email inválido') {
      console.log('✅ Validação de email funcionando corretamente');
      console.log('📋 Erro esperado:', data.error);
      return { success: true };
    } else {
      console.log('❌ Validação de email falhou');
      console.log('📋 Resposta:', data);
      return { success: false };
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return { success: false, error: error.message };
  }
}

// Teste 3: CPF incompleto
async function testIncompleteCPF() {
  console.log('\n🧪 Teste 3: CPF incompleto');
  console.log('═══════════════════════════════════════\n');

  const testUser = {
    nome: 'Teste CPF Incompleto',
    email: 'teste.cpf@exemplo.com',
    cpf: '12345', // Apenas 5 dígitos
  };

  console.log('📤 Enviando CPF incompleto:', testUser.cpf);

  try {
    const response = await fetch('http://localhost:3000/api/inscricao', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const data = await response.json();

    if (!response.ok && data.error === 'CPF deve conter 11 dígitos') {
      console.log('✅ Validação de CPF funcionando corretamente');
      console.log('📋 Erro esperado:', data.error);
      return { success: true };
    } else {
      console.log('❌ Validação de CPF falhou');
      console.log('📋 Resposta:', data);
      return { success: false };
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return { success: false, error: error.message };
  }
}

// Teste 4: Nome muito curto
async function testShortName() {
  console.log('\n🧪 Teste 4: Nome muito curto');
  console.log('═══════════════════════════════════════\n');

  const testUser = {
    nome: 'Jo', // Apenas 2 caracteres
    email: 'teste.nome@exemplo.com',
    cpf: '11122233344',
  };

  console.log('📤 Enviando nome curto:', testUser.nome);

  try {
    const response = await fetch('http://localhost:3000/api/inscricao', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const data = await response.json();

    if (!response.ok && data.error === 'Nome deve ter pelo menos 3 caracteres') {
      console.log('✅ Validação de nome funcionando corretamente');
      console.log('📋 Erro esperado:', data.error);
      return { success: true };
    } else {
      console.log('❌ Validação de nome falhou');
      console.log('📋 Resposta:', data);
      return { success: false };
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return { success: false, error: error.message };
  }
}

// Teste 5: Campos obrigatórios faltando
async function testMissingFields() {
  console.log('\n🧪 Teste 5: Campos obrigatórios faltando');
  console.log('═══════════════════════════════════════\n');

  const testUser = {
    nome: 'Teste Sem Email',
    // email faltando
    cpf: '11122233344',
  };

  console.log('📤 Enviando dados sem email');

  try {
    const response = await fetch('http://localhost:3000/api/inscricao', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const data = await response.json();

    if (!response.ok && data.error.includes('obrigatórios')) {
      console.log('✅ Validação de campos obrigatórios funcionando');
      console.log('📋 Erro esperado:', data.error);
      return { success: true };
    } else {
      console.log('❌ Validação de campos obrigatórios falhou');
      console.log('📋 Resposta:', data);
      return { success: false };
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return { success: false, error: error.message };
  }
}

// Teste 6: Usuário duplicado
async function testDuplicateUser(email, cpf) {
  console.log('\n🧪 Teste 6: Usuário duplicado');
  console.log('═══════════════════════════════════════\n');

  const testUser = {
    nome: 'Teste Duplicado',
    email: email,
    cpf: cpf,
  };

  console.log('📤 Tentando criar usuário duplicado:', email);

  try {
    const response = await fetch('http://localhost:3000/api/inscricao', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const data = await response.json();

    if (!response.ok && (data.error === 'Email já cadastrado' || data.error === 'CPF já cadastrado')) {
      console.log('✅ Bloqueio de duplicatas funcionando corretamente');
      console.log('📋 Erro esperado:', data.error);
      return { success: true };
    } else {
      console.log('❌ Bloqueio de duplicatas falhou');
      console.log('📋 Resposta:', data);
      return { success: false };
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return { success: false, error: error.message };
  }
}

// Executa todos os testes
async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║  TESTES DA API DE INSCRIÇÃO PÚBLICA                  ║');
  console.log('║  Endpoint: POST /api/inscricao                       ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  const results = [];

  // Verifica se o servidor está rodando
  try {
    await fetch('http://localhost:3000');
  } catch (error) {
    console.log('❌ ERRO: Servidor não está rodando em http://localhost:3000');
    console.log('💡 Execute: npm run dev');
    process.exit(1);
  }

  // Teste 1: Inscrição válida
  const test1 = await testValidInscricao();
  results.push(test1.success);

  // Teste 2: Email inválido
  const test2 = await testInvalidEmail();
  results.push(test2.success);

  // Teste 3: CPF incompleto
  const test3 = await testIncompleteCPF();
  results.push(test3.success);

  // Teste 4: Nome muito curto
  const test4 = await testShortName();
  results.push(test4.success);

  // Teste 5: Campos obrigatórios faltando
  const test5 = await testMissingFields();
  results.push(test5.success);

  // Teste 6: Usuário duplicado (usa dados do Teste 1)
  if (test1.success && test1.userId) {
    const test6 = await testDuplicateUser(
      `teste.inscricao.${Date.now() - 1000}@exemplo.com`, // Aproximadamente o mesmo email
      '99988877766' // Mesmo CPF do teste 1
    );
    results.push(test6.success);
  } else {
    console.log('\n⚠️ Teste 6 pulado (Teste 1 falhou)');
    results.push(false);
  }

  // Resumo
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║  RESUMO DOS TESTES                                    ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log(`📊 Total de testes: ${total}`);
  console.log(`✅ Testes aprovados: ${passed}`);
  console.log(`❌ Testes falhados: ${total - passed}`);
  console.log(`📈 Taxa de sucesso: ${((passed / total) * 100).toFixed(1)}%\n`);

  if (passed === total) {
    console.log('🎉 TODOS OS TESTES PASSARAM! 🎉\n');
    console.log('✅ A API de inscrição pública está funcionando corretamente');
    console.log('✅ Todas as validações estão operacionais');
    console.log('✅ Sistema pronto para uso!\n');
  } else {
    console.log('⚠️ ALGUNS TESTES FALHARAM\n');
    console.log('Verifique os logs acima para detalhes dos erros.\n');
  }
}

// Executa os testes
runAllTests().catch(error => {
  console.error('❌ Erro ao executar testes:', error);
  process.exit(1);
});
