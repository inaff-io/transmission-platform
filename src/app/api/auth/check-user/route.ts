import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const email = 'pedro.costa@example.com';
    const cpf = '12345678900';

    const supabase = createAdminClient();

    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .or(`email.eq.${email},cpf.eq.${cpf}`)
      .single();

    if (error) {
      throw error;
    }

    if (!user) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Usuário encontrado',
      user: {
        nome: user.nome,
        email: user.email,
        cpf: user.cpf,
        categoria: user.categoria
      }
    });

  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    return NextResponse.json(
      { error: 'Erro ao buscar usuário' },
      { status: 500 }
    );
  }
}
