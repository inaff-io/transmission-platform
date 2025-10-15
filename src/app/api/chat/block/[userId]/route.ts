import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt-server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Bloqueia um usuário do sistema (marca status = false)
export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload.categoria || payload.categoria.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createAdminClient();
    const { data: user, error: userErr } = await supabase
      .from('usuarios')
      .select('id, status')
      .eq('id', params.userId)
      .single();

    if (userErr || !user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const { error } = await supabase
      .from('usuarios')
      .update({ status: false, updated_at: new Date().toISOString() })
      .eq('id', params.userId);

    if (error) {
      console.error('POST /api/chat/block/[userId] error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, userId: params.userId });
  } catch (err) {
    console.error('Unexpected error in POST /api/chat/block/[userId]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}