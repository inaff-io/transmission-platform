import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Client } = pg;

async function createTestUsers() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');

    const testUsers = [
      {
        nome: 'Maria Silva',
        email: 'maria.silva@test.com',
        cpf: '12345678901',
        categoria: 'user'
      },
      {
        nome: 'João Santos',
        email: 'joao.santos@test.com',
        cpf: '98765432109',
        categoria: 'user'
      },
      {
        nome: 'Ana Oliveira',
        email: 'ana.oliveira@test.com',
        cpf: '45678912301',
        categoria: 'user'
      }
    ];

    console.log('📝 Criando usuários de teste...\n');

    for (const user of testUsers) {
      // Verificar se já existe
      const checkQuery = `
        SELECT id, nome, email FROM usuarios 
        WHERE email = $1 OR cpf = $2
      `;
      const checkResult = await client.query(checkQuery, [user.email, user.cpf]);

      if (checkResult.rows.length > 0) {
        console.log(`⚠️  ${user.nome} já existe (${checkResult.rows[0].email})`);
        continue;
      }

      // Criar usuário
      const insertQuery = `
        INSERT INTO usuarios (
          nome, email, cpf, categoria, status, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id, nome, email, cpf, categoria
      `;

      const result = await client.query(insertQuery, [
        user.nome,
        user.email,
        user.cpf,
        user.categoria,
        true
      ]);

      console.log(`✅ ${result.rows[0].nome} criado com sucesso`);
      console.log(`   ID: ${result.rows[0].id}`);
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   CPF: ${result.rows[0].cpf}`);
      console.log(`   Categoria: ${result.rows[0].categoria}\n`);
    }

    console.log('='.repeat(60) + '\n');

    // Listar todos os usuários
    const listQuery = `
      SELECT id, nome, email, cpf, categoria, status, created_at
      FROM usuarios
      ORDER BY categoria DESC, created_at ASC
    `;
    const listResult = await client.query(listQuery);

    console.log(`📊 TOTAL DE USUÁRIOS NO BANCO: ${listResult.rows.length}\n`);

    // Separar por categoria
    const admins = listResult.rows.filter(u => u.categoria === 'admin');
    const users = listResult.rows.filter(u => u.categoria === 'user');

    if (admins.length > 0) {
      console.log(`👑 ADMINISTRADORES (${admins.length}):`);
      admins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.nome}`);
        console.log(`      Email: ${admin.email}`);
        console.log(`      CPF: ${admin.cpf}`);
        console.log(`      Status: ${admin.status ? 'ativo' : 'inativo'}\n`);
      });
    }

    if (users.length > 0) {
      console.log(`👥 USUÁRIOS REGULARES (${users.length}):`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.nome}`);
        console.log(`      Email: ${user.email}`);
        console.log(`      CPF: ${user.cpf}`);
        console.log(`      Status: ${user.status ? 'ativo' : 'inativo'}\n`);
      });
    }

    console.log('='.repeat(60) + '\n');
    console.log('✅ USUÁRIOS DE TESTE CRIADOS COM SUCESSO!\n');
    console.log('🔐 URLs de Login:');
    console.log('   Admin: https://transmission-platform-xi.vercel.app/admin');
    console.log('   User:  https://transmission-platform-xi.vercel.app/login\n');
    console.log('💡 Lembre-se: Sistema passwordless (apenas email ou CPF)');

  } catch (error) {
    console.error('❌ Erro ao criar usuários:', error.message);
    if (error.code) {
      console.error(`   Código: ${error.code}`);
    }
    if (error.detail) {
      console.error(`   Detalhe: ${error.detail}`);
    }
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada');
  }
}

createTestUsers();
