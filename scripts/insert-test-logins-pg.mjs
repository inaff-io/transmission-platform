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

if (!process.env.POSTGRES_URL) {
  console.error('Erro: Variável de ambiente POSTGRES_URL não encontrada');
  process.exit(1);
}

async function insertTestLogins() {
  console.log('Conectando ao PostgreSQL...');
  
  const client = new pg.Client({
    connectionString: process.env.POSTGRES_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Conectado com sucesso!');

    // Buscar ID do usuário admin
    const adminResult = await client.query(`
      SELECT id FROM usuarios WHERE categoria = 'admin' LIMIT 1;
    `);

    if (adminResult.rows.length === 0) {
      throw new Error('Nenhum usuário admin encontrado');
    }

    const adminId = adminResult.rows[0].id;
    console.log('ID do admin encontrado:', adminId);

    // Gerar 10 registros de login para os últimos 10 dias
    for (let i = 0; i < 10; i++) {
      const loginDate = new Date();
      loginDate.setDate(loginDate.getDate() - i);
      
      const logoutDate = new Date(loginDate);
      logoutDate.setHours(logoutDate.getHours() + 2); // 2 horas de sessão
      
      await client.query(`
        INSERT INTO logins (
          usuario_id,
          login_em,
          logout_em,
          tempo_logado,
          ip,
          navegador
        ) VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6
        );
      `, [
        adminId,
        loginDate.toISOString(),
        logoutDate.toISOString(),
        7200, // 2 horas em segundos
        '127.0.0.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      ]);

      console.log(`Registro de login ${i + 1} inserido para a data ${loginDate.toISOString()}`);
    }

    console.log('Todos os registros de teste foram inseridos com sucesso!');
  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

console.log('Iniciando inserção de dados de teste...');
await insertTestLogins();