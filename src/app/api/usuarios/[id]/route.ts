import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt-server';
import pkg from 'pg';
const { Client } = pkg;
import { dbConfig } from '@/lib/db/config';

function createPgClient() {
  return new Client(dbConfig);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = createPgClient();
  
  try {
    const token = request.cookies.get('authToken')?.value;
    if (!token) {
      console.error('[GET /api/usuarios/[id]] No authToken cookie found');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload?.email) {
      console.error('[GET /api/usuarios/[id]] Invalid token payload');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('[GET /api/usuarios/[id]] User:', payload.email, 'requesting user:', params.id);

    await client.connect();
    
    // Verifica se o usuário logado é admin
    const userResult = await client.query(
      'SELECT id, categoria, email FROM usuarios WHERE email = $1',
      [payload.email]
    );

    if (userResult.rows.length === 0) {
      console.error('[GET /api/usuarios/[id]] Logged user not found:', payload.email);
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const user = userResult.rows[0];

    if (user.categoria !== 'admin') {
      console.error('[GET /api/usuarios/[id]] User is not admin:', user.categoria);
      return NextResponse.json({ error: 'Acesso negado: apenas admins podem editar usuários' }, { status: 403 });
    }

    // Busca o usuário a ser editado
    const usuarioResult = await client.query(
      'SELECT * FROM usuarios WHERE id = $1',
      [params.id]
    );

    if (usuarioResult.rows.length === 0) {
      console.error('[GET /api/usuarios/[id]] Target user not found:', params.id);
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const usuario = usuarioResult.rows[0];
    console.log('[GET /api/usuarios/[id]] Success! Returning user:', usuario.email);
    return NextResponse.json(usuario);
  } catch (error) {
    console.error('[GET /api/usuarios/[id]] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = createPgClient();
  
  try {
    const token = request.cookies.get('authToken')?.value;
    if (!token) {
      console.error('[PUT /api/usuarios/[id]] No authToken cookie found');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload?.email) {
      console.error('[PUT /api/usuarios/[id]] Invalid token payload');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('[PUT /api/usuarios/[id]] User:', payload.email, 'updating user:', params.id);

    await client.connect();
    
    // Verifica se o usuário logado é admin
    const userResult = await client.query(
      'SELECT id, categoria, email FROM usuarios WHERE email = $1',
      [payload.email]
    );

    if (userResult.rows.length === 0) {
      console.error('[PUT /api/usuarios/[id]] Logged user not found:', payload.email);
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const user = userResult.rows[0];

    if (user.categoria !== 'admin') {
      console.error('[PUT /api/usuarios/[id]] User is not admin:', user.categoria);
      return NextResponse.json({ error: 'Acesso negado: apenas admins podem editar usuários' }, { status: 403 });
    }

    const body = await request.json();
    const { nome, email, cpf, categoria } = body;

    console.log('[PUT /api/usuarios/[id]] Update data:', { nome, email, cpf, categoria });

    // Verifica se email ou CPF já existe em outro usuário
    const checkResult = await client.query(
      'SELECT id, email, cpf FROM usuarios WHERE (email = $1 OR cpf = $2) AND id != $3',
      [email, cpf, params.id]
    );

    if (checkResult.rows.length > 0) {
      console.error('[PUT /api/usuarios/[id]] Duplicate found:', checkResult.rows[0]);
      return NextResponse.json(
        { error: 'Email ou CPF já está em uso por outro usuário' },
        { status: 400 }
      );
    }

    // Atualiza o usuário
    const updateResult = await client.query(
      `UPDATE usuarios 
       SET nome = $1, email = $2, cpf = $3, categoria = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [nome, email, cpf, categoria, params.id]
    );

    if (updateResult.rows.length === 0) {
      console.error('[PUT /api/usuarios/[id]] User not found for update:', params.id);
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const updatedUser = updateResult.rows[0];
    console.log('[PUT /api/usuarios/[id]] Success! Updated user:', updatedUser.email);
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('[PUT /api/usuarios/[id]] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}