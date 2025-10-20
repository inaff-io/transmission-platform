#!/usr/bin/env node
/**
 * Script para testar criação de novos usuários
 * Execução: node scripts/test-create-user.mjs
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Configurar dotenv
dotenv.config({ path: '.env.local' });

async function testCreateUser() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         TESTE: Criação de Novos Usuários                      ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Credenciais do Supabase não configuradas!');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Dados de teste
  const testUser = {
    nome: 'Maria Santos',
    email: 'maria.santos@example.com',
    cpf: '11122233344',
    categoria: 'user'
  };

  console.log('📋 DADOS DO NOVO USUÁRIO:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`   Nome: ${testUser.nome}`);
  console.log(`   Email: ${testUser.email}`);
  console.log(`   CPF: ${testUser.cpf}`);
  console.log(`   Categoria: ${testUser.categoria}\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Teste 1: Verificar se já existe
  console.log('🔍 TESTE 1: Verificar se usuário já existe\n');

  const { data: existing } = await supabase
    .from('usuarios')
    .select('id, email, cpf')
    .or(`email.eq.${testUser.email},cpf.eq.${testUser.cpf}`)
    .single();

  if (existing) {
    console.log('   ⚠️  Usuário já existe no banco:');
    console.log(`      ID: ${existing.id}`);
    console.log(`      Email: ${existing.email}\n`);
    console.log('   🗑️  Removendo para poder testar criação...\n');

    const { error: deleteError } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', existing.id);

    if (deleteError) {
      console.error('   ❌ Erro ao remover:', deleteError.message);
      process.exit(1);
    }

    console.log('   ✅ Usuário removido com sucesso!\n');
  } else {
    console.log('   ✅ Usuário não existe (pronto para criar)\n');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Teste 2: Criar usuário
  console.log('➕ TESTE 2: Criar novo usuário\n');

  const cpfLimpo = testUser.cpf.replaceAll(/\D/g, '');
  const userId = testUser.email.split('@')[0].toLowerCase().replaceAll(/[^a-z0-9]/g, '_');

  console.log(`   Gerando ID: ${userId}\n`);

  const { data: newUser, error: createError } = await supabase
    .from('usuarios')
    .insert([{
      id: userId,
      nome: testUser.nome,
      email: testUser.email.toLowerCase(),
      cpf: cpfLimpo,
      categoria: testUser.categoria,
      status: true,
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (createError) {
    console.log('   ❌ Erro ao criar:', createError.message);
    console.error('      Detalhes:', createError);
    process.exit(1);
  }

  console.log('   ✅ Usuário criado com sucesso!');
  console.log(`      ID: ${newUser.id}`);
  console.log(`      Nome: ${newUser.nome}`);
  console.log(`      Email: ${newUser.email}`);
  console.log(`      CPF: ${newUser.cpf}`);
  console.log(`      Categoria: ${newUser.categoria}`);
  console.log(`      Status: ${newUser.status}`);
  console.log(`      Ativo: ${newUser.ativo}\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Teste 3: Verificar se foi realmente criado
  console.log('🔍 TESTE 3: Verificar usuário no banco\n');

  const { data: verifyUser, error: verifyError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', testUser.email)
    .single();

  if (verifyError || !verifyUser) {
    console.log('   ❌ Usuário não encontrado no banco!');
    console.error('      Erro:', verifyError?.message || 'Não existe');
  } else {
    console.log('   ✅ Usuário verificado no banco:');
    console.log(`      ID: ${verifyUser.id}`);
    console.log(`      Nome: ${verifyUser.nome}`);
    console.log(`      Email: ${verifyUser.email}`);
    console.log(`      Categoria: ${verifyUser.categoria}\n`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Teste 4: Tentar criar duplicado (deve falhar)
  console.log('⚠️  TESTE 4: Tentar criar usuário duplicado (deve falhar)\n');

  const { data: duplicateUser, error: duplicateError } = await supabase
    .from('usuarios')
    .insert([{
      id: userId + '_2',
      nome: testUser.nome,
      email: testUser.email.toLowerCase(),
      cpf: cpfLimpo,
      categoria: testUser.categoria,
      status: true,
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (duplicateError) {
    console.log('   ✅ Erro esperado (duplicação bloqueada):');
    console.log(`      ${duplicateError.message}\n`);
  } else {
    console.log('   ❌ PROBLEMA: Usuário duplicado foi criado!');
    console.log('      Isso não deveria acontecer.\n');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Teste 5: Listar todos os usuários
  console.log('📋 TESTE 5: Listar todos os usuários\n');

  const { data: allUsers, error: listError } = await supabase
    .from('usuarios')
    .select('id, nome, email, categoria')
    .order('created_at', { ascending: false });

  if (listError) {
    console.error('   ❌ Erro ao listar:', listError.message);
  } else {
    console.log(`   ✅ ${allUsers.length} usuário(s) no banco:\n`);
    for (const u of allUsers) {
      const badge = u.categoria === 'admin' ? '👑' : '👤';
      console.log(`   ${badge} ${u.nome}`);
      console.log(`      Email: ${u.email}`);
      console.log(`      ID: ${u.id}\n`);
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\n📊 RESUMO DOS TESTES:\n');
  console.log(`   ${existing ? '✅' : '✅'} Verificação de duplicados`);
  console.log(`   ${createError ? '❌' : '✅'} Criar novo usuário`);
  console.log(`   ${verifyError ? '❌' : '✅'} Verificar no banco`);
  console.log(`   ${!duplicateError ? '❌' : '✅'} Bloqueio de duplicados`);
  console.log(`   ${listError ? '❌' : '✅'} Listar usuários`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\n💡 INSTRUÇÕES PARA TESTAR NA INTERFACE:\n');
  console.log('   1. Faça login como admin (pecosta26@gmail.com)');
  console.log('   2. Acesse: http://localhost:3000/admin/usuarios');
  console.log('   3. Clique em "Novo Usuário"');
  console.log('   4. Preencha os dados:');
  console.log('      - Nome: Teste Silva');
  console.log('      - Email: teste@example.com');
  console.log('      - CPF: 99988877766');
  console.log('      - Categoria: user');
  console.log('   5. Clique em "Salvar"');
  console.log('   6. Verifique se aparece na lista');

  console.log('\n✅ Teste concluído!\n');
}

// Executar
testCreateUser().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
