import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Configurar cliente PostgreSQL
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function executeSQLFile(filePath) {
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    await client.query(sql);
    console.log('✅ SQL executado com sucesso!');
    
    // Verificar se as tabelas foram criadas
    const { rows } = await client.query('SELECT * FROM usuarios');
    console.log('✅ Tabelas criadas com sucesso!');
    console.log('Usuários:', rows);
    
  } catch (error) {
    console.error('❌ Erro ao executar SQL:', error);
  } finally {
    client.release();
  }
}

// Executar o arquivo SQL
executeSQLFile(path.join(__dirname, 'create-tables.sql'))
  .finally(() => pool.end());