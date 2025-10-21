import { NextRequest, NextResponse } from 'next/server';
import pkg from 'pg';
const { Client } = pkg;
import { dbConfig } from '@/lib/db/config';

function createPgClient() {
  return new Client(dbConfig);
}

/**
 * API Pública para Inscrição de Novos Usuários
 * POST /api/inscricao
 * 
 * Não requer autenticação - permite que qualquer pessoa se inscreva no evento
 * MIGRADO: Agora usa PostgreSQL direto (sem Supabase Client)
 */
export async function POST(request: NextRequest) {
  const client = createPgClient();

  try {
    await client.connect();

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

    // Verifica se já existe usuário com este email ou CPF
    const checkResult = await client.query(
      'SELECT id, email, cpf FROM usuarios WHERE email = $1 OR cpf = $2',
      [email.toLowerCase(), cpfLimpo]
    );

    if (checkResult.rows.length > 0) {
      const existingUser = checkResult.rows[0];
      
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

    console.log('[POST /api/inscricao] Criando usuário (UUID automático)');

    // Cria novo usuário (UUID gerado automaticamente pelo banco)
    const insertResult = await client.query(
      `INSERT INTO usuarios (nome, email, cpf, categoria, status, ativo, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [
        nome.trim(),
        email.toLowerCase().trim(),
        cpfLimpo,
        'user', // Sempre usuário normal em inscrições públicas
        true,
        true
      ]
    );

    const newUser = insertResult.rows[0];
    console.log('[POST /api/inscricao] Inscrição criada com sucesso:', newUser.id);

    return NextResponse.json({
      message: 'Inscrição realizada com sucesso',
      userId: newUser.id,
    });
  } catch (error: any) {
    console.error('[POST /api/inscricao] Erro:', error);

    // Verifica se é erro de duplicata do PostgreSQL
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Email ou CPF já cadastrado' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao processar inscrição' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}
