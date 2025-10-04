import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { verifyToken } from '@/lib/jwt-server';
import pg from 'pg';

// Função para criar um cliente PostgreSQL
function createPgClient() {
  return new pg.Client({
    user: 'postgres.apamlthhsppsjvbxzouv',
    password: 'Sucesso@1234',
    host: 'aws-1-sa-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    }
  });
}

export async function GET(request: Request) {
  const client = createPgClient();
  
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(token);
    if (payload.categoria.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const start = url.searchParams.get('start') || '';
    const end = url.searchParams.get('end') || '';

    if (!start || !end) {
      return NextResponse.json({ error: 'Data inicial e final são obrigatórias' }, { status: 400 });
    }

    // Ajusta as datas para incluir o dia completo
    const startDate = new Date(start);
    startDate.setUTCHours(0, 0, 0, 0);
    
    const endDate = new Date(end);
    endDate.setUTCHours(23, 59, 59, 999);

    await client.connect();
    
    const query = `
      SELECT 
        l.id,
        l.usuario_id,
        l.login_em,
        l.logout_em,
        l.created_at,
        u.nome as usuario_nome,
        u.email as usuario_email,
        u.cpf as usuario_cpf,
        u.categoria as usuario_categoria
      FROM logins l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      WHERE l.login_em >= $1 AND l.login_em <= $2
      ORDER BY l.login_em DESC
    `;
    
    const result = await client.query(query, [startDate.toISOString(), endDate.toISOString()]);
    const data = result.rows;

    // Formata os dados para manter compatibilidade com o frontend
    const formattedData = data.map(row => ({
      id: row.id,
      usuario_id: row.usuario_id,
      login_em: row.login_em,
      logout_em: row.logout_em,
      created_at: row.created_at,
      usuarios: {
        nome: row.usuario_nome,
        email: row.usuario_email,
        cpf: row.usuario_cpf,
        categoria: row.usuario_categoria
      }
    }));

    // Adiciona informações de debug no response
    return NextResponse.json({
      data: formattedData,
      debug: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalRecords: formattedData.length
      }
    });
  } catch (err) {
    console.error('GET /api/admin/reports error:', err);
    return NextResponse.json({
      error: 'Erro ao gerar relatório',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  } finally {
    await client.end();
  }
}
