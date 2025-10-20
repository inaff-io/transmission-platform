import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt-server';
import { createServerClient } from '@/lib/supabase/server';
import { createPgClient } from '@/lib/db/pg-client';

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

    const supabase = createServerClient();
    
    // Verifica se o usuário logado é admin
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('id, categoria, email')
      .eq('email', payload.email)
      .single();

    if (userError) {
      console.error('[POST /api/usuarios] Error fetching logged user:', userError);
      return NextResponse.json({ error: 'Erro ao verificar permissões' }, { status: 500 });
    }

    if (!user) {
      console.error('[POST /api/usuarios] Logged user not found:', payload.email);
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

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
    const { data: existingUsers, error: checkError } = await supabase
      .from('usuarios')
      .select('id, email, cpf')
      .or(`email.eq.${email},cpf.eq.${cpfLimpo}`);

    if (checkError) {
      console.error('[POST /api/usuarios] Error checking duplicates:', checkError);
    }

    if (existingUsers && existingUsers.length > 0) {
      const existing = existingUsers[0];
      console.error('[POST /api/usuarios] Duplicate found:', existing);
      return NextResponse.json(
        { error: `Já existe um usuário com este ${existing.email === email ? 'email' : 'CPF'}` },
        { status: 400 }
      );
    }

    // Gera ID único baseado no email
    const userId = email.split('@')[0].toLowerCase().replaceAll(/[^a-z0-9]/g, '_');

    // Criar novo usuário
    const { data: newUser, error } = await supabase
      .from('usuarios')
      .insert([{ 
        id: userId,
        nome, 
        email: email.toLowerCase(), 
        cpf: cpfLimpo, 
        categoria: categoria || 'user',
        status: true,
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('[POST /api/usuarios] Error creating user:', error);
      
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Usuário já existe (ID duplicado)' }, { status: 400 });
      }
      
      return NextResponse.json(
        { error: 'Erro ao criar usuário', details: error.message }, 
        { status: 500 }
      );
    }

    console.log('[POST /api/usuarios] User created successfully:', newUser.email);
    return NextResponse.json(newUser);
  } catch (error) {
    console.error('[POST /api/usuarios] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const supabase = createServerClient();
    const { data: user } = await supabase
      .from('usuarios')
      .select('categoria')
      .eq('email', payload.email)
      .single();

    if (user?.categoria !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do usuário não fornecido' }, { status: 400 });
    }

    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir usuário:', error);
      return NextResponse.json({ error: 'Erro ao excluir usuário' }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}