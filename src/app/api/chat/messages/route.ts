import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt-server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);

    const supabase = createAdminClient();
    // Busca últimas 100 mensagens sem depender de relacionamento implícito
    const { data, error } = await supabase
      .from('chat')
      .select('id, mensagem, created_at, usuario_id')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('GET /api/chat/messages error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    const rows = data || [];
    const userIds = Array.from(new Set(rows.map((r: any) => r.usuario_id).filter(Boolean)));

    let usersMap: Record<string, { id: string; nome: string; categoria: string }> = {};
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('usuarios')
        .select('id, nome, categoria')
        .in('id', userIds);
      if (usersError) {
        console.error('GET /api/chat/messages usuarios fetch error:', usersError);
      } else {
        usersMap = (users || []).reduce((acc: Record<string, any>, u: any) => {
          acc[u.id] = { id: u.id, nome: u.nome, categoria: u.categoria };
          return acc;
        }, {});
      }
    }

    const messages = rows.map((row: any) => {
      const usuario = usersMap[row.usuario_id] || null;
      return {
        id: row.id,
        message: row.mensagem,
        createdAt: row.created_at,
        userId: row.usuario_id || null,
        userName: usuario?.nome || 'Desconhecido',
        categoria: usuario?.categoria || 'user',
      };
    });

    return NextResponse.json({ messages });
  } catch (err) {
    console.error('Unexpected error in GET /api/chat/messages:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);

    const body = await request.json();
    const message: string = (body?.message || '').toString().trim();
    if (!message) {
      return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 });
    }
    if (message.length > 500) {
      return NextResponse.json({ error: 'Mensagem muito longa (max 500)' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const newId = randomUUID();
    const { data, error } = await supabase
      .from('chat')
      .insert({ id: newId, usuario_id: payload.userId, mensagem: message, updated_at: new Date().toISOString() })
      .select('id, mensagem, created_at, usuario_id')
      .single();

    if (error) {
      console.error('POST /api/chat/messages error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    // Busca dados do usuário para retornar junto com a mensagem
    let usuarioNome = payload.nome;
    let usuarioCategoria = payload.categoria;
    const { data: usuarioData, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id, nome, categoria')
      .eq('id', payload.userId)
      .single();
    if (!usuarioError && usuarioData) {
      usuarioNome = usuarioData.nome || usuarioNome;
      usuarioCategoria = usuarioData.categoria || usuarioCategoria;
    }

    const newMessage = {
      id: data.id,
      message: data.mensagem,
      createdAt: data.created_at,
      userId: data.usuario_id || payload.userId,
      userName: usuarioNome,
      categoria: usuarioCategoria,
    };

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (err) {
    console.error('Unexpected error in POST /api/chat/messages:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    
    // Somente administradores podem limpar o chat
    if ((payload.categoria || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createAdminClient();
    // Deleta todas as mensagens (usa filtro amplo para evitar necessidade de TRUNCATE)
    const { data, error } = await supabase
      .from('chat')
      .delete()
      .not('id', 'is', null)
      .select('id');

    if (error) {
      console.error('DELETE /api/chat/messages error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    const deletedCount = Array.isArray(data) ? data.length : 0;
    return NextResponse.json({ success: true, deleted: deletedCount });
  } catch (err) {
    console.error('Unexpected error in DELETE /api/chat/messages:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}