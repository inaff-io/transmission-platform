import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt-server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const supabase = createServerClient();
    
    // Verifica se o usuário logado é admin
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('id, categoria, email')
      .eq('email', payload.email)
      .single();

    if (userError) {
      console.error('[GET /api/usuarios/[id]] Error fetching logged user:', userError);
      return NextResponse.json({ error: 'Erro ao verificar permissões' }, { status: 500 });
    }

    if (!user) {
      console.error('[GET /api/usuarios/[id]] Logged user not found:', payload.email);
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (user.categoria !== 'admin') {
      console.error('[GET /api/usuarios/[id]] User is not admin:', user.categoria);
      return NextResponse.json({ error: 'Acesso negado: apenas admins podem editar usuários' }, { status: 403 });
    }

    // Busca o usuário a ser editado
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('[GET /api/usuarios/[id]] Error fetching target user:', error);
      return NextResponse.json({ error: 'Erro ao buscar usuário' }, { status: 500 });
    }

    if (!usuario) {
      console.error('[GET /api/usuarios/[id]] Target user not found:', params.id);
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    console.log('[GET /api/usuarios/[id]] Success! Returning user:', usuario.email);
    return NextResponse.json(usuario);
  } catch (error) {
    console.error('[GET /api/usuarios/[id]] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const supabase = createServerClient();
    
    // Verifica se o usuário logado é admin
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('id, categoria, email')
      .eq('email', payload.email)
      .single();

    if (userError) {
      console.error('[PUT /api/usuarios/[id]] Error fetching logged user:', userError);
      return NextResponse.json({ error: 'Erro ao verificar permissões' }, { status: 500 });
    }

    if (!user) {
      console.error('[PUT /api/usuarios/[id]] Logged user not found:', payload.email);
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (user.categoria !== 'admin') {
      console.error('[PUT /api/usuarios/[id]] User is not admin:', user.categoria);
      return NextResponse.json({ error: 'Acesso negado: apenas admins podem editar usuários' }, { status: 403 });
    }

    const body = await request.json();
    const { nome, email, cpf, categoria } = body;

    console.log('[PUT /api/usuarios/[id]] Update data:', { nome, email, cpf, categoria });

    // Verifica se email ou CPF já existe em outro usuário
    const { data: existingUsers, error: checkError } = await supabase
      .from('usuarios')
      .select('id, email, cpf')
      .or(`email.eq.${email},cpf.eq.${cpf}`)
      .neq('id', params.id);

    if (checkError) {
      console.error('[PUT /api/usuarios/[id]] Error checking duplicates:', checkError);
    }

    if (existingUsers && existingUsers.length > 0) {
      console.error('[PUT /api/usuarios/[id]] Duplicate found:', existingUsers[0]);
      return NextResponse.json(
        { error: 'Email ou CPF já está em uso por outro usuário' },
        { status: 400 }
      );
    }

    // Atualiza o usuário
    const { data: updatedUser, error } = await supabase
      .from('usuarios')
      .update({ 
        nome, 
        email, 
        cpf, 
        categoria,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('[PUT /api/usuarios/[id]] Error updating user:', error);
      return NextResponse.json({ error: 'Erro ao atualizar usuário', details: error.message }, { status: 500 });
    }

    console.log('[PUT /api/usuarios/[id]] Success! Updated user:', updatedUser.email);
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('[PUT /api/usuarios/[id]] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}