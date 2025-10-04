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

async function checkLoginsStructure() {
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
        column_name,
        data_type,
        character_maximum_length,
        column_default,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'logins'
      ORDER BY ordinal_position;
    `);

    if (result.rows.length === 0) {
      console.log('Tabela logins não encontrada.');
      return;
    }

    console.log('Estrutura da tabela logins:');
    console.log('-------------------\n');

    result.rows.forEach((column) => {
      console.log(`Coluna: ${column.column_name}`);
      console.log(`Tipo: ${column.data_type}`);
      if (column.character_maximum_length) {
        console.log(`Tamanho máximo: ${column.character_maximum_length}`);
      }
      console.log(`Valor padrão: ${column.column_default || 'Nenhum'}`);
      console.log(`Permite nulo: ${column.is_nullable}`);
      console.log('-------------------\n');
    });

  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

console.log('Verificando estrutura da tabela logins...');
await checkLoginsStructure();