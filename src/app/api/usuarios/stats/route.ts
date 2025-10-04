import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt-server';
import { createClientFromHeaders } from '@/lib/supabase/middleware';

// Força modo dinâmico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface HistoricoAcesso {
  id: number;
  usuario_id: string;
  created_at: string;
  [key: string]: any;
}

interface Notificacao {
  id: number;
  usuario_id: string;
  created_at: string;
  lida: boolean;
  [key: string]: any;
}

// Função auxiliar para calcular estatísticas
const calcularEstatisticas = async (usuarioId: string, headers: Headers) => {
  const now = new Date();
  const umDiaAtrasISO = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const umaSemanaAtrasISO = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const supabase = createClientFromHeaders(headers);

  const { data: sessoesDia } = await supabase
    .from('sessoes')
    .select('duracao,iniciada_em,finalizada_em')
    .eq('usuario_id', usuarioId)
    .gte('iniciada_em', umDiaAtrasISO);

  const { data: sessoesSemana } = await supabase
    .from('sessoes')
    .select('duracao,iniciada_em,finalizada_em')
    .eq('usuario_id', usuarioId)
    .gte('iniciada_em', umaSemanaAtrasISO);

  const calc = (lista: any[] | null | undefined) => (lista || []).reduce((total, s) => total + (s.duracao || 0), 0);

  return {
  tempoTotalHoje: calc(sessoesDia),
  tempoTotalSemana: calc(sessoesSemana),
  numeroSessoesHoje: (sessoesDia || []).length,
  numeroSessoesSemana: (sessoesSemana || []).length
  };
};

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(token);
    const url = new URL(request.url);
    const tipo = url.searchParams.get('tipo') || 'historico';

    switch (tipo) {
      case 'historico': {        const supabase = createClientFromHeaders(request.headers);
        const { data: historicoRaw } = await supabase
          .from('historico_acessos')
          .select('*')
          .eq('usuario_id', payload.userId)
          .order('created_at', { ascending: false })
          .limit(50);
        const historico = (historicoRaw||[]).map((h: HistoricoAcesso) => ({
          ...h,
          createdAt: h.created_at
        }));
        return NextResponse.json({ data: historico });
      }

      case 'estatisticas': {
        const stats = await calcularEstatisticas(payload.userId, request.headers);
        return NextResponse.json({ data: stats });
      }

      case 'notificacoes': {
        const supabase = createClientFromHeaders(request.headers);
        const { data: notificacoesRaw } = await supabase
          .from('notificacoes')
          .select('*')
          .eq('usuario_id', payload.userId)
          .eq('lida', false)
          .order('created_at', { ascending: false });
        const notificacoes = (notificacoesRaw||[]).map((n: Notificacao) => ({
          ...n,
          createdAt: n.created_at
        }));
        return NextResponse.json({ data: notificacoes });
      }

      default:
        return NextResponse.json(
          { error: 'Tipo de consulta inválido' },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error('GET /api/usuarios/stats error:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
