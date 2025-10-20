#!/usr/bin/env node
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Client } = pg;

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║         VERIFICAÇÃO DE TABELAS NO SUPABASE                     ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Tabelas esperadas no projeto
const EXPECTED_TABLES = [
  'usuarios',
  'logins',
  'links',
  'abas',
  'chat'
];

async function checkAllTables() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.log('❌ DATABASE_URL não encontrado no .env.local\n');
    process.exit(1);
  }
  
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados!\n');
    
    // Busca todas as tabelas no schema public
    const result = await client.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE table_schema = 'public' 
         AND table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const existingTables = result.rows.map(r => r.table_name);
    
    console.log('📊 TABELAS ENCONTRADAS NO BANCO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (existingTables.length === 0) {
      console.log('   ⚠️  Nenhuma tabela encontrada no schema public!\n');
    } else {
      for (const row of result.rows) {
        const isExpected = EXPECTED_TABLES.includes(row.table_name);
        const badge = isExpected ? '✅' : '📋';
        console.log(`   ${badge} ${row.table_name.padEnd(20)} (${row.column_count} colunas)`);
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Verifica tabelas ausentes
    console.log('🔍 VERIFICAÇÃO DE TABELAS NECESSÁRIAS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const missingTables = [];
    
    for (const tableName of EXPECTED_TABLES) {
      const exists = existingTables.includes(tableName);
      const status = exists ? '✅ EXISTE' : '❌ AUSENTE';
      console.log(`   ${tableName.padEnd(20)} → ${status}`);
      
      if (!exists) {
        missingTables.push(tableName);
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Verifica estrutura das tabelas existentes
    if (missingTables.length === 0) {
      console.log('🎉 TODAS AS TABELAS NECESSÁRIAS EXISTEM!\n');
      
      // Mostra contagem de registros
      console.log('📈 CONTAGEM DE REGISTROS:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      for (const tableName of EXPECTED_TABLES) {
        try {
          const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          const count = countResult.rows[0].count;
          console.log(`   ${tableName.padEnd(20)} → ${count} registro(s)`);
        } catch (error) {
          console.log(`   ${tableName.padEnd(20)} → ERRO ao contar`);
        }
      }
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      // Verifica estrutura detalhada
      console.log('📋 ESTRUTURA DAS TABELAS:\n');
      
      for (const tableName of EXPECTED_TABLES) {
        const colResult = await client.query(`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);
        
        console.log(`   📌 ${tableName.toUpperCase()}:`);
        
        for (const col of colResult.rows) {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultVal = col.column_default ? ` (default: ${col.column_default})` : '';
          console.log(`      • ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable}${defaultVal}`);
        }
        
        console.log('');
      }
      
    } else {
      console.log(`⚠️  ATENÇÃO: ${missingTables.length} tabela(s) ausente(s)!\n`);
      console.log('   Tabelas faltando:');
      for (const table of missingTables) {
        console.log(`   • ${table}`);
      }
      console.log('\n✅ SOLUÇÃO:\n');
      console.log('   Execute os scripts SQL para criar as tabelas:\n');
      
      if (missingTables.includes('links') || missingTables.includes('abas')) {
        console.log('   1. scripts/CREATE-LINKS-ABAS-TABLES.sql');
      }
      if (missingTables.includes('usuarios')) {
        console.log('   2. scripts/CREATE-USUARIOS-TABLE.sql');
      }
      if (missingTables.includes('logins')) {
        console.log('   3. scripts/CREATE-LOGINS-TABLE.sql');
      }
      if (missingTables.includes('chat')) {
        console.log('   4. scripts/CREATE-CHAT-TABLE.sql');
      }
      
      console.log('\n   URL do SQL Editor:');
      console.log('   https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/sql/new\n');
    }
    
    await client.end();
    
    process.exit(missingTables.length === 0 ? 0 : 1);
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error('   Código:', error.code);
    process.exit(1);
  }
}

checkAllTables();
