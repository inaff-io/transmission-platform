#!/usr/bin/env node

/**
 * 🔍 VERIFICAR ESTRUTURA DA TABELA USUARIOS
 */

import pg from 'pg';
import { config } from 'dotenv';

config({ path: '.env.local' });

const DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;

const client = new pg.Client({
  connectionString: DIRECT_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

try {
  await client.connect();
  
  console.log('\n📋 ESTRUTURA DA TABELA USUARIOS:\n');
  
  const columns = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'usuarios'
    ORDER BY ordinal_position
  `);
  
  for (const col of columns.rows) {
    console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? '🔒 NOT NULL' : ''}`);
  }
  
  console.log('\n📊 DADOS DOS USUÁRIOS:\n');
  
  const users = await client.query('SELECT * FROM usuarios LIMIT 10');
  
  if (users.rows.length === 0) {
    console.log('⚠️  Nenhum usuário encontrado!\n');
  } else {
    console.log(`Total: ${users.rows.length} usuários\n`);
    
    for (const user of users.rows) {
      console.log('─────────────────────────────────────');
      for (const [key, value] of Object.entries(user)) {
        console.log(`  ${key}: ${value}`);
      }
      console.log('');
    }
  }
  
} catch (error) {
  console.log('❌ ERRO:', error.message);
} finally {
  await client.end();
}
