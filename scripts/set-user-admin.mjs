#!/usr/bin/env node
/**
 * Script para promover usuário a admin
 * Execução: node scripts/set-user-admin.mjs <email>
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Configurar dotenv
dotenv.config({ path: '.env.local' });

const emailToPromote = process.argv[2] || 'pecosta26@gmail.com';

async function setUserAdmin() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         PROMOVER USUÁRIO A ADMINISTRADOR                       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Credenciais do Supabase não configuradas!');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`🔍 Buscando usuário: ${emailToPromote}\n`);

  // Busca o usuário
  const { data: user, error: fetchError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', emailToPromote)
    .single();

  if (fetchError || !user) {
    console.error('❌ Usuário não encontrado:', emailToPromote);
    console.error('   Erro:', fetchError?.message || 'Não existe no banco');
    process.exit(1);
  }

  console.log('📋 USUÁRIO ENCONTRADO:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`   Nome: ${user.nome}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   CPF: ${user.cpf}`);
  console.log(`   Categoria atual: ${user.categoria || 'user'}`);
  console.log(`   ID: ${user.id}\n`);

  if (user.categoria === 'admin') {
    console.log('✅ Usuário JÁ É ADMINISTRADOR!\n');
    return;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('⬆️  Promovendo para ADMIN...\n');

  // Atualiza para admin
  const { data: updatedUser, error: updateError } = await supabase
    .from('usuarios')
    .update({
      categoria: 'admin',
      updated_at: new Date().toISOString()
    })
    .eq('email', emailToPromote)
    .select()
    .single();

  if (updateError) {
    console.error('❌ Erro ao atualizar:', updateError.message);
    process.exit(1);
  }

  console.log('✅ USUÁRIO PROMOVIDO COM SUCESSO!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`   Nome: ${updatedUser.nome}`);
  console.log(`   Email: ${updatedUser.email}`);
  console.log(`   Categoria: ${updatedUser.categoria} 👑\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('💡 PRÓXIMOS PASSOS:\n');
  console.log('   1. Faça login com este usuário');
  console.log('   2. Acesse: http://localhost:3000/admin');
  console.log('   3. Agora você tem acesso completo ao painel admin!\n');
}

// Executar
setUserAdmin().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
