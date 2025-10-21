import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pkg from 'pg';
const { Client } = pkg;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { verifyToken } from '@/lib/jwt-server';
import { dbConfig } from '@/lib/db/config';

// Helper para criar cliente PostgreSQL
function createPgClient() {
  return new Client(dbConfig);
}

export async function GET() {
  const client = createPgClient();
  
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (payload.categoria.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await client.connect();

    const now = new Date();
    // Considera online quem teve heartbeat nos últimos 180 segundos (compatível com intervalo de 2 minutos do heartbeat)
    const limite = new Date(now.getTime() - 180 * 1000);

    const result = await client.query(
      `SELECT id, nome, email, last_active 
       FROM usuarios 
       WHERE last_active >= $1 
       ORDER BY last_active DESC`,
      [limite]
    );

    const users = result.rows.map(u => ({
      id: String(u.id),
      nome: u.nome,
      email: u.email || '',
      lastActive: u.last_active
    }));

    return NextResponse.json({ data: users });
  } catch (err) {
    console.error('GET /api/admin/online error:', err);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await client.end();
  }
}
