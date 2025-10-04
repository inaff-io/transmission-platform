import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt-server';
import { createServerClient } from '@/lib/supabase/server';

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

    const supabase = createServerClient();
    const { data: user } = await supabase
      .from('usuarios')
      .select('categoria')
      .eq('email', payload.email)
      .single();

    if (!user?.categoria?.includes('admin')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar usuários:', error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    return NextResponse.json(usuarios);
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

    if (!user?.categoria?.includes('admin')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await request.json();
    const { nome, email, cpf, categoria } = body;

    // Verificar se já existe usuário com mesmo email ou CPF
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('*')
      .or(`email.eq.${email},cpf.eq.${cpf}`)
      .single();

    if (existingUser) {
      return new NextResponse(
        JSON.stringify({
          error: 'Já existe um usuário com este email ou CPF',
        }),
        { status: 400 }
      );
    }

    // Criar novo usuário
    const { data: newUser, error } = await supabase
      .from('usuarios')
      .insert([{ nome, email, cpf, categoria }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar usuário:', error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    return NextResponse.json(newUser);
  } catch (error) {
    console.error('Erro:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
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

    if (!user?.categoria?.includes('admin')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse('Bad Request', { status: 400 });
    }

    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir usuário:', error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erro:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}