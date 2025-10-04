import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
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

async function insertTestUsers() {
  const client = await pool.connect();
  
  try {
    // Lê o arquivo SQL
    const sqlPath = path.join(__dirname, 'insert-test-users.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Executa o SQL
    await client.query(sql);
    console.log('Usuários de teste inseridos com sucesso!');

    // Verifica os usuários inseridos
    const { rows } = await client.query(`
      SELECT id, nome, email, categoria, criado_em 
      FROM usuarios 
      WHERE email IN ('joao.silva@example.com', 'admin@example.com')
      ORDER BY criado_em DESC
    `);

    console.log('\nUsuários inseridos:');
    rows.forEach(user => {
      console.log(`\nID: ${user.id}`);
      console.log(`Nome: ${user.nome}`);
      console.log(`Email: ${user.email}`);
      console.log(`Categoria: ${user.categoria}`);
      console.log(`Criado em: ${new Date(user.criado_em).toLocaleString()}`);
    });

  } catch (error) {
    console.error('Erro ao inserir usuários:', error);
    if (error.message) {
      console.error('Detalhes do erro:', error.message);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

// Executa a inserção
insertTestUsers();