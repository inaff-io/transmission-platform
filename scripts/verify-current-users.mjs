import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

async function checkUsers() {
  console.log('Conectando ao Supabase...');
  console.log('URL:', process.env.DATABASE_URL);
  
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Conectado com sucesso!\n');

    const result = await client.query(`
      SELECT id, nome, email, cpf, categoria, status, created_at
      FROM usuarios
      ORDER BY created_at DESC;
    `);

    if (result.rows.length === 0) {
      console.log('Nenhum usuário encontrado.');
      return;
    }

    console.log('Usuários cadastrados:');
    console.log('-------------------\n');

    result.rows.forEach((user, index) => {
      console.log(`Usuário ${index + 1}:`);
      console.log(`ID: ${user.id}`);
      console.log(`Nome: ${user.nome}`);
      console.log(`Email: ${user.email}`);
      console.log(`CPF: ${user.cpf}`);
      console.log(`Categoria: ${user.categoria}`);
      console.log(`Status: ${user.status ? 'Ativo' : 'Inativo'}`);
      console.log(`Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
      console.log('-------------------\n');
    });

  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

console.log('Verificando usuários cadastrados...');
await checkUsers();