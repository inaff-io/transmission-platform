import pg from 'pg';

import { dbConfig } from './config';

// Função para criar um cliente PostgreSQL direto
export function createPgClient() {
  return new pg.Client(dbConfig);
}

// Função para buscar usuário por email
export async function findUserByEmail(email: string) {
  const client = createPgClient();
  
  try {
    await client.connect();
    
    const result = await client.query(
      'SELECT * FROM usuarios WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [email]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('[PG] Erro ao buscar usuário por email:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Função para buscar usuário por CPF
export async function findUserByCpf(cpf: string) {
  const client = createPgClient();
  
  try {
    await client.connect();
    
    const result = await client.query(
      'SELECT * FROM usuarios WHERE cpf = $1 LIMIT 1',
      [cpf]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('[PG] Erro ao buscar usuário por CPF:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Função para criar registro de login
export async function createLoginRecord(usuarioId: string) {
  const client = createPgClient();
  
  try {
    await client.connect();
    
    const result = await client.query(
      `INSERT INTO logins (usuario_id, login_em) 
       VALUES ($1, NOW()) 
       RETURNING *`,
      [usuarioId]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('[PG] Erro ao criar registro de login:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Função para atualizar last_active do usuário
export async function updateUserLastActive(usuarioId: string) {
  const client = createPgClient();
  
  try {
    await client.connect();
    
    await client.query(
      'UPDATE usuarios SET last_active = NOW() WHERE id = $1',
      [usuarioId]
    );
    
    return true;
  } catch (error) {
    console.error('[PG] Erro ao atualizar last_active:', error);
    throw error;
  } finally {
    await client.end();
  }
}
