#!/usr/bin/env node
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Client } = pg;

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║              USUÁRIOS NO BANCO DE DADOS                        ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

async function listUsers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Conectado ao banco!\n');
    
    // Busca todos os usuários
    const result = await client.query(`
      SELECT 
        id,
        nome,
        email,
        cpf,
        categoria,
        created_at,
        updated_at
      FROM usuarios
      ORDER BY categoria DESC, email ASC
    `);
    
    if (result.rows.length === 0) {
      console.log('⚠️  Nenhum usuário encontrado no banco!\n');
      await client.end();
      return;
    }
    
    console.log(`📊 Total de usuários: ${result.rows.length}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Agrupa por categoria
    const admins = result.rows.filter(u => u.categoria === 'admin');
    const users = result.rows.filter(u => u.categoria === 'user');
    
    // Mostra admins
    if (admins.length > 0) {
      console.log('👑 ADMINISTRADORES:\n');
      for (const user of admins) {
        console.log(`   📧 ${user.email}`);
        console.log(`      Nome: ${user.nome || 'Não definido'}`);
        console.log(`      CPF: ${user.cpf || 'Não definido'}`);
        console.log(`      ID: ${user.id}`);
        console.log(`      Criado em: ${user.created_at ? new Date(user.created_at).toLocaleString('pt-BR') : 'N/A'}`);
        console.log('');
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
    
    // Mostra usuários normais
    if (users.length > 0) {
      console.log('👤 USUÁRIOS NORMAIS:\n');
      for (const user of users) {
        console.log(`   📧 ${user.email}`);
        console.log(`      Nome: ${user.nome || 'Não definido'}`);
        console.log(`      CPF: ${user.cpf || 'Não definido'}`);
        console.log(`      ID: ${user.id}`);
        console.log(`      Criado em: ${user.created_at ? new Date(user.created_at).toLocaleString('pt-BR') : 'N/A'}`);
        console.log('');
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
    
    // Verifica se o usuário ensino@inaff.org.br existe
    console.log('🔍 VERIFICAÇÃO ESPECIAL:\n');
    const ensinoUser = result.rows.find(u => u.email === 'ensino@inaff.org.br');
    
    if (ensinoUser) {
      console.log('   ✅ Usuário ensino@inaff.org.br EXISTE no banco!');
      console.log(`      Categoria: ${ensinoUser.categoria}`);
      console.log(`      ID: ${ensinoUser.id}`);
    } else {
      console.log('   ❌ Usuário ensino@inaff.org.br NÃO EXISTE no banco!');
      console.log('   \n   ⚠️  AÇÃO NECESSÁRIA:');
      console.log('   Execute: scripts/ADD-ENSINO-USER.sql no Supabase SQL Editor');
      console.log('   URL: https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/sql/new');
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Estatísticas
    console.log('📈 ESTATÍSTICAS:\n');
    console.log(`   Total de usuários:     ${result.rows.length}`);
    console.log(`   Administradores:       ${admins.length}`);
    console.log(`   Usuários normais:      ${users.length}`);
    
    // Verifica últimos logins
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔐 ÚLTIMOS LOGINS:\n');
    
    const loginsResult = await client.query(`
      SELECT 
        l.usuario_id,
        u.email,
        u.categoria,
        l.created_at as data_hora,
        l.ip
      FROM logins l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      ORDER BY l.created_at DESC
      LIMIT 5
    `);
    
    if (loginsResult.rows.length > 0) {
      for (const login of loginsResult.rows) {
        const userInfo = login.email || `ID: ${login.usuario_id}`;
        const badge = login.categoria === 'admin' ? '👑' : '👤';
        console.log(`   ${badge} ${userInfo}`);
        console.log(`      Data/Hora: ${new Date(login.data_hora).toLocaleString('pt-BR')}`);
        console.log(`      IP: ${login.ip || 'N/A'}`);
        console.log('');
      }
    } else {
      console.log('   Nenhum login registrado ainda.\n');
    }
    
    await client.end();
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error('   Código:', error.code);
    process.exit(1);
  }
}

listUsers();
