import { NextResponse } from 'next/server';
import { performLogin } from '@/lib/auth/login';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { email, cpf } = data;

    console.log('Tentativa de login com:', { email, cpf });

    if (!email && !cpf) {
      return NextResponse.json(
        { error: 'Digite seu e-mail ou CPF' },
        { status: 400 }
      );
    }

  const result = await performLogin({ email, cpf, mode: 'any' });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: result.status || 400 }
      );
    }

    const response = NextResponse.json(
      {
        success: true,
        redirectUrl: result.redirectUrl,
        user: result.user
      },
      { status: 200 }
    );

    response.cookies.set({
      name: 'authToken',
      value: result.token!,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24
    });

    // Registra login no relatório (tabela logins)
    try {
      const supabase = createAdminClient();
      const headers = new Headers(request.headers);
      const userAgent = headers.get('user-agent') || 'unknown';
      const ip = headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown';
      if (result.user?.id) {
        await supabase.from('logins').insert({
          usuario_id: result.user.id,
          ip: String(ip),
          navegador: userAgent
        });
      }
    } catch (e) {
      console.warn('Falha ao registrar login em logins:', e);
    }

    return response;
  } catch (err) {
    console.error('Erro no login:', err);
    return NextResponse.json(
      { 
        error: 'Erro ao fazer login',
        details: err instanceof Error ? err.message : String(err)
      },
      { status: 500 }
    );
  }
}
