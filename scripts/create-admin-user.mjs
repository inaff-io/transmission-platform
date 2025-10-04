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

async function createAdminUser() {
  console.log('Conectando ao PostgreSQL...');
  
  const client = new pg.Client({
    user: 'postgres',
    password: 'Sucesso@1234',
    host: 'db.ywcmqgfbxrejuwcbeolu.supabase.co',
    port: 5432,
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Conectado com sucesso!');

    // Verifica se já existe um usuário admin
    const checkResult = await client.query(
      'SELECT id FROM usuarios WHERE categoria = $1 LIMIT 1',
      ['admin']
    );

    if (checkResult.rows.length > 0) {
      console.log('Já existe um usuário admin:', checkResult.rows[0]);
      return;
    }

    // Insere o usuário admin
    const insertResult = await client.query(
      `INSERT INTO usuarios (
        nome,
        email,
        cpf,
        categoria,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        'Admin Teste',
        'admin@teste.com',
        '12345678901',
        'admin',
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );

    console.log('Usuário admin criado com sucesso:', insertResult.rows[0]);
  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

console.log('Iniciando criação do usuário admin...');
await createAdminUser();