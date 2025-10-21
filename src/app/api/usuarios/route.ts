import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt-server';
import { createPgClient } from '@/lib/db/pg-client';
import pkg from 'pg';
const { Client } = pkg;
import { dbConfig } from '@/lib/db/config';

function createDirectPgClient() {
  return new Client(dbConfig);
}

export async function GET(request: NextRequest) {
  try {
    // Accept either Authorization: Bearer <token> header or authToken cookie
    let token: string | undefined;
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      token = request.cookies.get('authToken')?.value;
    }
    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Autoriza com base na categoria presente no token JWT
    if (payload?.categoria !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const client = createPgClient();
    await client.connect();
    const result = await client.query('SELECT * FROM usuarios ORDER BY created_at DESC');
    await client.end();

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Erro:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const client = createDirectPgClient();
  
  try {
    // Accept either Authorization: Bearer <token> header or authToken cookie
    let token: string | undefined;
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      token = request.cookies.get('authToken')?.value;
    }
    
    if (!token) {
      console.error('[POST /api/usuarios] No authToken found');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload?.email) {
      console.error('[POST /api/usuarios] Invalid token payload');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('[POST /api/usuarios] User:', payload.email, 'creating new user');

    await client.connect();
    
    // Verifica se o usuário logado é admin
    const userResult = await client.query(
      'SELECT id, categoria, email FROM usuarios WHERE email = $1',
      [payload.email]
    );

    if (userResult.rows.length === 0) {
      console.error('[POST /api/usuarios] Logged user not found:', payload.email);
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const user = userResult.rows[0];

    if (user.categoria !== 'admin') {
      console.error('[POST /api/usuarios] User is not admin:', user.categoria);
      return NextResponse.json({ error: 'Acesso negado: apenas admins podem criar usuários' }, { status: 403 });
    }

    const body = await request.json();
    const { nome, email, cpf, categoria } = body;

    console.log('[POST /api/usuarios] Creating user:', { nome, email, cpf, categoria });

    // Validações
    if (!nome || !email || !cpf) {
      return NextResponse.json({ error: 'Nome, email e CPF são obrigatórios' }, { status: 400 });
    }

    // Limpa CPF
    const cpfLimpo = cpf.replaceAll(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      return NextResponse.json({ error: 'CPF inválido (deve ter 11 dígitos)' }, { status: 400 });
    }

    // Valida email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    // Verificar se já existe usuário com mesmo email ou CPF
    const checkResult = await client.query(
      'SELECT id, email, cpf FROM usuarios WHERE email = $1 OR cpf = $2',
      [email, cpfLimpo]
    );

    if (checkResult.rows.length > 0) {
      const existing = checkResult.rows[0];
      console.error('[POST /api/usuarios] Duplicate found:', existing);
      return NextResponse.json(
        { error: `Já existe um usuário com este ${existing.email === email ? 'email' : 'CPF'}` },
        { status: 400 }
      );
    }

    // Criar novo usuário (sem especificar ID, deixa o banco gerar UUID)
    const insertResult = await client.query(
      `INSERT INTO usuarios (nome, email, cpf, categoria, status, ativo, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [nome, email.toLowerCase(), cpfLimpo, categoria || 'user', true, true]
    );

    const newUser = insertResult.rows[0];
    console.log('[POST /api/usuarios] User created successfully:', newUser.email);
    return NextResponse.json(newUser);
  } catch (error) {
    console.error('[POST /api/usuarios] Unexpected error:', error);
    
    // Verifica erro de duplicata (PostgreSQL code 23505)
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return NextResponse.json({ error: 'Usuário já existe' }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}

export async function DELETE(request: NextRequest) {
  const client = createDirectPgClient();
  
  try {
    // Accept either Authorization: Bearer <token> header or authToken cookie
    let token: string | undefined;
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      token = request.cookies.get('authToken')?.value;
    }
    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await client.connect();
    
    const userResult = await client.query(
      'SELECT categoria FROM usuarios WHERE email = $1',
      [payload.email]
    );

    if (userResult.rows.length === 0 || userResult.rows[0].categoria !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do usuário não fornecido' }, { status: 400 });
    }

    await client.query('DELETE FROM usuarios WHERE id = $1', [id]);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  } finally {
    await client.end();
  }
}