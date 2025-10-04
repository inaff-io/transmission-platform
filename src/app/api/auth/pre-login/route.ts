import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { identifier } = await request.json();

  // Verifica se o identificador é um email ou CPF
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  const isCPF = /^\d{11}$/.test(identifier);

  if (!isEmail && !isCPF) {
    return NextResponse.json(
      { error: 'Identificador inválido' },
      { status: 400 }
    );
  }

  try {
    let user;
    
    if (isEmail) {
      const { data } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', identifier)
        .single();
      user = data;
    } else {
      const { data } = await supabase
        .from('usuarios')
        .select('*')
        .eq('cpf', identifier)
        .single();
      user = data;
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Gera um link mágico de login
    const { data, error } = await supabase.auth.signInWithOtp({
      email: user.email,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao enviar link de login' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Link de acesso enviado para seu e-mail',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
