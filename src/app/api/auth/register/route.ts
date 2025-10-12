import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { randomUUID } from 'crypto';
import { rateLimit, buildRateLimitHeaders } from '@/lib/utils/rateLimit';

type Body = {
	nome?: string;
	email?: string;
	cpf?: string;
	categoria?: 'admin' | 'user';
};

export async function POST(req: Request) {
	try {
		const headers = new Headers(req.headers);
		const ip = headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown';
		const key = `register:${ip}`;
		const { allowed, info } = rateLimit(key, 3, 300_000);
		if (!allowed) {
			const resp = NextResponse.json({ error: 'Muitas tentativas de cadastro. Tente novamente mais tarde.' }, { status: 429 });
			const rlHeaders = buildRateLimitHeaders(info);
			Object.entries(rlHeaders).forEach(([k, v]) => resp.headers.set(k, v));
			return resp;
		}

		const body = (await req.json()) as Body;
		const nome = (body.nome || '').trim();
		const email = (body.email || '').trim().toLowerCase();
		const cpf = (body.cpf || '').replace(/\D/g, '');
		const categoria = (body.categoria || 'user').toLowerCase() as 'admin' | 'user';

		if (!nome || !email || !cpf) {
			return NextResponse.json({ error: 'Nome, email e CPF são obrigatórios' }, { status: 400 });
		}

		if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
			return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
		}

		if (cpf.length < 11) {
			return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
		}

		const supabase = createAdminClient();

		// Verifica duplicidade por email ou CPF
		const { data: existing, error: findErr } = await supabase
			.from('usuarios')
			.select('*')
			.or(`email.eq.${email},cpf.eq.${cpf}`)
			.maybeSingle();

		if (findErr) {
			console.error('Erro ao buscar usuário existente:', findErr);
			// Continua mesmo assim para tentar inserir caso seja erro transitório
		}

		if (existing) {
			return NextResponse.json({ error: 'Usuário já cadastrado (email ou CPF existente)' }, { status: 409 });
		}

			// Gera um ID caso a tabela não tenha default para a coluna id
			const id = randomUUID();
			// Insere apenas colunas conhecidas universalmente para evitar drift (ex: categoria ausente)
			const { data: inserted, error: insertErr } = await supabase
				.from('usuarios')
				.insert({ id, nome, email, cpf })
				.select('*')
				.single();

		if (insertErr) {
			console.error('Erro ao inserir usuário:', insertErr);
			return NextResponse.json({ error: 'Falha ao criar usuário' }, { status: 500 });
		}

		return NextResponse.json(
			{
				success: true,
			message: categoria === 'admin' ? 'Administrador criado com sucesso' : 'Usuário criado com sucesso',
				user: { id: inserted.id, nome: inserted.nome, email: inserted.email, cpf: inserted.cpf, categoria: inserted.categoria }
			},
			{ status: 201 }
		);
	} catch (err) {
		console.error('Erro no POST /api/auth/register:', err);
		return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
	}
}

