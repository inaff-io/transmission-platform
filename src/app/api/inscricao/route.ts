import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * API Pública para Inscrição de Novos Usuários
 * POST /api/inscricao
 * 
 * Não requer autenticação - permite que qualquer pessoa se inscreva no evento
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, email, cpf } = body;

    console.log('[POST /api/inscricao] Nova inscrição:', { nome, email, cpf: cpf?.substring(0, 3) + '***' });

    // Validações básicas
    if (!nome || !email || !cpf) {
      return NextResponse.json(
        { error: 'Nome, email e CPF são obrigatórios' },
        { status: 400 }
      );
    }

    // Valida formato do nome
    if (nome.trim().length < 3) {
      return NextResponse.json(
        { error: 'Nome deve ter pelo menos 3 caracteres' },
        { status: 400 }
      );
    }

    // Valida formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Limpa e valida CPF
    const cpfLimpo = cpf.replaceAll(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      return NextResponse.json(
        { error: 'CPF deve conter 11 dígitos' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Verifica se já existe usuário com este email ou CPF
    const { data: existingUser, error: checkError } = await supabase
      .from('usuarios')
      .select('id, email, cpf')
      .or(`email.eq.${email.toLowerCase()},cpf.eq.${cpfLimpo}`)
      .maybeSingle();

    if (checkError) {
      console.error('[POST /api/inscricao] Erro ao verificar duplicatas:', checkError);
      return NextResponse.json(
        { error: 'Erro ao verificar dados' },
        { status: 500 }
      );
    }

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return NextResponse.json(
          { error: 'Email já cadastrado' },
          { status: 409 }
        );
      }
      if (existingUser.cpf === cpfLimpo) {
        return NextResponse.json(
          { error: 'CPF já cadastrado' },
          { status: 409 }
        );
      }
    }

    // Gera ID único a partir do email
    const userId = email
      .split('@')[0]
      .toLowerCase()
      .replaceAll(/[^a-z0-9]/g, '_');

    console.log('[POST /api/inscricao] Criando usuário:', userId);

    // Cria novo usuário
    const { data: newUser, error: insertError } = await supabase
      .from('usuarios')
      .insert({
        id: userId,
        nome: nome.trim(),
        email: email.toLowerCase().trim(),
        cpf: cpfLimpo,
        categoria: 'user', // Sempre usuário normal em inscrições públicas
        status: true,
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('[POST /api/inscricao] Erro ao criar usuário:', insertError);
      
      // Verifica se é erro de duplicata (pode ocorrer se ID gerado já existe)
      if (insertError.code === '23505') {
        // Gera ID alternativo adicionando timestamp
        const alternativeId = `${userId}_${Date.now().toString().slice(-6)}`;
        console.log('[POST /api/inscricao] Tentando ID alternativo:', alternativeId);
        
        const { data: retryUser, error: retryError } = await supabase
          .from('usuarios')
          .insert({
            id: alternativeId,
            nome: nome.trim(),
            email: email.toLowerCase().trim(),
            cpf: cpfLimpo,
            categoria: 'user',
            status: true,
            ativo: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (retryError) {
          console.error('[POST /api/inscricao] Erro na segunda tentativa:', retryError);
          return NextResponse.json(
            { error: 'Erro ao criar inscrição. Tente novamente.' },
            { status: 500 }
          );
        }

        console.log('[POST /api/inscricao] Usuário criado com sucesso (ID alternativo):', alternativeId);
        return NextResponse.json({
          message: 'Inscrição realizada com sucesso',
          userId: retryUser.id,
        });
      }

      return NextResponse.json(
        { error: 'Erro ao criar inscrição' },
        { status: 500 }
      );
    }

    console.log('[POST /api/inscricao] Inscrição criada com sucesso:', newUser.id);

    return NextResponse.json({
      message: 'Inscrição realizada com sucesso',
      userId: newUser.id,
    });
  } catch (error) {
    console.error('[POST /api/inscricao] Erro geral:', error);
    return NextResponse.json(
      { error: 'Erro ao processar inscrição' },
      { status: 500 }
    );
  }
}
