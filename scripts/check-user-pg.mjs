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

async function checkUser(identifier) {
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

    const isEmail = identifier.includes('@');
    const query = isEmail 
      ? {
          text: 'SELECT * FROM usuarios WHERE email = $1',
          values: [identifier]
        }
      : {
          text: 'SELECT * FROM usuarios WHERE cpf = $1',
          values: [identifier.replace(/\D/g, '')]
        };

    const result = await client.query(query);

    if (result.rows.length === 0) {
      console.log('Usuário não encontrado com o identificador:', identifier);
      return;
    }

    const user = result.rows[0];
    console.log('Usuário encontrado:');
    console.log('-------------------');
    console.log(`ID: ${user.id}`);
    console.log(`Nome: ${user.nome}`);
    console.log(`Email: ${user.email}`);
    console.log(`CPF: ${user.cpf}`);
    console.log(`Categoria: ${user.categoria}`);
    console.log(`Status: ${user.status ? 'Ativo' : 'Inativo'}`);
    console.log(`Último acesso: ${user.last_active ? new Date(user.last_active).toLocaleString('pt-BR') : 'Nunca'}`);
    console.log(`Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
    console.log('-------------------');

  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Verifica se foi fornecido um identificador
const identifier = process.argv[2];
if (!identifier) {
  console.error('Por favor, forneça um email ou CPF como argumento.');
  process.exit(1);
}

console.log(`Verificando usuário com identificador: ${identifier}`);
await checkUser(identifier);