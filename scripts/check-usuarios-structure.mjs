import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Carrega variáveis de ambiente do .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

if (!process.env.POSTGRES_URL) {
  console.error('Erro: Variável de ambiente POSTGRES_URL não encontrada');
  process.exit(1);
}

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkTableStructure() {
  const client = await pool.connect();
  
  try {
    const { rows } = await client.query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        column_default,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'usuarios'
      ORDER BY ordinal_position;
    `);

    console.log('\nEstrutura da tabela usuarios:');
    console.log('-----------------------------');
    rows.forEach(column => {
      console.log(`\nColuna: ${column.column_name}`);
      console.log(`Tipo: ${column.data_type}`);
      if (column.character_maximum_length) {
        console.log(`Tamanho máximo: ${column.character_maximum_length}`);
      }
      console.log(`Valor padrão: ${column.column_default || 'Nenhum'}`);
      console.log(`Permite nulo: ${column.is_nullable}`);
    });

  } catch (error) {
    console.error('Erro ao verificar estrutura da tabela:', error);
    if (error.message) {
      console.error('Detalhes do erro:', error.message);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

// Executa a verificação
checkTableStructure();