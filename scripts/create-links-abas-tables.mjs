#!/usr/bin/env node
/**
 * Script para criar as tabelas links e abas no Supabase
 * Execução: node scripts/create-links-abas-tables.mjs
 */

import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar dotenv
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

async function createTables() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         CRIANDO TABELAS: links e abas                          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado!\n');

    // Ler o arquivo SQL
    const sqlFilePath = path.join(__dirname, 'CREATE-LINKS-ABAS-TABLES.sql');
    console.log(`📄 Lendo arquivo SQL: ${sqlFilePath}\n`);
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Executar o SQL
    console.log('⚙️  Executando SQL...\n');
    await client.query(sqlContent);

    console.log('✅ TABELAS CRIADAS COM SUCESSO!\n');

    // Verificar as tabelas criadas
    console.log('🔍 Verificando tabelas criadas...\n');

    const checkQuery = `
      SELECT 
        table_name,
        (SELECT COUNT(*) 
         FROM information_schema.columns 
         WHERE table_schema = 'public' 
         AND columns.table_name = tables.table_name) as total_colunas
      FROM information_schema.tables
      WHERE table_schema = 'public' 
      AND table_name IN ('links', 'abas')
      ORDER BY table_name;
    `;

    const result = await client.query(checkQuery);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 TABELAS CRIADAS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    result.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name.padEnd(20)} (${row.total_colunas} colunas)`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Verificar dados inseridos em abas
    const abasResult = await client.query('SELECT nome, visivel, ordem FROM public.abas ORDER BY ordem');
    
    console.log('\n📋 ABAS CRIADAS (dados iniciais):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    abasResult.rows.forEach(row => {
      const statusIcon = row.visivel ? '👁️ ' : '🙈';
      console.log(`   ${statusIcon} ${row.nome.padEnd(15)} (ordem: ${row.ordem}, visível: ${row.visivel ? 'SIM' : 'NÃO'})`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n🎉 SUCESSO! Tabelas criadas e dados iniciais inseridos.\n');
    console.log('📝 PRÓXIMOS PASSOS:\n');
    console.log('   1. Recarregue o cache do Supabase:');
    console.log('      https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/api');
    console.log('      (Clique em "Reload Schema")\n');
    console.log('   2. Reinicie o servidor Next.js:');
    console.log('      npm run dev\n');
    console.log('   3. Teste a aplicação!\n');

  } catch (error) {
    console.error('❌ ERRO ao criar tabelas:', error.message);
    console.error('\n📋 Detalhes do erro:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Conexão encerrada.\n');
  }
}

// Executar
createTables();
