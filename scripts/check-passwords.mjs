#!/usr/bin/env node

/**
 * 🔍 VERIFICAR SENHAS DOS USUÁRIOS
 */

import pg from 'pg';
import { config } from 'dotenv';

config({ path: '.env.local' });

const DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;

const client = new pg.Client({
  connectionString: DIRECT_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

try {
  await client.connect();
  
  console.log('\n🔐 VERIFICANDO SENHAS DOS USUÁRIOS\n');
  console.log('═══════════════════════════════════════════════════\n');
  
  // Verificar se existe coluna de senha na tabela usuarios
  const columnsUsuarios = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'usuarios'
    AND column_name LIKE '%senha%' OR column_name LIKE '%password%'
  `);
  
  if (columnsUsuarios.rows.length > 0) {
    console.log('✅ Colunas de senha encontradas na tabela usuarios:\n');
    for (const col of columnsUsuarios.rows) {
      console.log(`   📋 ${col.column_name}`);
    }
    console.log('');
  } else {
    console.log('⚠️  Nenhuma coluna de senha encontrada na tabela usuarios!\n');
  }
  
  // Verificar tabela logins (senhas podem estar lá)
  console.log('🔍 Verificando tabela logins...\n');
  
  const columnsLogins = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'logins'
    ORDER BY ordinal_position
  `);
  
  if (columnsLogins.rows.length > 0) {
    console.log('📋 Estrutura da tabela logins:\n');
    for (const col of columnsLogins.rows) {
      console.log(`   ${col.column_name} (${col.data_type})`);
    }
    console.log('');
    
    // Verificar logins cadastrados
    const logins = await client.query(`
      SELECT 
        l.*,
        u.nome,
        u.email,
        u.cpf,
        u.categoria
      FROM logins l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      ORDER BY l.criado_em DESC
    `);
    
    if (logins.rows.length === 0) {
      console.log('❌ PROBLEMA: Nenhum login cadastrado na tabela logins!\n');
      console.log('Isso significa que os usuários NÃO TÊM SENHA configurada.\n');
      console.log('🔧 SOLUÇÃO: Você precisa criar logins para os usuários.\n');
    } else {
      console.log(`✅ ${logins.rows.length} logins encontrados:\n`);
      
      for (const login of logins.rows) {
        const senhaIcon = login.senha_hash ? '✅' : '❌';
        console.log(`${senhaIcon} Usuário: ${login.nome || 'Desconhecido'}`);
        console.log(`   ID: ${login.usuario_id}`);
        console.log(`   Email: ${login.email || '(não cadastrado)'}`);
        console.log(`   CPF: ${login.cpf || '(não cadastrado)'}`);
        console.log(`   Categoria: ${login.categoria || '?'}`);
        console.log(`   Senha hash: ${login.senha_hash ? login.senha_hash.substring(0, 20) + '...' : 'NÃO CONFIGURADA'}`);
        console.log(`   Criado em: ${login.criado_em}`);
        console.log('');
      }
    }
  } else {
    console.log('❌ Tabela logins não existe!\n');
  }
  
  console.log('═══════════════════════════════════════════════════\n');
  
  // Resumo
  const usuarios = await client.query('SELECT * FROM usuarios');
  const loginsCount = await client.query('SELECT COUNT(*) FROM logins');
  
  console.log('📊 RESUMO:\n');
  console.log(`   👥 Usuários cadastrados: ${usuarios.rows.length}`);
  console.log(`   🔐 Logins configurados: ${loginsCount.rows[0].count}`);
  
  if (parseInt(loginsCount.rows[0].count) < usuarios.rows.length) {
    console.log('\n⚠️  ATENÇÃO: Existem usuários SEM login configurado!\n');
    
    const loginsIds = await client.query('SELECT usuario_id FROM logins');
    const idsComLogin = loginsIds.rows.map(l => l.usuario_id);
    
    const usuariosSemLogin = usuarios.rows.filter(u => !idsComLogin.includes(u.id));
    
    if (usuariosSemLogin.length > 0) {
      console.log('Usuários SEM senha:\n');
      for (const user of usuariosSemLogin) {
        console.log(`   ❌ ${user.nome} (${user.email || user.cpf})`);
      }
      console.log('');
    }
  }
  
  console.log('\n💡 PARA CRIAR SENHA PARA UM USUÁRIO:\n');
  console.log('1. Use o script: node scripts/create-user-login.mjs');
  console.log('2. Ou faça INSERT na tabela logins com senha hash bcrypt\n');
  
} catch (error) {
  console.log('❌ ERRO:', error.message);
} finally {
  await client.end();
}
