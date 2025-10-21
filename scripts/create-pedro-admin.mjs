import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Client } = pg;

async function createPedroAdmin() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    // Verificar se usuário já existe
    const checkQuery = `
      SELECT id, nome, email, cpf, categoria 
      FROM usuarios 
      WHERE email = $1 OR cpf = $2
    `;
    const checkResult = await client.query(checkQuery, ['pecosta26@gmail.com', '05701807401']);

    if (checkResult.rows.length > 0) {
      const existing = checkResult.rows[0];
      console.log('\n⚠️  Usuário já existe no banco:');
      console.log(`   ID: ${existing.id}`);
      console.log(`   Nome: ${existing.nome}`);
      console.log(`   Email: ${existing.email}`);
      console.log(`   CPF: ${existing.cpf}`);
      console.log(`   Categoria: ${existing.categoria}`);
      
      // Atualizar para admin se não for
      if (existing.categoria !== 'admin') {
        console.log('\n🔄 Atualizando categoria para admin...');
        const updateQuery = `
          UPDATE usuarios 
          SET categoria = 'admin',
              nome = $1,
              cpf = $2,
              status = true,
              updated_at = NOW()
          WHERE email = $3
          RETURNING id, nome, email, cpf, categoria
        `;
        const updateResult = await client.query(updateQuery, [
          'Pedro Costa',
          '05701807401',
          'pecosta26@gmail.com'
        ]);
        
        console.log('✅ Usuário atualizado com sucesso:');
        console.log(`   ID: ${updateResult.rows[0].id}`);
        console.log(`   Nome: ${updateResult.rows[0].nome}`);
        console.log(`   Email: ${updateResult.rows[0].email}`);
        console.log(`   CPF: ${updateResult.rows[0].cpf}`);
        console.log(`   Categoria: ${updateResult.rows[0].categoria}`);
      } else {
        console.log('\n✅ Usuário já é admin. Nenhuma alteração necessária.');
      }
      
      return;
    }

    // Criar novo usuário admin
    console.log('\n📝 Criando novo usuário admin...');
    const insertQuery = `
      INSERT INTO usuarios (
        nome,
        email,
        cpf,
        categoria,
        status,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, nome, email, cpf, categoria, status, created_at
    `;
    
    const result = await client.query(insertQuery, [
      'Pedro Costa',
      'pecosta26@gmail.com',
      '05701807401',
      'admin',
      true
    ]);

    console.log('✅ Usuário admin criado com sucesso!\n');
    console.log('📋 Dados do usuário:');
    console.log(`   ID: ${result.rows[0].id}`);
    console.log(`   Nome: ${result.rows[0].nome}`);
    console.log(`   Email: ${result.rows[0].email}`);
    console.log(`   CPF: ${result.rows[0].cpf}`);
    console.log(`   Categoria: ${result.rows[0].categoria}`);
    console.log(`   Status: ${result.rows[0].status}`);
    console.log(`   Criado em: ${result.rows[0].created_at}`);
    
    console.log('\n🔐 Login disponível em:');
    console.log('   URL: https://transmission-platform-xi.vercel.app/admin');
    console.log('   Email: pecosta26@gmail.com');
    console.log('   CPF: 05701807401');
    console.log('   (Sistema passwordless - use email OU CPF)');

  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error.message);
    if (error.code) {
      console.error(`   Código do erro: ${error.code}`);
    }
    if (error.detail) {
      console.error(`   Detalhe: ${error.detail}`);
    }
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada');
  }
}

// Executar
createPedroAdmin();
