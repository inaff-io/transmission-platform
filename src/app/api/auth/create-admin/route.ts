import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    // Dados do administrador Pedro Wagner
    const nome = 'Pedro Wagner';
    const email = 'pedro.wagner@example.com';
    const cpf = '98765432100';

    const supabase = createAdminClient();

    // Verifica se já existe um usuário com este email ou CPF
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('*')
      .or(`email.eq.${email},cpf.eq.${cpf}`)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Usuário já cadastrado' },
        { status: 400 }
      );
    }

    // Cria o usuário admin
    const { error: createError } = await supabase
      .from('usuarios')
      .insert([
        {
          email: email,
          nome: nome,
          cpf: cpf,
          categoria: 'admin'
        }
      ]);

    if (createError) {
      throw createError;
    }

    return NextResponse.json(
      { success: true, message: 'Administrador Pedro Costa criado com sucesso' },
      { status: 201 }
    );
  } catch (err) {
    console.error('Erro ao criar admin:', err);
    return NextResponse.json(
      { error: 'Erro ao criar administrador' },
      { status: 500 }
    );
  }
}
