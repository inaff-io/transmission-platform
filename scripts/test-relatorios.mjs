#!/usr/bin/env node
/**
 * Testa os endpoints de relatórios
 * Execução: node scripts/test-relatorios.mjs
 */

import dotenv from 'dotenv';
import pg from 'pg';

const { Client } = pg;
dotenv.config({ path: '.env.local' });

async function testRelatorios() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║              TESTE: Endpoints de Relatórios                   ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL\n');

    // Teste 1: Verifica tabela logins
    console.log('📊 Teste 1: Tabela logins\n');
    const { rows: logins } = await client.query(`
      SELECT COUNT(*) as total,
             MIN(login_em) as primeira_data,
             MAX(login_em) as ultima_data
      FROM logins
    `);
    console.log(`   Total de logins: ${logins[0].total}`);
    console.log(`   Primeira data: ${logins[0].primeira_data || 'N/A'}`);
    console.log(`   Última data: ${logins[0].ultima_data || 'N/A'}\n`);

    // Teste 2: Verifica JOIN com usuarios
    console.log('📊 Teste 2: JOIN logins + usuarios\n');
    const { rows: loginsUsuarios } = await client.query(`
      SELECT 
        l.id,
        l.usuario_id,
        l.login_em,
        u.nome as usuario_nome,
        u.email as usuario_email
      FROM logins l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      ORDER BY l.login_em DESC
      LIMIT 5
    `);
    
    if (loginsUsuarios.length === 0) {
      console.log('   ⚠️  Nenhum login encontrado\n');
    } else {
      console.log(`   ✅ ${loginsUsuarios.length} logins recentes:\n`);
      for (const [index, login] of loginsUsuarios.entries()) {
        console.log(`   ${index + 1}. ${login.usuario_nome || 'N/A'} (${login.usuario_email || 'N/A'})`);
        console.log(`      Login em: ${login.login_em}`);
        console.log(`      Usuario ID: ${login.usuario_id}\n`);
      }
    }

    // Teste 3: Verifica se há usuários órfãos
    console.log('📊 Teste 3: Verificando integridade referencial\n');
    const { rows: orfaos } = await client.query(`
      SELECT COUNT(*) as total
      FROM logins l
      WHERE l.usuario_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM usuarios u WHERE u.id = l.usuario_id)
    `);
    
    if (Number(orfaos[0].total) > 0) {
      console.log(`   ⚠️  ${orfaos[0].total} logins com usuario_id inexistente!\n`);
    } else {
      console.log(`   ✅ Todos os logins têm usuários válidos\n`);
    }

    // Teste 4: Testa query com filtro de data
    console.log('📊 Teste 4: Query com filtro de data (últimos 7 dias)\n');
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - 7);
    const dataFim = new Date();

    const { rows: loginsSemana } = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT usuario_id) as usuarios_unicos
      FROM logins
      WHERE (login_em AT TIME ZONE 'America/Sao_Paulo')::date 
            BETWEEN $1::date AND $2::date
    `, [dataInicio.toISOString().split('T')[0], dataFim.toISOString().split('T')[0]]);

    console.log(`   Total de logins (7 dias): ${loginsSemana[0].total}`);
    console.log(`   Usuários únicos: ${loginsSemana[0].usuarios_unicos}\n`);

    // Teste 5: Verifica coluna usuario_id (tipo)
    console.log('📊 Teste 5: Estrutura da coluna usuario_id\n');
    const { rows: colunas } = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'logins'
        AND column_name = 'usuario_id'
    `);

    if (colunas.length > 0) {
      console.log(`   Tipo: ${colunas[0].data_type}`);
      console.log(`   Permite NULL: ${colunas[0].is_nullable}\n`);
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n✅ Testes concluídos com sucesso!\n');

  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error);
    if (error instanceof Error) {
      console.error('   Mensagem:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

await testRelatorios();
