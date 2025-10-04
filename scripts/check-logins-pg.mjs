import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkLogins() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    await client.connect();
    console.log('Conectado ao banco de dados!\n');

    // Verifica se a tabela existe
    const tableExistsResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'logins'
      ) as table_exists;
    `);
    console.log('Tabela logins existe?', tableExistsResult.rows[0].table_exists);

    if (!tableExistsResult.rows[0].table_exists) {
      console.log('A tabela logins não existe no banco de dados.');
      return;
    }

    // Conta o número total de registros
    const countResult = await client.query('SELECT COUNT(*) as total_records FROM public.logins;');
    console.log('\nTotal de registros:', countResult.rows[0].total_records);

    // Mostra os 5 registros mais recentes
    const recentLogins = await client.query(`
      SELECT 
        l.id,
        l.login_em,
        l.logout_em,
        l.tempo_logado,
        l.ip,
        l.navegador,
        u.nome as usuario_nome,
        u.email as usuario_email,
        u.categoria as usuario_categoria
      FROM public.logins l
      LEFT JOIN public.usuarios u ON l.usuario_id = u.id
      ORDER BY l.login_em DESC
      LIMIT 5;
    `);

    if (recentLogins.rows.length > 0) {
      console.log('\nÚltimos 5 logins:');
      recentLogins.rows.forEach((login, index) => {
        console.log(`\nLogin ${index + 1}:`);
        console.log('ID:', login.id);
        console.log('Login em:', new Date(login.login_em).toLocaleString());
        console.log('Logout em:', login.logout_em ? new Date(login.logout_em).toLocaleString() : 'Não registrado');
        console.log('Tempo logado:', login.tempo_logado ? `${login.tempo_logado} segundos` : 'Não registrado');
        console.log('IP:', login.ip || 'Não registrado');
        console.log('Navegador:', login.navegador || 'Não registrado');
        console.log('Usuário:', login.usuario_nome);
        console.log('Email:', login.usuario_email);
        console.log('Categoria:', login.usuario_categoria);
      });
    } else {
      console.log('\nNenhum registro de login encontrado.');
    }

  } catch (err) {
    console.error('Erro ao verificar a tabela de logins:', err);
  } finally {
    await client.end();
    console.log('\nConexão com o banco de dados fechada.');
  }
}

checkLogins();