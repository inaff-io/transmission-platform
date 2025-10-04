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

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error:', error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    if (!usuario) {
      return new NextResponse('Not Found', { status: 404 });
    }

    return NextResponse.json(usuario);
  } catch (error) {
    console.error('Error fetching user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('authToken')?.value;
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

    // Check if email or CPF already exists for other users
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('*')
      .or(`email.eq.${email},cpf.eq.${cpf}`)
      .neq('id', params.id)
      .single();

    if (existingUser) {
      return new NextResponse(
        JSON.stringify({
          error: 'Email ou CPF já está em uso por outro usuário',
        }),
        { status: 400 }
      );
    }

    const { data: updatedUser, error } = await supabase
      .from('usuarios')
      .update({ nome, email, cpf, categoria })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error:', error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}