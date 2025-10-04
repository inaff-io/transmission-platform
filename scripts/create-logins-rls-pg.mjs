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

async function createLoginsRLS() {
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

    // Remover políticas existentes, se houver
    await client.query(`
      DROP POLICY IF EXISTS admin_logins_policy ON logins;
      DROP POLICY IF EXISTS user_logins_policy ON logins;
    `);
    console.log('Políticas antigas removidas (se existiam)');

    // Habilitar RLS na tabela logins
    await client.query(`
      ALTER TABLE logins ENABLE ROW LEVEL SECURITY;
    `);
    console.log('RLS habilitado na tabela logins');

    // Política para usuários admin (acesso total)
    await client.query(`
      CREATE POLICY admin_logins_policy ON logins
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM usuarios u
          WHERE u.id::text = auth.uid()::text
          AND u.categoria = 'admin'
        )
      );
    `);
    console.log('Política RLS para admin criada');

    // Política para usuários autenticados (apenas seus próprios registros)
    await client.query(`
      CREATE POLICY user_logins_policy ON logins
      FOR SELECT
      TO authenticated
      USING (usuario_id::text = auth.uid()::text);
    `);
    console.log('Política RLS para usuários autenticados criada');

    console.log('Todas as políticas RLS foram criadas com sucesso!');
  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

console.log('Iniciando criação das políticas RLS...');
await createLoginsRLS();