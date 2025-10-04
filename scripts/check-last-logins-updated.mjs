import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');

console.log('Carregando variáveis de ambiente...');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

async function checkLastLogins() {
  console.log('\n=== Verificando últimos logins com sucesso ===\n');
  
  const client = new pg.Client({
    user: 'postgres.apamlthhsppsjvbxzouv',
    password: 'Sucesso@1234',
    host: 'aws-1-sa-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Conectando ao PostgreSQL...');
    await client.connect();
    console.log('✓ Conectado com sucesso!\n');

    // Verifica se a tabela de logins existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'logins'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('⚠ Tabela "logins" não existe!');
      console.log('\nVerificando apenas usuários e seus últimos acessos...\n');
      
      // Busca usuários com last_active
      const usersResult = await client.query(`
        SELECT id, nome, email, cpf, categoria, last_active, created_at
        FROM usuarios
        WHERE last_active IS NOT NULL
        ORDER BY last_active DESC
        LIMIT 10
      `);

      if (usersResult.rows.length > 0) {
        console.log(`Últimos ${usersResult.rows.length} usuários que acessaram o sistema:\n`);
        
        usersResult.rows.forEach((user, index) => {
          console.log(`${index + 1}. ${user.nome} (${user.categoria})`);
          console.log(`   Email: ${user.email}`);
          console.log(`   CPF: ${user.cpf}`);
          console.log(`   Último acesso: ${user.last_active}`);
          console.log(`   Criado em: ${user.created_at}`);
          console.log('');
        });
      } else {
        console.log('Nenhum usuário com registro de último acesso encontrado.');
      }
      
      return;
    }

    console.log('✓ Tabela "logins" existe\n');

    // Busca os últimos logins
    const loginsResult = await client.query(`
      SELECT 
        l.id,
        l.usuario_id,
        l.login_em,
        l.logout_em,
        u.nome,
        u.email,
        u.categoria
      FROM logins l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      ORDER BY l.login_em DESC
      LIMIT 20
    `);

    console.log(`Total de logins encontrados: ${loginsResult.rows.length}\n`);

    if (loginsResult.rows.length > 0) {
      console.log('Últimos 20 logins:\n');
      console.log('='.repeat(80));
      console.log('');

      loginsResult.rows.forEach((login, index) => {
        const status = login.logout_em ? '🔴 Sessão Encerrada' : '🟢 Sessão Ativa';
        const duracao = login.logout_em 
          ? `${Math.round((new Date(login.logout_em) - new Date(login.login_em)) / 60000)} min`
          : 'Em andamento';

        console.log(`${index + 1}. ${login.nome || 'Usuário Desconhecido'} (${login.categoria || 'N/A'})`);
        console.log(`   ${status}`);
        console.log(`   Email: ${login.email || 'N/A'}`);
        console.log(`   Login em: ${login.login_em}`);
        if (login.logout_em) {
          console.log(`   Logout em: ${login.logout_em}`);
        }
        console.log(`   Duração: ${duracao}`);
        console.log(`   ID da sessão: ${login.id}`);
        console.log('');
      });

      // Estatísticas
      const ativas = loginsResult.rows.filter(l => !l.logout_em).length;
      const encerradas = loginsResult.rows.filter(l => l.logout_em).length;

      console.log('Estatísticas:');
      console.log('=============');
      console.log(`Total de sessões mostradas: ${loginsResult.rows.length}`);
      console.log(`Sessões ativas: ${ativas} 🟢`);
      console.log(`Sessões encerradas: ${encerradas} 🔴`);

      // Último login bem-sucedido
      const ultimoLogin = loginsResult.rows[0];
      console.log('\n📌 Último login registrado:');
      console.log(`   Usuário: ${ultimoLogin.nome}`);
      console.log(`   Email: ${ultimoLogin.email}`);
      console.log(`   Data/Hora: ${ultimoLogin.login_em}`);
      console.log(`   Status: ${ultimoLogin.logout_em ? 'Encerrado' : 'Ativo'}`);

    } else {
      console.log('⚠ Nenhum login registrado na tabela.');
    }

    // Busca também os usuários com last_active atualizado recentemente
    console.log('\n\n=== Usuários com atividade recente (last_active) ===\n');
    
    const recentActivity = await client.query(`
      SELECT nome, email, categoria, last_active
      FROM usuarios
      WHERE last_active IS NOT NULL
      ORDER BY last_active DESC
      LIMIT 10
    `);

    if (recentActivity.rows.length > 0) {
      recentActivity.rows.forEach((user, index) => {
        console.log(`${index + 1}. ${user.nome} (${user.categoria})`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Última atividade: ${user.last_active}`);
        console.log('');
      });
    }

  } catch (err) {
    console.error('❌ Erro:', err.message);
    console.error('\nDetalhes:', err);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✓ Conexão fechada');
  }
}

console.log('Iniciando verificação de logins...');
await checkLastLogins();
console.log('\n✓ Verificação concluída!');
