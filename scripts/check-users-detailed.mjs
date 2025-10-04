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

async function checkUsers() {
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

    // Verifica estrutura da tabela
    console.log('Estrutura da tabela usuarios:');
    const structureResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'usuarios'
      ORDER BY ordinal_position;
    `);
    
    structureResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    console.log('\n-------------------\n');

    // Lista todos os usuários com todos os campos
    console.log('Usuários cadastrados:');
    const usersResult = await client.query(`
      SELECT *
      FROM usuarios
      ORDER BY created_at DESC;
    `);

    if (usersResult.rows.length === 0) {
      console.log('Nenhum usuário encontrado.');
      return;
    }

    usersResult.rows.forEach((user, index) => {
      console.log(`Usuário ${index + 1}:`);
      for (const [key, value] of Object.entries(user)) {
        if (value !== null) {
          console.log(`${key}: ${value}`);
        }
      }
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