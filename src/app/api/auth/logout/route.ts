import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { verifyToken } from '@/lib/jwt-server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST() {
  // Tenta registrar logout antes de limpar cookie
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;
    if (token) {
      const payload = await verifyToken(token);
      const supabase = createAdminClient();
      // Atualiza o último login sem logout_em com o horário atual
      const nowIso = new Date().toISOString();
      const { data: lastLogin } = await supabase
        .from('logins')
        .select('id, login_em')
        .eq('usuario_id', payload.userId)
        .is('logout_em', null)
        .order('login_em', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastLogin) {
        const start = new Date(lastLogin.login_em);
        const end = new Date(nowIso);
        const tempo = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
        await supabase
          .from('logins')
          .update({ logout_em: nowIso, tempo_logado: tempo })
          .eq('id', lastLogin.id);
      }
    }
  } catch (e) {
    console.warn('Falha ao registrar logout:', e);
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set({
    name: 'authToken',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
