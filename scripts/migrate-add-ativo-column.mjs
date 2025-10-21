#!/usr/bin/env node

/**
 * Migração: Adiciona coluna 'ativo' na tabela usuarios
 * 
 * Executa o script SQL para adicionar a coluna ativo que está sendo
 * usada no código mas não existe no schema do Supabase
 */

import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do banco (US-East-2)
const dbConfig = {
  user: 'postgres.ywcmqgfbxrejuwcbeolu',
  password: 'OMSmx9QqbMq4OXun',
  host: 'aws-1-us-east-2.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
};

async function runMigration() {
  const client = new Client(dbConfig);

  try {
    console.log('🔌 Conectando ao banco PostgreSQL (US-East-2)...');
    await client.connect();
    console.log('✅ Conectado!\n');

    // Lê o script SQL
    const sqlPath = join(__dirname, 'add-ativo-column.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('📝 Executando migração SQL...\n');
    console.log('━'.repeat(60));

    // Divide o SQL em statements individuais
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      // Ignora comentários
      if (statement.startsWith('--') || statement.length === 0) continue;

      console.log(`\n🔄 Executando: ${statement.substring(0, 80)}...`);

      try {
        const result = await client.query(statement);

        // Se for SELECT, mostra resultados
        if (statement.toUpperCase().includes('SELECT')) {
          if (result.rows && result.rows.length > 0) {
            console.log('📊 Resultado:');
            console.table(result.rows);
          } else {
            console.log('✅ Query executada (sem resultados)');
          }
        } else {
          console.log(`✅ Sucesso! (${result.rowCount || 0} linhas afetadas)`);
        }
      } catch (err) {
        // Se erro for "column already exists", ignora
        if (err.code === '42701') {
          console.log('⚠️  Coluna já existe, pulando...');
        } else {
          throw err;
        }
      }
    }

    console.log('\n━'.repeat(60));
    console.log('✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('━'.repeat(60));

    // Validação final
    console.log('\n🔍 Validação final...');
    const validation = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' 
        AND column_name = 'ativo'
    `);

    if (validation.rows.length > 0) {
      console.log('\n✅ Coluna "ativo" criada com sucesso:');
      console.table(validation.rows);
    } else {
      console.error('\n❌ ERRO: Coluna "ativo" não foi criada!');
      process.exit(1);
    }

    // Conta usuários
    const count = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE ativo = true) as ativos,
        COUNT(*) FILTER (WHERE ativo = false) as inativos
      FROM usuarios
    `);

    console.log('\n📊 Status dos usuários:');
    console.table(count.rows);

  } catch (error) {
    console.error('\n❌ ERRO NA MIGRAÇÃO:');
    console.error('━'.repeat(60));
    console.error(error);
    console.error('━'.repeat(60));
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão fechada.');
  }
}

// Executa migração
console.log('🚀 Iniciando migração: Adicionar coluna "ativo"\n');
runMigration();
