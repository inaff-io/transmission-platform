#!/usr/bin/env node
/**
 * Script para testar a importação de Excel
 * Execução: node scripts/test-import-excel.mjs
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import pg from 'pg';

const { Pool } = pg;

// Configurar dotenv
dotenv.config({ path: '.env.local' });

async function testImportExcel() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         TESTE: Importação de Excel - Usuários                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

  // Dados de teste (simulando planilha Excel)
  const testData = [
    {
      nome: 'João da Silva Teste',
      email: 'joao.teste@example.com',
      cpf: '12345678901',
      categoria: 'user'
    },
    {
      nome: 'Maria Santos Teste',
      email: 'maria.teste@example.com',
      cpf: '98765432100',
      categoria: 'admin'
    },
    {
      nome: 'Pedro Costa Teste',
      email: 'pedro.teste@example.com',
      cpf: '11122233344'
      // categoria omitida (deve usar padrão 'user')
    }
  ];

  console.log('📋 DADOS DE TESTE:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  testData.forEach((user, index) => {
    console.log(`   ${index + 1}. ${user.nome}`);
    console.log(`      Email: ${user.email}`);
    console.log(`      CPF: ${user.cpf}`);
    console.log(`      Categoria: ${user.categoria || 'user (padrão)'}\n`);
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🔄 Processando usuários...\n');

  const results = {
    success: 0,
    errors: []
  };

  for (const userData of testData) {
    try {
      const cpf = userData.cpf.replace(/\D/g, '');
      const email = userData.email.toLowerCase();
      const categoria = userData.categoria?.toLowerCase() === 'admin' ? 'admin' : 'user';

      // Verifica se já existe
      const { data: existing } = await supabase
        .from('usuarios')
        .select('id, email, cpf')
        .or(`email.eq.${email},cpf.eq.${cpf}`)
        .single();

      if (existing) {
        console.log(`   ⚠️  Atualizando: ${userData.nome} (já existe)`);
        
        const { error } = await supabase
          .from('usuarios')
          .update({
            nome: userData.nome,
            email: email,
            cpf: cpf,
            categoria: categoria,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) {
          console.log(`   ❌ Erro ao atualizar: ${error.message}`);
          results.errors.push(`Erro ao atualizar ${userData.nome}: ${error.message}`);
        } else {
          console.log(`   ✅ Atualizado com sucesso!`);
          results.success++;
        }
      } else {
        console.log(`   ➕ Criando novo: ${userData.nome}`);
        
        const userId = email.split('@')[0].toLowerCase().replaceAll(/[^a-z0-9]/g, '_');
        
        const { error } = await supabase
          .from('usuarios')
          .insert({
            id: userId,
            nome: userData.nome,
            email: email,
            cpf: cpf,
            categoria: categoria,
            status: true,
            ativo: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.log(`   ❌ Erro ao criar: ${error.message}`);
          results.errors.push(`Erro ao criar ${userData.nome}: ${error.message}`);
        } else {
          console.log(`   ✅ Criado com sucesso!`);
          results.success++;
        }
      }

      console.log('');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ Erro: ${errorMsg}\n`);
      results.errors.push(`Erro ao processar ${userData.nome}: ${errorMsg}`);
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📊 RESULTADO:\n');
  console.log(`   ✅ Sucesso: ${results.success} usuário(s)`);
  console.log(`   ❌ Erros: ${results.errors.length} erro(s)`);

  if (results.errors.length > 0) {
    console.log('\n⚠️  ERROS ENCONTRADOS:\n');
    results.errors.forEach((err, index) => {
      console.log(`   ${index + 1}. ${err}`);
    });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Verifica usuários criados
  console.log('\n🔍 Verificando usuários no banco...\n');

  const { data: allUsers, error: fetchError } = await supabase
    .from('usuarios')
    .select('id, nome, email, cpf, categoria')
    .in('email', testData.map(u => u.email.toLowerCase()));

  if (fetchError) {
    console.error('❌ Erro ao buscar usuários:', fetchError.message);
  } else {
    console.log(`📋 ${allUsers?.length || 0} usuário(s) encontrado(s):\n`);
    allUsers?.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.nome}`);
      console.log(`      ID: ${user.id}`);
      console.log(`      Email: ${user.email}`);
      console.log(`      CPF: ${user.cpf}`);
      console.log(`      Categoria: ${user.categoria}\n`);
    });
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n✅ Teste concluído!\n');
}

// Executar
testImportExcel().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
