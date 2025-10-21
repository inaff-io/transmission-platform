#!/usr/bin/env node

/**
 * 🧪 TESTAR LOGIN POR EMAIL/CPF (SEM SENHA)
 */

import pg from 'pg';
import { config } from 'dotenv';

config({ path: '.env.local' });

const DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!DIRECT_URL) {
  console.log('❌ ERRO: DIRECT_URL não configurado\n');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: DIRECT_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

async function testLogin(emailOrCpf) {
  try {
    await client.connect();
    
    console.log(`\n🔍 Testando login com: "${emailOrCpf}"\n`);
    console.log('═══════════════════════════════════════════════════\n');
    
    // Buscar por email
    const byEmail = await client.query(
      'SELECT * FROM usuarios WHERE LOWER(email) = LOWER($1) AND ativo = true',
      [emailOrCpf]
    );
    
    // Buscar por CPF (remove pontuação)
    const cpfLimpo = emailOrCpf.replace(/[.-]/g, '');
    const byCpf = await client.query(
      'SELECT * FROM usuarios WHERE cpf = $1 AND ativo = true',
      [cpfLimpo]
    );
    
    if (byEmail.rows.length > 0) {
      const user = byEmail.rows[0];
      console.log('✅ ENCONTRADO POR EMAIL!\n');
      console.log(`   Nome: ${user.nome}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   CPF: ${user.cpf}`);
      console.log(`   Categoria: ${user.categoria}`);
      console.log(`   Ativo: ${user.ativo ? 'Sim' : 'Não'}`);
      console.log(`   ID: ${user.id}`);
      
      if (user.categoria === 'admin') {
        console.log('\n💡 Use a rota: /admin');
      } else {
        console.log('\n💡 Use a rota: /login');
      }
      
      return true;
      
    } else if (byCpf.rows.length > 0) {
      const user = byCpf.rows[0];
      console.log('✅ ENCONTRADO POR CPF!\n');
      console.log(`   Nome: ${user.nome}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   CPF: ${user.cpf}`);
      console.log(`   Categoria: ${user.categoria}`);
      console.log(`   Ativo: ${user.ativo ? 'Sim' : 'Não'}`);
      console.log(`   ID: ${user.id}`);
      
      if (user.categoria === 'admin') {
        console.log('\n💡 Use a rota: /admin');
      } else {
        console.log('\n💡 Use a rota: /login');
      }
      
      return true;
      
    } else {
      console.log('❌ USUÁRIO NÃO ENCONTRADO!\n');
      console.log('Possíveis causas:\n');
      console.log('1. Email/CPF não cadastrado no banco');
      console.log('2. Usuário está INATIVO (ativo = false)');
      console.log('3. Erro de digitação (conferir maiúsculas/minúsculas)');
      console.log('4. CPF com pontuação diferente do cadastrado\n');
      
      console.log('🔍 Buscando usuários similares...\n');
      
      // Buscar similar
      const similar = await client.query(`
        SELECT nome, email, cpf, categoria, ativo
        FROM usuarios
        WHERE 
          LOWER(email) LIKE LOWER($1) OR
          cpf LIKE $2
        LIMIT 5
      `, [`%${emailOrCpf}%`, `%${cpfLimpo}%`]);
      
      if (similar.rows.length > 0) {
        console.log('Usuários com email/CPF similar:\n');
        for (const user of similar.rows) {
          const ativoIcon = user.ativo ? '✅' : '❌';
          console.log(`${ativoIcon} ${user.nome}`);
          console.log(`   Email: ${user.email}`);
          console.log(`   CPF: ${user.cpf}`);
          console.log(`   Categoria: ${user.categoria}`);
          console.log('');
        }
      }
      
      return false;
    }
    
  } catch (error) {
    console.log('❌ ERRO:', error.message);
    return false;
  } finally {
    await client.end();
  }
}

// Pegar argumento da linha de comando ou usar email de teste
const emailOrCpf = process.argv[2] || 'pecosta26@gmail.com';

testLogin(emailOrCpf).then(success => {
  console.log('\n═══════════════════════════════════════════════════\n');
  if (success) {
    console.log('✅ LOGIN SERIA PERMITIDO');
  } else {
    console.log('❌ LOGIN SERIA NEGADO');
  }
  console.log('');
});
