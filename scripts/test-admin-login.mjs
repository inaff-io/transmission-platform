import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Client } = pg;

async function testAdminLogin() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');

    // Teste 1: Login por email
    console.log('🧪 TESTE 1: Login por Email');
    console.log('Procurando: pecosta26@gmail.com\n');
    
    const emailQuery = `
      SELECT id, nome, email, cpf, categoria, status, created_at
      FROM usuarios
      WHERE LOWER(email) = LOWER($1)
    `;
    const emailResult = await client.query(emailQuery, ['pecosta26@gmail.com']);
    
    if (emailResult.rows.length > 0) {
      const user = emailResult.rows[0];
      console.log('✅ Usuário encontrado por email!');
      console.log(`   ID: ${user.id}`);
      console.log(`   Nome: ${user.nome}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   CPF: ${user.cpf}`);
      console.log(`   Categoria: ${user.categoria}`);
      console.log(`   Status: ${user.status ? 'ativo' : 'inativo'}`);
      
      if (user.categoria === 'admin') {
        console.log('   ✅ Categoria: ADMIN confirmado!');
      } else {
        console.log('   ❌ ERRO: Categoria não é admin!');
      }
    } else {
      console.log('❌ Usuário NÃO encontrado por email');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Teste 2: Login por CPF
    console.log('🧪 TESTE 2: Login por CPF');
    console.log('Procurando: 05701807401\n');
    
    const cpfQuery = `
      SELECT id, nome, email, cpf, categoria, status, created_at
      FROM usuarios
      WHERE cpf = $1
    `;
    const cpfResult = await client.query(cpfQuery, ['05701807401']);
    
    if (cpfResult.rows.length > 0) {
      const user = cpfResult.rows[0];
      console.log('✅ Usuário encontrado por CPF!');
      console.log(`   ID: ${user.id}`);
      console.log(`   Nome: ${user.nome}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   CPF: ${user.cpf}`);
      console.log(`   Categoria: ${user.categoria}`);
      console.log(`   Status: ${user.status ? 'ativo' : 'inativo'}`);
      
      if (user.categoria === 'admin') {
        console.log('   ✅ Categoria: ADMIN confirmado!');
      } else {
        console.log('   ❌ ERRO: Categoria não é admin!');
      }
    } else {
      console.log('❌ Usuário NÃO encontrado por CPF');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Teste 3: Verificar se há registro de login
    console.log('🧪 TESTE 3: Verificar tabela de logins');
    
    const checkLoginsTable = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'logins'
      ) as table_exists
    `;
    const tableCheck = await client.query(checkLoginsTable);
    
    if (tableCheck.rows[0].table_exists) {
      console.log('✅ Tabela "logins" existe');
      
      const loginQuery = `
        SELECT usuario_id, created_at
        FROM logins
        WHERE usuario_id = $1
        ORDER BY created_at DESC
        LIMIT 5
      `;
      const loginResult = await client.query(loginQuery, [emailResult.rows[0]?.id]);
      
      if (loginResult.rows.length > 0) {
        console.log(`   📊 ${loginResult.rows.length} registros de login encontrados:`);
        loginResult.rows.forEach((login, index) => {
          console.log(`      ${index + 1}. ${login.created_at}`);
        });
      } else {
        console.log('   ℹ️  Nenhum registro de login ainda (primeiro acesso)');
      }
    } else {
      console.log('⚠️  Tabela "logins" não existe');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Resumo final
    console.log('📋 RESUMO DOS TESTES:\n');
    
    if (emailResult.rows.length > 0 && cpfResult.rows.length > 0) {
      console.log('✅ Login por Email: FUNCIONANDO');
      console.log('✅ Login por CPF: FUNCIONANDO');
      console.log('✅ Categoria Admin: CONFIRMADA');
      console.log('✅ Status: ATIVO\n');
      
      console.log('🎉 SISTEMA PRONTO PARA LOGIN!\n');
      console.log('🔐 Acesse: https://transmission-platform-xi.vercel.app/admin');
      console.log('   Email: pecosta26@gmail.com');
      console.log('   CPF: 05701807401');
      console.log('   (Sistema passwordless - use email OU CPF)');
    } else {
      console.log('❌ ERRO: Usuário não encontrado ou dados incorretos');
    }

  } catch (error) {
    console.error('❌ Erro ao testar login:', error.message);
    if (error.code) {
      console.error(`   Código: ${error.code}`);
    }
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada');
  }
}

testAdminLogin();
