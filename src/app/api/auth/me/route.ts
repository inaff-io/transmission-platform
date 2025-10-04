import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const token = cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('authToken='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);

    return NextResponse.json({
      id: payload.userId,
      nome: payload.nome,
      email: payload.email,
      cpf: '',
      categoria: payload.categoria,
      criado_em: ''
    });
  } catch (err) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
}
