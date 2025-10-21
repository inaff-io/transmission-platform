import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt-server';
import pkg from 'pg';
const { Client } = pkg;
import { dbConfig } from '@/lib/db/config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function createPgClient() {
  return new Client(dbConfig);
}

/**
 * API de Mensagens do Chat
 * GET: Buscar mensagens (últimas 100)
 * POST: Criar nova mensagem
 * DELETE: Limpar todas mensagens (admin only)
 * MIGRADO: Agora usa PostgreSQL direto (sem Supabase Client)
 */

export async function GET(request: NextRequest) {
  const client = createPgClient();

  try {
    await client.connect();

    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);

    // Busca últimas 100 mensagens
    const result = await client.query(
      'SELECT id, mensagem, created_at, usuario_id FROM chat ORDER BY created_at DESC LIMIT 100'
    );

    const rows = result.rows || [];
    const userIds = Array.from(new Set(rows.map((r: any) => r.usuario_id).filter(Boolean)));

    let usersMap: Record<string, { id: string; nome: string; categoria: string }> = {};
    
    if (userIds.length > 0) {
      const placeholders = userIds.map((_, i) => `$${i + 1}`).join(',');
      const usersResult = await client.query(
        `SELECT id, nome, categoria FROM usuarios WHERE id IN (${placeholders})`,
        userIds
      );
      
      usersMap = (usersResult.rows || []).reduce((acc: Record<string, any>, u: any) => {
        acc[u.id] = { id: u.id, nome: u.nome, categoria: u.categoria };
        return acc;
      }, {});
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
  } finally {
    await client.end();
  }
}

export async function POST(request: NextRequest) {
  const client = createPgClient();

  try {
    await client.connect();

    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);

    const body = await request.json();
    const message: string = (body?.message || '').toString().trim();
    
    if (!message) {
      return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 });
    }
    
    if (message.length > 500) {
      return NextResponse.json({ error: 'Mensagem muito longa (max 500)' }, { status: 400 });
    }

    // Insere nova mensagem (UUID gerado automaticamente)
    const insertResult = await client.query(
      `INSERT INTO chat (usuario_id, mensagem, updated_at, created_at)
       VALUES ($1, $2, NOW(), NOW())
       RETURNING id, mensagem, created_at, usuario_id`,
      [payload.userId, message]
    );

    const data = insertResult.rows[0];

    // Busca dados do usuário para retornar junto com a mensagem
    let usuarioNome = payload.nome;
    let usuarioCategoria = payload.categoria;

    const usuarioResult = await client.query(
      'SELECT id, nome, categoria FROM usuarios WHERE id = $1',
      [payload.userId]
    );

    if (usuarioResult.rows.length > 0) {
      const usuarioData = usuarioResult.rows[0];
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
  } finally {
    await client.end();
  }
}

export async function DELETE(request: NextRequest) {
  const client = createPgClient();

  try {
    await client.connect();

    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    // Somente administradores podem limpar o chat
    if ((payload.categoria || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Deleta todas as mensagens
    const deleteResult = await client.query(
      'DELETE FROM chat RETURNING id'
    );

    const deletedCount = deleteResult.rowCount || 0;
    
    return NextResponse.json({ success: true, deleted: deletedCount });
  } catch (err) {
    console.error('Unexpected error in DELETE /api/chat/messages:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    await client.end();
  }
}