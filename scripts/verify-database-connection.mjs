#!/usr/bin/env node
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Client } = pg;

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║         VERIFICAÇÃO DE CONEXÃO COM BANCO DE DADOS             ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// ============================================
// TESTE 1: Conexão via DATABASE_URL (.env.local)
// ============================================
async function testDatabaseUrlConnection() {
  console.log('📡 TESTE 1: Conexão via DATABASE_URL (.env.local)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('❌ DATABASE_URL não encontrado no .env.local\n');
    return false;
  }
  
  // Extrai host da URL para exibir
  const urlMatch = databaseUrl.match(/@([^:]+):(\d+)\//);
  const host = urlMatch ? `${urlMatch[1]}:${urlMatch[2]}` : 'desconhecido';
  console.log(`   Host: ${host}`);
  console.log(`   Database: postgres`);
  
  try {
    const client = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    console.log('   ✅ CONEXÃO ESTABELECIDA!\n');
    
    // Verifica usuários
    console.log('   📊 Usuários na tabela "usuarios":');
    const result = await client.query('SELECT id, email, categoria FROM usuarios ORDER BY categoria, email');
    
    if (result.rows.length === 0) {
      console.log('      ⚠️  Nenhum usuário encontrado!\n');
    } else {
      result.rows.forEach(row => {
        const badge = row.categoria === 'admin' ? '👑' : '👤';
        console.log(`      ${badge} ${row.email.padEnd(30)} (${row.categoria})`);
        console.log(`         ID: ${row.id}`);
      });
    }
    
    await client.end();
    console.log('\n   ✅ Teste 1 concluído com sucesso!\n');
    return true;
    
  } catch (error) {
    console.log(`   ❌ ERRO: ${error.message}`);
    console.log(`   Código: ${error.code || 'N/A'}`);
    console.log(`   Detalhes: ${error.detail || 'N/A'}\n`);
    return false;
  }
}

// ============================================
// TESTE 2: Verificar usuário admin específico
// ============================================
async function testAdminAccess() {
  console.log('👑 TESTE 2: Verificação de acesso ADMIN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    
    // Busca usuários admin
    const result = await client.query(
      "SELECT id, email, nome FROM usuarios WHERE categoria = 'admin' ORDER BY email"
    );
    
    if (result.rows.length === 0) {
      console.log('   ⚠️  ATENÇÃO: Nenhum usuário ADMIN encontrado!\n');
      await client.end();
      return false;
    }
    
    console.log(`   ✅ ${result.rows.length} usuário(s) admin encontrado(s):\n`);
    result.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.email}`);
      console.log(`      Nome: ${row.nome || 'Não definido'}`);
      console.log(`      ID: ${row.id}\n`);
    });
    
    await client.end();
    return true;
    
  } catch (error) {
    console.log(`   ❌ ERRO: ${error.message}\n`);
    return false;
  }
}

// ============================================
// TESTE 3: Verificar tabelas essenciais
// ============================================
async function testEssentialTables() {
  console.log('📋 TESTE 3: Verificação de tabelas essenciais');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const essentialTables = ['usuarios', 'logins', 'links', 'abas', 'chat'];
  
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    
    for (const table of essentialTables) {
      try {
        const result = await client.query(
          `SELECT COUNT(*) as count FROM ${table}`
        );
        const count = result.rows[0].count;
        console.log(`   ✅ ${table.padEnd(15)} → ${count} registro(s)`);
      } catch (error) {
        console.log(`   ❌ ${table.padEnd(15)} → ERRO: ${error.message}`);
      }
    }
    
    await client.end();
    console.log('');
    return true;
    
  } catch (error) {
    console.log(`   ❌ ERRO: ${error.message}\n`);
    return false;
  }
}

// ============================================
// TESTE 4: Verificar usuário específico (ensino@inaff.org.br)
// ============================================
async function testSpecificUser() {
  console.log('🔍 TESTE 4: Verificação do usuário ensino@inaff.org.br');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const targetEmail = 'ensino@inaff.org.br';
  const expectedId = '00127e3c-51e0-49df-9a7e-180fc921f08c';
  
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    
    const result = await client.query(
      'SELECT id, email, nome, categoria FROM usuarios WHERE email = $1',
      [targetEmail]
    );
    
    if (result.rows.length === 0) {
      console.log(`   ❌ PROBLEMA ENCONTRADO!`);
      console.log(`   O usuário ${targetEmail} NÃO EXISTE no banco!`);
      console.log(`   \n   ⚠️  AÇÃO NECESSÁRIA:`);
      console.log(`   Execute o arquivo: scripts/ADD-ENSINO-USER.sql`);
      console.log(`   URL: https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/sql/new\n`);
      await client.end();
      return false;
    }
    
    const user = result.rows[0];
    console.log(`   ✅ Usuário encontrado!`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Nome: ${user.nome || 'Não definido'}`);
    console.log(`   Categoria: ${user.categoria}`);
    console.log(`   ID atual: ${user.id}`);
    
    if (user.id !== expectedId) {
      console.log(`   ⚠️  ID esperado: ${expectedId}`);
      console.log(`   O ID está diferente! Isso pode causar problemas de FK.\n`);
      await client.end();
      return false;
    }
    
    console.log(`   ✅ ID correto!\n`);
    await client.end();
    return true;
    
  } catch (error) {
    console.log(`   ❌ ERRO: ${error.message}\n`);
    return false;
  }
}

