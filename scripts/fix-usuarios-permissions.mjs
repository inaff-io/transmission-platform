#!/usr/bin/env node

/**
 * Verifica e corrige permissões da tabela usuarios
 */

import pkg from 'pg';
const { Client } = pkg;

const dbConfig = {
  user: 'postgres.ywcmqgfbxrejuwcbeolu',
  password: 'OMSmx9QqbMq4OXun',
  host: 'aws-1-us-east-2.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
};

const client = new Client(dbConfig);

try {
  console.log('🔌 Conectando...\n');
  await client.connect();

  // 1. Verifica usuário atual
  console.log('👤 Usuário atual:');
  const currentUser = await client.query('SELECT current_user, current_database()');
  console.table(currentUser.rows);

  // 2. Verifica permissões na tabela usuarios
  console.log('\n🔐 Permissões da tabela usuarios:');
  const permissions = await client.query(`
    SELECT 
      grantee,
      privilege_type,
      is_grantable
    FROM information_schema.table_privileges 
    WHERE table_name = 'usuarios'
    ORDER BY grantee, privilege_type
  `);
  
  if (permissions.rows.length > 0) {
    console.table(permissions.rows);
  } else {
    console.log('⚠️  Nenhuma permissão explícita encontrada\n');
  }

  // 3. Verifica owner da tabela
  console.log('\n👑 Owner da tabela usuarios:');
  const owner = await client.query(`
    SELECT 
      schemaname,
      tablename,
      tableowner
    FROM pg_tables 
    WHERE tablename = 'usuarios'
  `);
  console.table(owner.rows);

  // 4. Testa INSERT
  console.log('\n🧪 Testando INSERT...');
  
  try {
    const testResult = await client.query(`
      INSERT INTO usuarios (nome, email, cpf, categoria, status, ativo)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, nome, email
    `, ['Teste Permissão', 'teste@teste.com', '00000000000', 'user', true, true]);
    
    console.log('✅ INSERT funcionou!');
    console.table(testResult.rows);
    
    // Deleta teste
    await client.query('DELETE FROM usuarios WHERE id = $1', [testResult.rows[0].id]);
    console.log('🗑️  Registro de teste deletado\n');
    
  } catch (insertErr) {
    console.error('❌ INSERT falhou!');
    console.error('Erro:', insertErr.message);
    console.error('Code:', insertErr.code);
    console.error('Detail:', insertErr.detail);
    
    // Se erro de permissão, tenta corrigir
    if (insertErr.code === '42501') {
      console.log('\n🔧 Tentando corrigir permissões...\n');
      
      try {
        // Grant ALL para o usuário atual
        const user = currentUser.rows[0].current_user;
        
        await client.query(`
          GRANT ALL ON TABLE usuarios TO ${user}
        `);
        console.log(`✅ GRANT ALL concedido para: ${user}`);
        
        // Grant ALL para postgres (superuser)
        await client.query(`
          GRANT ALL ON TABLE usuarios TO postgres
        `);
        console.log('✅ GRANT ALL concedido para: postgres');
        
        // Grant ALL para authenticated (Supabase role)
        await client.query(`
          GRANT ALL ON TABLE usuarios TO authenticated
        `);
        console.log('✅ GRANT ALL concedido para: authenticated');
        
        // Grant ALL para anon (public access)
        await client.query(`
          GRANT ALL ON TABLE usuarios TO anon
        `);
        console.log('✅ GRANT ALL concedido para: anon');
        
        console.log('\n📋 Permissões atualizadas:');
        const newPermissions = await client.query(`
          SELECT grantee, privilege_type
          FROM information_schema.table_privileges 
          WHERE table_name = 'usuarios'
          ORDER BY grantee, privilege_type
        `);
        console.table(newPermissions.rows);
        
        // Testa novamente
        console.log('\n🧪 Testando INSERT novamente...');
        const retryResult = await client.query(`
          INSERT INTO usuarios (nome, email, cpf, categoria, status, ativo)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, nome, email
        `, ['Teste Após Fix', 'teste2@teste.com', '11111111111', 'user', true, true]);
        
        console.log('✅ INSERT funcionou após correção!');
        console.table(retryResult.rows);
        
        await client.query('DELETE FROM usuarios WHERE id = $1', [retryResult.rows[0].id]);
        console.log('🗑️  Registro deletado\n');
        
      } catch (grantErr) {
        console.error('\n❌ Erro ao conceder permissões:');
        console.error(grantErr.message);
      }
    }
  }

  console.log('\n━'.repeat(60));
  console.log('✅ Verificação concluída');
  console.log('━'.repeat(60));

} catch (error) {
  console.error('\n❌ ERRO:', error.message);
  console.error(error);
  process.exit(1);
} finally {
  await client.end();
}
