#!/usr/bin/env node
/**
 * Script para testar a edição de usuários
 * Execução: node scripts/test-edit-user.mjs
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Configurar dotenv
dotenv.config({ path: '.env.local' });

async function testEditUser() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         TESTE: Edição de Usuários                             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Credenciais do Supabase não configuradas!');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Buscando usuários disponíveis...\n');

  // Lista todos os usuários
  const { data: usuarios, error: listError } = await supabase
    .from('usuarios')
    .select('id, nome, email, cpf, categoria')
    .order('created_at', { ascending: false })
    .limit(5);

  if (listError) {
    console.error('❌ Erro ao buscar usuários:', listError.message);
    process.exit(1);
  }

  console.log('📋 USUÁRIOS NO BANCO:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  usuarios?.forEach((user, index) => {
    const badge = user.categoria === 'admin' ? '👑 ADMIN' : '👤 USER';
    console.log(`   ${index + 1}. ${badge} ${user.nome}`);
    console.log(`      ID: ${user.id}`);
    console.log(`      Email: ${user.email}`);
    console.log(`      CPF: ${user.cpf}\n`);
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!usuarios || usuarios.length === 0) {
    console.log('⚠️  Nenhum usuário encontrado para testar edição.\n');
    return;
  }

  // Seleciona o primeiro usuário não-admin para teste
  const testUser = usuarios.find(u => u.categoria !== 'admin') || usuarios[0];
  
  console.log(`🎯 SELECIONADO PARA TESTE: ${testUser.nome}\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Teste 1: Buscar usuário por ID
  console.log('📖 TESTE 1: Buscar usuário por ID\n');
  
  const { data: fetchedUser, error: fetchError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', testUser.id)
    .single();

  if (fetchError) {
    console.log('   ❌ Erro ao buscar:', fetchError.message);
  } else {
    console.log('   ✅ Usuário encontrado:');
    console.log(`      Nome: ${fetchedUser.nome}`);
    console.log(`      Email: ${fetchedUser.email}`);
    console.log(`      CPF: ${fetchedUser.cpf}`);
    console.log(`      Categoria: ${fetchedUser.categoria}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Teste 2: Atualizar usuário
  console.log('✏️  TESTE 2: Atualizar usuário\n');

  const novoNome = `${testUser.nome} (Editado em Teste)`;
  
  const { data: updatedUser, error: updateError } = await supabase
    .from('usuarios')
    .update({
      nome: novoNome,
      updated_at: new Date().toISOString()
    })
    .eq('id', testUser.id)
    .select()
    .single();

  if (updateError) {
    console.log('   ❌ Erro ao atualizar:', updateError.message);
  } else {
    console.log('   ✅ Usuário atualizado com sucesso!');
    console.log(`      Nome anterior: ${testUser.nome}`);
    console.log(`      Nome novo: ${updatedUser.nome}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Teste 3: Reverter alteração
  console.log('↩️  TESTE 3: Reverter alteração\n');

  const { data: revertedUser, error: revertError } = await supabase
    .from('usuarios')
    .update({
      nome: testUser.nome,
      updated_at: new Date().toISOString()
    })
    .eq('id', testUser.id)
    .select()
    .single();

  if (revertError) {
    console.log('   ❌ Erro ao reverter:', revertError.message);
  } else {
    console.log('   ✅ Alteração revertida com sucesso!');
    console.log(`      Nome restaurado: ${revertedUser.nome}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Teste 4: Verificar admin
  console.log('👑 TESTE 4: Verificar usuário admin\n');

  const { data: adminUsers, error: adminError } = await supabase
    .from('usuarios')
    .select('id, nome, email, categoria')
    .eq('categoria', 'admin');

  if (adminError) {
    console.log('   ❌ Erro ao buscar admins:', adminError.message);
  } else if (!adminUsers || adminUsers.length === 0) {
    console.log('   ⚠️  Nenhum usuário admin encontrado!');
    console.log('   ℹ️  A edição de usuários requer um admin logado.');
  } else {
    console.log(`   ✅ ${adminUsers.length} admin(s) encontrado(s):\n`);
    adminUsers.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.nome}`);
      console.log(`      Email: ${admin.email}`);
      console.log(`      ID: ${admin.id}\n`);
    });
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\n📊 RESUMO DOS TESTES:\n');
  console.log(`   ${fetchError ? '❌' : '✅'} Buscar usuário por ID`);
  console.log(`   ${updateError ? '❌' : '✅'} Atualizar usuário`);
  console.log(`   ${revertError ? '❌' : '✅'} Reverter alteração`);
  console.log(`   ${adminError || !adminUsers?.length ? '⚠️' : '✅'} Verificar admin disponível`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\n💡 INSTRUÇÕES PARA TESTAR NA INTERFACE:\n');
  console.log('   1. Faça login como admin (pecosta26@gmail.com)');
  console.log('   2. Acesse: http://localhost:3000/admin/usuarios');
  console.log('   3. Clique no ícone de editar (✏️) de um usuário');
  console.log('   4. Verifique se os dados carregam corretamente');
  console.log('   5. Faça uma alteração e salve');
  console.log('   6. Verifique se aparece "Usuário atualizado com sucesso!"');

  console.log('\n✅ Teste concluído!\n');
}

// Executar
testEditUser().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