// ============================================
// TESTE 5: Verificar Foreign Keys
// ============================================
async function testForeignKeys() {
  console.log('🔗 TESTE 5: Verificação de Foreign Keys');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    
    // Verifica logins órfãos
    const loginsOrfaos = await client.query(`
      SELECT l.id, l.usuario_id, l.ip, l.navegador, l.data_hora
      FROM logins l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      WHERE u.id IS NULL
      LIMIT 5
    `);
    
    if (loginsOrfaos.rows.length > 0) {
      console.log(`   ⚠️  Encontrados ${loginsOrfaos.rows.length} registro(s) órfão(s) em "logins":`);
      loginsOrfaos.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. Usuario ID: ${row.usuario_id}`);
        console.log(`      Login ID: ${row.id}`);
        console.log(`      Data/Hora: ${row.data_hora}`);
      });
      console.log(`   \n   💡 Esses registros podem causar erros de FK.\n`);
    } else {
      console.log(`   ✅ Nenhum registro órfão encontrado em "logins"\n`);
    }
    
    // Verifica chat órfãos
    const chatOrfaos = await client.query(`
      SELECT c.id, c.usuario_id, c.mensagem
      FROM chat c
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      WHERE u.id IS NULL
      LIMIT 5
    `);
    
    if (chatOrfaos.rows.length > 0) {
      console.log(`   ⚠️  Encontrados ${chatOrfaos.rows.length} registro(s) órfão(s) em "chat":`);
      chatOrfaos.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. Usuario ID: ${row.usuario_id}`);
        console.log(`      Chat ID: ${row.id}`);
        console.log(`      Mensagem: ${row.mensagem.substring(0, 50)}...`);
      });
      console.log(`   \n   💡 Esses registros podem causar erros de FK.\n`);
    } else {
      console.log(`   ✅ Nenhum registro órfão encontrado em "chat"\n`);
    }
    
    await client.end();
    return true;
    
  } catch (error) {
    console.log(`   ❌ ERRO: ${error.message}\n`);
    return false;
  }
}

// ============================================
// EXECUTAR TODOS OS TESTES
// ============================================
async function runAllTests() {
  const results = {
    connection: await testDatabaseUrlConnection(),
    admin: await testAdminAccess(),
    tables: await testEssentialTables(),
    specificUser: await testSpecificUser(),
    foreignKeys: await testForeignKeys()
  };
  
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                      RESUMO DOS TESTES                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  console.log(`   1. Conexão com banco:        ${results.connection ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`   2. Acesso admin:             ${results.admin ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`   3. Tabelas essenciais:       ${results.tables ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`   4. Usuário ensino@inaff:     ${results.specificUser ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`   5. Foreign Keys:             ${results.foreignKeys ? '✅ OK' : '❌ FALHOU'}`);
  
  const allPassed = Object.values(results).every(r => r === true);
  
  console.log('\n' + '═'.repeat(66) + '\n');
  
  if (allPassed) {
    console.log('🎉 TODOS OS TESTES PASSARAM! Banco de dados configurado corretamente.\n');
  } else {
    console.log('⚠️  ATENÇÃO: Alguns testes falharam. Verifique os detalhes acima.\n');
    
    if (!results.specificUser) {
      console.log('📝 PRÓXIMO PASSO:');
      console.log('   Execute o SQL: scripts/ADD-ENSINO-USER.sql');
      console.log('   URL: https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/sql/new\n');
    }
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Executa
runAllTests().catch(error => {
  console.error('\n❌ ERRO FATAL:', error.message);
  process.exit(1);
});
