import pg from 'pg';

// Função para criar um cliente PostgreSQL usando DATABASE_URL do .env
function createPgClient() {
  return new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
}

// Relatório de Acessos
export async function getHistoricoAcessos(dataInicio?: string, dataFim?: string) {
  const client = createPgClient();
  
  try {
    await client.connect();
    
    let query = `
      SELECT 
        ha.id,
        ha.usuario_id,
        ha.acao,
        ha.ip,
        ha.user_agent,
        ha.created_at,
        u.nome as usuario_nome,
        u.email as usuario_email
      FROM historico_acessos ha
      LEFT JOIN usuarios u ON ha.usuario_id = u.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (dataInicio && dataFim) {
      query += ` AND (ha.created_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN $1::date AND $2::date`;
      params.push(dataInicio, dataFim);
    }
    
    query += ` ORDER BY ha.created_at DESC`;
    
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    await client.end();
  }
}

// Relatório de Sessões
export async function getSessoes(dataInicio?: string, dataFim?: string) {
  const client = createPgClient();
  
  try {
    await client.connect();
    
    let query = `
      SELECT 
        s.id,
        s.usuario_id,
        s.iniciada_em,
        s.finalizada_em,
        s.duracao,
        u.nome as usuario_nome,
        u.email as usuario_email
      FROM sessoes s
      LEFT JOIN usuarios u ON s.usuario_id = u.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (dataInicio && dataFim) {
      query += ` AND s.iniciada_em BETWEEN $1 AND $2`;
      params.push(dataInicio, dataFim);
    }
    
    query += ` ORDER BY s.iniciada_em DESC`;
    
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    await client.end();
  }
}

// Relatório de Usuários
export async function getUsuarios(dataInicio?: string, dataFim?: string) {
  const client = createPgClient();
  
  try {
    await client.connect();
    
    let query = `
      SELECT 
        id,
        nome,
        email,
        cpf,
        categoria,
        status,
        last_active,
        created_at
      FROM usuarios
      WHERE status = true
    `;
    
    const params: any[] = [];
    
    if (dataInicio && dataFim) {
      query += ` AND (created_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN $1::date AND $2::date`;
      params.push(dataInicio, dataFim);
    }
    
    query += ` ORDER BY nome ASC`;
    
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    await client.end();
  }
}

// Relatório de Logins
export async function getLogins(dataInicio?: string, dataFim?: string) {
  const client = createPgClient();
  
  try {
    await client.connect();
    
    let query = `
      SELECT 
        l.id,
        l.usuario_id,
        l.login_em,
        l.logout_em,
        u.nome as usuario_nome,
        u.email as usuario_email,
        u.categoria as usuario_categoria
      FROM logins l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (dataInicio && dataFim) {
      query += ` AND (l.login_em AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN $1::date AND $2::date`;
      params.push(dataInicio, dataFim);
    }
    
    query += ` ORDER BY l.login_em DESC`;
    
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    await client.end();
  }
}
