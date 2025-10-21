#!/usr/bin/env node
/**
 * Testa relatórios com timezone de São Paulo e consolidação
 */

import dotenv from 'dotenv';
import pg from 'pg';

const { Client } = pg;
dotenv.config({ path: '.env.local' });

async function testRelatoriosSaoPaulo() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   TESTE: Relatórios com Timezone São Paulo + Consolidação     ║');
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

    // 1. Testa conversão de timezone
    console.log('📊 Teste 1: Conversão de Timezone\n');
    const { rows: timezoneTest } = await client.query(`
      SELECT 
        login_em as utc_time,
        login_em AT TIME ZONE 'America/Sao_Paulo' as sp_time,
        (login_em AT TIME ZONE 'America/Sao_Paulo')::date as sp_date
      FROM logins
      WHERE login_em IS NOT NULL
      ORDER BY login_em DESC
      LIMIT 3
    `);

    console.log('   Últimos 3 logins:\n');
    for (const [index, row] of timezoneTest.entries()) {
      console.log(`   ${index + 1}. UTC: ${row.utc_time}`);
      console.log(`      São Paulo: ${row.sp_time}`);
      console.log(`      Data SP: ${row.sp_date}\n`);
    }

    // 2. Testa consolidação por usuário
    console.log('📊 Teste 2: Consolidação por Usuário\n');
    const { rows: consolidado } = await client.query(`
      SELECT 
        u.nome,
        u.email,
        COUNT(*) as total_logins,
        MIN(l.login_em AT TIME ZONE 'America/Sao_Paulo') as primeiro_login,
        MAX(l.login_em AT TIME ZONE 'America/Sao_Paulo') as ultimo_login,
        SUM(COALESCE(l.tempo_logado, 0)) as tempo_total_segundos
      FROM logins l
      INNER JOIN usuarios u ON l.usuario_id = u.id
      GROUP BY u.id, u.nome, u.email
      ORDER BY total_logins DESC
      LIMIT 10
    `);

    console.log('   Top 10 usuários por quantidade de logins:\n');
    for (const [index, user] of consolidado.entries()) {
      const horas = Math.floor(Number(user.tempo_total_segundos) / 3600);
      const minutos = Math.floor((Number(user.tempo_total_segundos) % 3600) / 60);
      
      console.log(`   ${index + 1}. ${user.nome}`);
      console.log(`      Email: ${user.email}`);
      console.log(`      Total de logins: ${user.total_logins}`);
      console.log(`      Primeiro login: ${user.primeiro_login}`);
      console.log(`      Último login: ${user.ultimo_login}`);
      console.log(`      Tempo total: ${horas}h ${minutos}m\n`);
    }

    // 3. Testa filtro por data (hoje)
    console.log('📊 Teste 3: Filtro por Data (Hoje em São Paulo)\n');
    const hoje = new Date().toISOString().split('T')[0];
    
    const { rows: loginshoje } = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT usuario_id) as usuarios_unicos
      FROM logins
      WHERE (login_em AT TIME ZONE 'America/Sao_Paulo')::date = $1::date
    `, [hoje]);

    console.log(`   Data: ${hoje}`);
    console.log(`   Total de logins: ${loginshoje[0].total}`);
    console.log(`   Usuários únicos: ${loginshoje[0].usuarios_unicos}\n`);

    // 4. Verifica logins por hora do dia (SP timezone)
    console.log('📊 Teste 4: Distribuição por Hora do Dia (Timezone SP)\n');
    const { rows: porHora } = await client.query(`
      SELECT 
        EXTRACT(HOUR FROM login_em AT TIME ZONE 'America/Sao_Paulo') as hora,
        COUNT(*) as quantidade
      FROM logins
      WHERE login_em IS NOT NULL
      GROUP BY hora
      ORDER BY hora
    `);

    if (porHora.length > 0) {
      console.log('   Logins por hora:\n');
      for (const row of porHora) {
        const barra = '█'.repeat(Math.min(Number(row.quantidade), 50));
        console.log(`   ${String(row.hora).padStart(2, '0')}:00 │${barra} ${row.quantidade}`);
      }
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n✅ Testes concluídos!\n');
    console.log('Próximos passos:');
    console.log('  1. Verificar interface web de relatórios');
    console.log('  2. Testar export CSV com horários corretos');
    console.log('  3. Validar consolidação por usuário\n');

  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error);
    if (error instanceof Error) {
      console.error('   Mensagem:', error.message);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

await testRelatoriosSaoPaulo();
