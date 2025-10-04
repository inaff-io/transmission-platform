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

if (!process.env.DATABASE_URL) {
  console.error('Erro: Variável de ambiente DATABASE_URL não encontrada');
  process.exit(1);
}

console.log('Conectando ao banco de dados...');

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkTestUsers() {
  try {
    await client.connect();
    console.log('Conexão estabelecida com sucesso');
    
    console.log('Buscando usuários de teste...');
    
    const result = await client.query(`
      SELECT *
      FROM usuarios
      WHERE email IN ('joao.silva.test@example.com', 'admin.test@example.com')
      ORDER BY created_at DESC
    `);

    if (!result.rows || result.rows.length === 0) {
      console.log('Nenhum usuário de teste encontrado.');
      return;
    }

    console.log('\nUsuários de teste encontrados:');
    console.log('-----------------------------');
    
    result.rows.forEach(user => {
      console.log(`\nID: ${user.id}`);
      console.log(`Nome: ${user.nome}`);
      console.log(`Email: ${user.email}`);
      console.log(`CPF: ${user.cpf}`);
      console.log(`Categoria: ${user.categoria}`);
      console.log(`Status: ${user.status ? 'Ativo' : 'Inativo'}`);
      console.log(`Criado em: ${new Date(user.created_at).toLocaleString()}`);
      console.log(`Atualizado em: ${new Date(user.updated_at).toLocaleString()}`);
    });

  } catch (error) {
    console.error('Erro ao verificar usuários:', error);
    if (error.message) {
      console.error('Detalhes do erro:', error.message);
    }
  } finally {
    await client.end();
  }
}

// Executa a verificação
checkTestUsers();