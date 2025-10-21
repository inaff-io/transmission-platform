import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Client } = pg;

async function checkSystemReadiness() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
    ssl: { rejectUnauthorized: false }
  });

  console.log('🔍 VERIFICAÇÃO DE PRONTIDÃO DO SISTEMA\n');
  console.log('='.repeat(70) + '\n');

  try {
    await client.connect();
    console.log('✅ 1. Conexão com banco de dados: OK');

    // Verificar tabela usuarios
    const usersQuery = 'SELECT COUNT(*) as total FROM usuarios';
    const usersResult = await client.query(usersQuery);
    console.log(`✅ 2. Tabela usuarios: OK (${usersResult.rows[0].total} usuários)`);

    // Verificar admin
    const adminQuery = `SELECT COUNT(*) as total FROM usuarios WHERE categoria = 'admin'`;
    const adminResult = await client.query(adminQuery);
    const hasAdmin = parseInt(adminResult.rows[0].total) > 0;
    
    if (hasAdmin) {
      console.log(`✅ 3. Usuário admin: OK (${adminResult.rows[0].total} admin encontrado)`);
      
      // Detalhar admin
      const adminDetailsQuery = `SELECT nome, email, cpf FROM usuarios WHERE categoria = 'admin' LIMIT 1`;
      const adminDetails = await client.query(adminDetailsQuery);
      console.log(`   Nome: ${adminDetails.rows[0].nome}`);
      console.log(`   Email: ${adminDetails.rows[0].email}`);
      console.log(`   CPF: ${adminDetails.rows[0].cpf}`);
    } else {
      console.log('❌ 3. Usuário admin: FALTANDO');
    }

    // Verificar usuários regulares
    const regularUsersQuery = `SELECT COUNT(*) as total FROM usuarios WHERE categoria = 'user'`;
    const regularResult = await client.query(regularUsersQuery);
    const regularCount = parseInt(regularResult.rows[0].total);
    
    if (regularCount > 0) {
      console.log(`✅ 4. Usuários regulares: OK (${regularCount} usuários)`);
    } else {
      console.log('⚠️  4. Usuários regulares: NENHUM (recomendado ter ao menos 1 para teste)');
    }

    // Verificar tabela logins
    const loginsCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'logins'
      ) as exists
    `;
    const loginsCheck = await client.query(loginsCheckQuery);
    
    if (loginsCheck.rows[0].exists) {
      console.log('✅ 5. Tabela logins: OK');
    } else {
      console.log('⚠️  5. Tabela logins: NÃO EXISTE (pode afetar histórico de login)');
    }

    // Verificar tabela links
    const linksCheckQuery = `
      SELECT COUNT(*) as total FROM links
    `;
    const linksResult = await client.query(linksCheckQuery);
    const activeLinks = parseInt(linksResult.rows[0].total);
    
    if (activeLinks > 0) {
      console.log(`✅ 6. Links cadastrados: OK (${activeLinks} links)`);
    } else {
      console.log('⚠️  6. Links cadastrados: NENHUM');
    }

    console.log('\n' + '='.repeat(70) + '\n');

    // Resumo final
    const allChecks = [
      true, // conexão
      true, // tabela usuarios
      hasAdmin,
      regularCount >= 3, // pelo menos 3 usuários de teste
      loginsCheck.rows[0].exists,
      activeLinks >= 2 // pelo menos 2 links
    ];

    const passedChecks = allChecks.filter(check => check === true).length;
    const totalChecks = allChecks.length;

    console.log('📊 RESUMO DA VERIFICAÇÃO\n');
    console.log(`   Verificações passadas: ${passedChecks}/${totalChecks}`);
    
    if (passedChecks === totalChecks) {
      console.log('\n🎉 SISTEMA 100% PRONTO PARA TESTES!\n');
      console.log('✅ Todos os requisitos atendidos');
      console.log('✅ Banco de dados configurado corretamente');
      console.log('✅ Usuários criados (admin + regulares)');
      console.log('✅ Links ativos disponíveis\n');
      
      console.log('🔐 URLs de Teste:');
      console.log('   Admin: https://transmission-platform-xi.vercel.app/admin');
      console.log('   User:  https://transmission-platform-xi.vercel.app/login\n');
      
      console.log('📋 Próximos passos:');
      console.log('   1. Testar login admin (pecosta26@gmail.com ou 05701807401)');
      console.log('   2. Testar login usuários regulares');
      console.log('   3. Testar importação Excel');
      console.log('   4. Verificar funcionalidades do painel admin\n');
      
      console.log('📄 Consulte: GUIA-TESTES-COMPLETO.md para roteiro detalhado');
    } else {
      console.log('\n⚠️  SISTEMA PARCIALMENTE PRONTO\n');
      console.log('Alguns itens precisam de atenção:');
      
      if (!hasAdmin) {
        console.log('   ❌ Criar usuário admin');
      }
      if (regularCount < 3) {
        console.log('   ⚠️  Criar mais usuários de teste (recomendado 3+)');
      }
      if (!loginsCheck.rows[0].exists) {
        console.log('   ⚠️  Verificar tabela logins');
      }
      if (activeLinks < 2) {
        console.log('   ⚠️  Ativar links de transmissão/programação');
      }
      
      console.log('\n💡 Execute os scripts necessários e rode esta verificação novamente');
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ ERRO NA VERIFICAÇÃO:', error.message);
    if (error.code) {
      console.error(`   Código: ${error.code}`);
    }
  } finally {
    await client.end();
  }
}

checkSystemReadiness();
