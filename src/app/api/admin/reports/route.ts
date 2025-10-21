import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { verifyToken } from '@/lib/jwt-server';
import pg from 'pg';

// Função para criar um cliente PostgreSQL usando DIRECT_URL (Session Pooler IPv4)
function createPgClient() {
  return new pg.Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
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

    // Usar datas como range diário na timezone de São Paulo (America/Sao_Paulo)
    const startDateStr = start; // formato YYYY-MM-DD
    const endDateStr = end;     // formato YYYY-MM-DD

    await client.connect();
    
    const query = `
      SELECT 
        l.id,
        l.usuario_id,
        l.login_em AT TIME ZONE 'America/Sao_Paulo' as login_em,
        l.logout_em AT TIME ZONE 'America/Sao_Paulo' as logout_em,
        l.tempo_logado,
        l.ip,
        l.navegador,
        l.created_at,
        u.nome as usuario_nome,
        u.email as usuario_email,
        u.cpf as usuario_cpf,
        u.categoria as usuario_categoria
      FROM logins l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      WHERE (l.login_em AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN $1::date AND $2::date
      ORDER BY l.login_em DESC
    `;
    
    const result = await client.query(query, [startDateStr, endDateStr]);
    const data = result.rows;

    // Deduplicação: remove logins repetidos próximos para o mesmo usuário
    // Critério: duas entradas com logout_em = null e diferença de login < 3min são consideradas duplicadas
    const deduped = (() => {
      const byUser: Record<string, any[]> = {};
      for (const row of data) {
        const uid = row.usuario_id;
        if (!byUser[uid]) byUser[uid] = [];
        const last = byUser[uid][byUser[uid].length - 1];
        const isClose = last
          ? Math.abs(new Date(row.login_em).getTime() - new Date(last.login_em).getTime()) < 3 * 60 * 1000
          : false;

        if (last && isClose) {
          // Resolver duplicatas próximas:
          // Preferir o registro com logout (mais completo). Caso ambos ativos, manter o mais recente (last).
          const lastHasLogout = !!last.logout_em;
          const rowHasLogout = !!row.logout_em;
          if (rowHasLogout && !lastHasLogout) {
            // Substitui pelo que tem logout
            byUser[uid][byUser[uid].length - 1] = row;
          } else {
            // Mantém o último (mais recente em ordenação DESC), não adiciona este
            continue;
          }
        } else {
          byUser[uid].push(row);
        }
      }
      return Object.values(byUser).flat();
    })();

    // Formata os dados para manter compatibilidade com o frontend
    const formattedData = deduped.map(row => ({
      id: row.id,
      usuario_id: row.usuario_id,
      login_em: row.login_em,
      logout_em: row.logout_em,
      tempo_logado: row.tempo_logado,
      ip: row.ip,
      navegador: row.navegador,
      created_at: row.created_at,
      usuarios: {
        nome: row.usuario_nome,
        email: row.usuario_email,
        cpf: row.usuario_cpf,
        categoria: row.usuario_categoria
      }
    }));

    // Consolida estatísticas por usuário
    const userStats = new Map<string, {
      usuario_id: string;
      nome: string;
      email: string;
      total_logins: number;
      ultimo_login: string;
      primeiro_login: string;
      tempo_total_logado: number;
    }>();

    for (const row of formattedData) {
      if (!row.usuario_id) continue;

      const existing = userStats.get(row.usuario_id);
      
      if (!existing) {
        userStats.set(row.usuario_id, {
          usuario_id: row.usuario_id,
          nome: row.usuarios.nome,
          email: row.usuarios.email,
          total_logins: 1,
          ultimo_login: row.login_em,
          primeiro_login: row.login_em,
          tempo_total_logado: row.tempo_logado || 0
        });
      } else {
        existing.total_logins++;
        existing.tempo_total_logado += row.tempo_logado || 0;
        
        // Atualiza primeiro/último login
        if (new Date(row.login_em) > new Date(existing.ultimo_login)) {
          existing.ultimo_login = row.login_em;
        }
        if (new Date(row.login_em) < new Date(existing.primeiro_login)) {
          existing.primeiro_login = row.login_em;
        }
      }
    }

    const consolidado = Array.from(userStats.values())
      .sort((a, b) => b.total_logins - a.total_logins); // Ordena por quantidade de logins

    // Adiciona informações de debug no response
    return NextResponse.json({
      data: formattedData,
      consolidado,
      debug: {
        startDate: startDateStr,
        endDate: endDateStr,
        totalRecords: formattedData.length,
        totalUsuarios: consolidado.length,
        timezone: 'America/Sao_Paulo'
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
