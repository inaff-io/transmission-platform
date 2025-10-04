import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

async function checkLastLogins() {
  console.log('Conectando ao Supabase...');
  
  const client = new pg.Client({
    connectionString: process.env.POSTGRES_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Conectado com sucesso!\n');

    const result = await client.query(`
      SELECT 
        l.id as login_id,
        l.login_em,
        l.logout_em,
        l.tempo_logado,
        l.ip,
        l.navegador,
        u.nome as usuario_nome,
        u.email as usuario_email,
        u.categoria as usuario_categoria
      FROM logins l
      JOIN usuarios u ON u.id = l.usuario_id
      ORDER BY l.login_em DESC
      LIMIT 10;
    `);

    if (result.rows.length === 0) {
      console.log('Nenhum login encontrado.');
      return;
    }

    console.log('Últimos 10 logins:');
    console.log('-------------------\n');

    result.rows.forEach((login, index) => {
      console.log(`Login ${index + 1}:`);
      console.log(`ID: ${login.login_id}`);
      console.log(`Login em: ${new Date(login.login_em).toLocaleString('pt-BR')}`);
      if (login.logout_em) {
        console.log(`Logout em: ${new Date(login.logout_em).toLocaleString('pt-BR')}`);
      }
      if (login.tempo_logado) {
        console.log(`Tempo logado: ${login.tempo_logado} segundos`);
      }
      console.log(`IP: ${login.ip || 'Não registrado'}`);
      console.log(`Navegador: ${login.navegador || 'Não registrado'}`);
      console.log(`Usuário: ${login.usuario_nome}`);
      console.log(`Email: ${login.usuario_email}`);
      console.log(`Categoria: ${login.usuario_categoria}`);
      console.log('-------------------\n');
    });

  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

console.log('Verificando últimos logins...');
await checkLastLogins();