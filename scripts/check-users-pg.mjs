import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');

console.log('Carregando variáveis de ambiente...');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const databaseUrl = process.env.DATABASE_URL;
console.log('Database URL:', databaseUrl ? 'Configurada' : 'NÃO ENCONTRADA');

async function checkUsersDirectPG() {
  console.log('\n=== Verificando usuários via PostgreSQL direto ===\n');
  
  // Parse da URL do banco de dados
  // postgresql://postgres.apamlthhsppsjvbxzouv:Sucesso@1234@aws-1-sa-east-1.pooler.supabase.com:6543/postgres
  const client = new pg.Client({
    user: 'postgres.apamlthhsppsjvbxzouv',
    password: 'Sucesso@1234',
    host: 'aws-1-sa-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Conectando ao PostgreSQL...');
    await client.connect();
    console.log('✓ Conectado com sucesso!\n');

    // Verifica se a tabela existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('⚠ Tabela "usuarios" não existe!');
      console.log('Execute as migrações do Prisma primeiro:');
      console.log('  npx prisma migrate dev');
      return;
    }

    console.log('✓ Tabela "usuarios" existe\n');

    // Busca todos os usuários
    const result = await client.query(`
      SELECT id, nome, email, cpf, categoria, status, created_at, updated_at, last_active
      FROM usuarios
      ORDER BY created_at DESC
    `);

    console.log(`Total de usuários encontrados: ${result.rows.length}\n`);

    if (result.rows.length > 0) {
      console.log('Lista de usuários:');
      console.log('==================\n');

      result.rows.forEach((user, index) => {
        console.log(`${index + 1}. ${user.nome}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   CPF: ${user.cpf}`);
        console.log(`   Categoria: ${user.categoria}`);
        console.log(`   Status: ${user.status ? 'Ativo ✓' : 'Inativo ✗'}`);
        console.log(`   Criado em: ${user.created_at}`);
        console.log(`   Último acesso: ${user.last_active || 'Nunca'}`);
        console.log(`   ID: ${user.id}`);
        console.log('');
      });

      // Estatísticas
      const admins = result.rows.filter(u => u.categoria === 'admin').length;
      const users = result.rows.filter(u => u.categoria === 'user').length;
      const ativos = result.rows.filter(u => u.status).length;

      console.log('Estatísticas:');
      console.log('=============');
      console.log(`Administradores: ${admins}`);
      console.log(`Usuários: ${users}`);
      console.log(`Ativos: ${ativos}`);
      console.log(`Inativos: ${result.rows.length - ativos}`);
    } else {
      console.log('⚠ Nenhum usuário encontrado no banco de dados.');
      console.log('\nPara criar um usuário admin, você pode executar:');
      console.log('  node scripts/create-admin-user.mjs');
      console.log('\nOu usar o Prisma Studio:');
      console.log('  npx prisma studio');
    }
  } catch (err) {
    console.error('❌ Erro ao verificar usuários:', err.message);
    console.error('\nDetalhes:', err);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✓ Conexão fechada');
  }
}

console.log('Iniciando verificação...');
await checkUsersDirectPG();
console.log('\n✓ Verificação concluída!');
