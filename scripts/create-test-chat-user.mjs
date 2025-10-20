#!/usr/bin/env node

/**
 * Script: Criar Usuário de Teste para Chat
 * 
 * Cria um usuário normal (não admin) para usar nos testes de chat
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ywcmqgfbxrejuwcbeolu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Y21xZ2ZieHJlanV3Y2Jlb2x1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzUwOTQ4NiwiZXhwIjoyMDczMDg1NDg2fQ.lzbZSx1Qk2oYiXIkF2OGA6qicTXRbF1IQ7UCB3tbNeU';

async function main() {
  console.log('🔧 Criando usuário de teste para chat...\n');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const usuario = {
    id: 'usuario_teste_chat',
    nome: 'Usuário Teste Chat',
    email: 'usuario.teste@example.com',
    cpf: '12345678901',
    categoria: 'user',
    status: true,
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  try {
    // Verifica se já existe
    const { data: existing } = await supabase
      .from('usuarios')
      .select('id, nome, email')
      .eq('email', usuario.email)
      .single();
    
    if (existing) {
      console.log('ℹ️  Usuário já existe:');
      console.log(`   ID: ${existing.id}`);
      console.log(`   Nome: ${existing.nome}`);
      console.log(`   Email: ${existing.email}`);
      console.log('\n✅ Você pode usar este usuário para os testes!\n');
      return;
    }
    
    // Cria o usuário
    const { data, error } = await supabase
      .from('usuarios')
      .insert(usuario)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Erro ao criar usuário: ${error.message}`);
    }
    
    console.log('✅ Usuário criado com sucesso!\n');
    console.log('📋 Dados do usuário:');
    console.log(`   ID: ${data.id}`);
    console.log(`   Nome: ${data.nome}`);
    console.log(`   Email: ${data.email}`);
    console.log(`   CPF: ${data.cpf}`);
    console.log(`   Categoria: ${data.categoria}`);
    console.log(`   Status: ${data.status}`);
    console.log(`   Ativo: ${data.ativo}`);
    
    console.log('\n✨ Pronto para usar nos testes de chat!\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

main();
