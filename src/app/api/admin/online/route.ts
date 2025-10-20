import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { verifyToken } from '@/lib/jwt-server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (payload.categoria.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createServerClient();

    const now = new Date();
    // Considera online quem teve heartbeat nos últimos 180 segundos (compatível com intervalo de 2 minutos do heartbeat)
    const limite = new Date(now.getTime() - 180 * 1000).toISOString();

    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, email, last_active')
      .gte('last_active', limite)
      .order('last_active', { ascending: false });

    if (error) throw error;

    const users = (data || []).map(u => ({
      id: String(u.id),
      nome: u.nome as string,
      email: (u.email as string) || '',
      lastActive: u.last_active as string
    }));

    return NextResponse.json({ data: users });
  } catch (err) {
    console.error('GET /api/admin/online error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
