import pg from 'pg';

async function setupLocalDB() {
  console.log('Configurando banco de dados local...');
  
  const adminClient = new pg.Client({
    user: 'postgres',
    password: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'postgres'
  });

  try {
    // Conecta ao banco postgres para criar o novo banco
    await adminClient.connect();
    
    // Verifica se o banco transmission já existe
    const dbExists = await adminClient.query(`
      SELECT 1 FROM pg_database WHERE datname = 'transmission'
    `);
    
    if (dbExists.rows.length === 0) {
      // Cria o banco transmission
      await adminClient.query('CREATE DATABASE transmission');
      console.log('Banco de dados "transmission" criado com sucesso!');
    } else {
      console.log('Banco de dados "transmission" já existe.');
    }

    await adminClient.end();

    // Conecta ao banco transmission para criar as tabelas
    const client = new pg.Client({
      user: 'postgres',
      password: 'postgres',
      host: 'localhost',
      port: 5432,
      database: 'transmission'
    });

    await client.connect();

    // Cria o role authenticated se não existir
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
          CREATE ROLE authenticated;
        END IF;
      END
      $$;
    `);
    console.log('Role "authenticated" criado/verificado com sucesso!');

    // Habilita a extensão pgcrypto
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

    // Cria a tabela usuarios
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        cpf TEXT UNIQUE NOT NULL,
        categoria TEXT NOT NULL DEFAULT 'user',
        status BOOLEAN DEFAULT true,
        last_active TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabela "usuarios" criada/verificada com sucesso!');

    // Cria a tabela logins
    await client.query(`
      CREATE TABLE IF NOT EXISTS logins (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        usuario_id TEXT REFERENCES usuarios(id),
        data_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabela "logins" criada/verificada com sucesso!');

    // Habilita RLS na tabela logins
    await client.query('ALTER TABLE logins ENABLE ROW LEVEL SECURITY;');

    // Cria política para admin ver todos os registros
    await client.query(`
      DROP POLICY IF EXISTS admin_logins_policy ON logins;
      CREATE POLICY admin_logins_policy ON logins
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM usuarios u
          WHERE u.id = usuario_id
          AND u.categoria = 'admin'
        )
      );
    `);

    // Cria política para usuários verem apenas seus próprios registros
    await client.query(`
      DROP POLICY IF EXISTS user_logins_policy ON logins;
      CREATE POLICY user_logins_policy ON logins
      FOR ALL
      TO authenticated
      USING (usuario_id = current_user);
    `);

    console.log('Políticas RLS configuradas com sucesso!');

    // Cria usuário admin
    await client.query(`
      INSERT INTO usuarios (nome, email, senha, cpf, categoria)
      VALUES (
        'Admin',
        'admin@example.com',
        crypt('admin123', gen_salt('bf')),
        '12345678900',
        'admin'
      )
      ON CONFLICT (email) DO NOTHING;
    `);

    // Cria usuário comum
    await client.query(`
      INSERT INTO usuarios (nome, email, senha, cpf)
      VALUES (
        'Usuário',
        'user@example.com',
        crypt('user123', gen_salt('bf')),
        '98765432100'
      )
      ON CONFLICT (email) DO NOTHING;
    `);

    console.log('Usuários padrão criados/verificados com sucesso!');

    await client.end();
    console.log('\nBanco de dados local configurado com sucesso!');
    
  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  }
}

await setupLocalDB();