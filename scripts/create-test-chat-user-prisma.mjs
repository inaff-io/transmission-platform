#!/usr/bin/env node

/**
 * Script: Criar Usuário de Teste usando Prisma
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Criando usuário de teste para chat...\n');

  const usuario = {
    id: 'usuario_teste_chat',
    nome: 'Usuário Teste Chat',
    email: 'usuario.teste@example.com',
    cpf: '12345678901',
    categoria: 'user',
    status: true,
  };

  try {
    // Tenta deletar se já existir
    try {
      await prisma.usuario.delete({
        where: { id: usuario.id }
      });
      console.log('ℹ️  Usuário anterior deletado\n');
    } catch (e) {
      // Usuário não existe, tudo bem
    }

    // Cria o usuário
    const created = await prisma.usuario.create({
      data: usuario
    });

    console.log('✅ Usuário criado com sucesso!\n');
    console.log('📋 Dados do usuário:');
    console.log(`   ID: ${created.id}`);
    console.log(`   Nome: ${created.nome}`);
    console.log(`   Email: ${created.email}`);
    console.log(`   CPF: ${created.cpf}`);
    console.log(`   Categoria: ${created.categoria}`);
    console.log(`   Status: ${created.status}`);
    
    console.log('\n✨ Pronto para usar nos testes de chat!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Execute: node scripts/test-chat-quick.mjs');
    console.log('   2. Se passar, execute: node scripts/test-chat-500-messages.mjs\n');
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('ℹ️  Usuário já existe!');
      console.log('   Email ou CPF já cadastrado.');
      console.log('\n✅ Você pode prosseguir com os testes de chat!\n');
    } else {
      console.error('❌ Erro ao criar usuário:', error.message);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
