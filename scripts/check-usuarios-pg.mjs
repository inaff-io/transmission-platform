import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkUsuarios() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    await client.connect();
    console.log('Conectado ao banco de dados!');

    const sql = fs.readFileSync(path.resolve(process.cwd(), 'scripts', 'check-usuarios.sql'), 'utf8');
    const res = await client.query(sql);

    console.log('Resultado da verificação:', res.rows);

  } catch (err) {
    console.error('Erro ao verificar a tabela de usuarios:', err);
  } finally {
    await client.end();
    console.log('Conexão com o banco de dados fechada.');
  }
}

checkUsuarios();