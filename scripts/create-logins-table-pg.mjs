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

async function createLoginsTable() {
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

    // Dropar tabela existente
    await client.query('DROP TABLE IF EXISTS logins CASCADE;');
    console.log('Tabela logins removida (se existia)');

    // Criar extensão pgcrypto se não existir (necessária para gen_random_uuid())
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    console.log('Extensão pgcrypto habilitada');

    // Criar tabela de logins
    await client.query(`
      CREATE TABLE logins (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        usuario_id TEXT NOT NULL,
        login_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        logout_em TIMESTAMP WITH TIME ZONE,
        tempo_logado INTEGER,
        ip TEXT,
        navegador TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      );

      -- Criar índices para melhor performance
      CREATE INDEX IF NOT EXISTS idx_logins_usuario_id ON logins(usuario_id);
      CREATE INDEX IF NOT EXISTS idx_logins_login_em ON logins(login_em);
      CREATE INDEX IF NOT EXISTS idx_logins_logout_em ON logins(logout_em);
    `);

    console.log('Tabela logins criada com sucesso!');
  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

console.log('Iniciando criação da tabela logins...');
await createLoginsTable();