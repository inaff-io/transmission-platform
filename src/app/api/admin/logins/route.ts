import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pkg from 'pg';
const { Client } = pkg;
import { dbConfig } from '@/lib/db/config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { verifyToken } from '@/lib/jwt-server';

function createPgClient() {
  return new Client(dbConfig);
}

/**
 * API para Relatório de Logins (Admin)
 * GET /api/admin/logins
 * 
 * Retorna estatísticas de logins e logouts do dia
 * MIGRADO: Agora usa PostgreSQL direto (sem Supabase Client)
 */
export async function GET() {
  const client = createPgClient();

  try {
    await client.connect();

    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    if (payload.categoria.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Define início e fim do dia
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const startISO = startOfDay.toISOString();
    const endISO = endOfDay.toISOString();

    // Contar logins de hoje
    const loginsResult = await client.query(
      'SELECT COUNT(*) as count FROM logins WHERE login_em >= $1 AND login_em <= $2',
      [startISO, endISO]
    );

    // Contar logouts de hoje
    const logoutsResult = await client.query(
      'SELECT COUNT(*) as count FROM logins WHERE logout_em >= $1 AND logout_em <= $2',
      [startISO, endISO]
    );

    const loginsHoje = parseInt(loginsResult.rows[0].count, 10) || 0;
    const logoutsHoje = parseInt(logoutsResult.rows[0].count, 10) || 0;

    return NextResponse.json({ 
      data: { 
        loginsHoje,
        logoutsHoje
      } 
    });
  } catch (err) {
    console.error('GET /api/admin/logins error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    await client.end();
  }
}
