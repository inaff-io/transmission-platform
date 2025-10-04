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

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const startISO = startOfDay.toISOString();
    const endISO = endOfDay.toISOString();

    // Contar logins de hoje
    const { count: loginsHoje, error: loginsError } = await supabase
      .from('logins')
      .select('id', { count: 'exact', head: true })
      .gte('login_em', startISO)
      .lte('login_em', endISO);

    if (loginsError) throw loginsError;

    // Contar logouts de hoje
    const { count: logoutsHoje, error: logoutsError } = await supabase
      .from('logins')
      .select('id', { count: 'exact', head: true })
      .gte('logout_em', startISO)
      .lte('logout_em', endISO);

    if (logoutsError) throw logoutsError;

    return NextResponse.json({ 
      data: { 
        loginsHoje: loginsHoje || 0,
        logoutsHoje: logoutsHoje || 0
      } 
    });
  } catch (err) {
    console.error('GET /api/admin/logins error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
