import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { verifyToken } from '@/lib/jwt-server';
import { getHistoricoAcessos, getSessoes, getUsuarios, getLogins } from '@/lib/db/relatorios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ExportType = 'acessos' | 'sessoes' | 'usuarios' | 'logins';

const formatarData = (data: Date | string | null) => {
  if (!data) return '-';
  return format(new Date(data), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
};

const formatarDuracao = (segundos: number | null) => {
  if (!segundos) return '-';
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  return `${horas}h ${minutos}m`;
};

const gerarCSV = (data: any[], headers: Record<string, string>) => {
  const headerRow = Object.values(headers).join(',') + '\n';
  const rows = data.map(item => {
    return Object.keys(headers)
      .map(key => {
        const value = item[key]?.toString().replace(/,/g, ';') || '';
        return `"${value}"`;
      })
      .join(',');
  }).join('\n');
  return headerRow + rows;
};

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = await verifyToken(token);
    
    if (decoded.categoria !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') as ExportType;
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    if (!tipo) {
      return NextResponse.json(
        { error: 'Tipo de relatório não especificado' },
        { status: 400 }
      );
    }

    console.log('[Relatórios] Gerando relatório:', { tipo, dataInicio, dataFim });

    let data: any[] = [];
    let headers: Record<string, string> = {};
    let filename = '';

    switch (tipo) {
      case 'acessos': {
        const raw = await getHistoricoAcessos(dataInicio || undefined, dataFim || undefined);
        headers = {
          'usuario_nome': 'Nome do Usuário',
          'usuario_email': 'Email',
          'acao': 'Ação',
          'ip': 'IP',
          'user_agent': 'Navegador',
          'created_at': 'Data/Hora'
        };
        data = raw.map(item => ({
          usuario_nome: item.usuario_nome || '-',
          usuario_email: item.usuario_email || '-',
          acao: item.acao,
          ip: item.ip || '-',
          user_agent: item.user_agent || '-',
          created_at: formatarData(item.created_at)
        }));
        filename = `historico-acessos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        break;
      }
      case 'sessoes': {
        const raw = await getSessoes(dataInicio || undefined, dataFim || undefined);
        headers = {
          'usuario_nome': 'Nome do Usuário',
          'usuario_email': 'Email',
          'iniciada_em': 'Início',
          'finalizada_em': 'Fim',
          'duracao': 'Duração'
        };
        data = raw.map(item => ({
          usuario_nome: item.usuario_nome || '-',
          usuario_email: item.usuario_email || '-',
          iniciada_em: formatarData(item.iniciada_em),
          finalizada_em: formatarData(item.finalizada_em),
          duracao: formatarDuracao(item.duracao)
        }));
        filename = `sessoes-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        break;
      }
      case 'logins': {
        const raw = await getLogins(dataInicio || undefined, dataFim || undefined);
        headers = {
          'usuario_nome': 'Nome do Usuário',
          'usuario_email': 'Email',
          'usuario_categoria': 'Categoria',
          'login_em': 'Login',
          'logout_em': 'Logout',
          'status': 'Status'
        };
        data = raw.map(item => ({
          usuario_nome: item.usuario_nome || '-',
          usuario_email: item.usuario_email || '-',
          usuario_categoria: item.usuario_categoria || '-',
          login_em: formatarData(item.login_em),
          logout_em: formatarData(item.logout_em),
          status: item.logout_em ? 'Encerrada' : 'Ativa'
        }));
        filename = `logins-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        break;
      }
      case 'usuarios': {
        const raw = await getUsuarios(dataInicio || undefined, dataFim || undefined);
        headers = {
          'nome': 'Nome',
          'email': 'Email',
          'cpf': 'CPF',
          'categoria': 'Categoria',
          'last_active': 'Último Acesso',
          'created_at': 'Data de Cadastro'
        };
        data = raw.map(item => ({
          nome: item.nome,
          email: item.email,
          cpf: item.cpf,
          categoria: item.categoria,
          last_active: formatarData(item.last_active),
          created_at: formatarData(item.created_at)
        }));
        filename = `usuarios-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        break;
      }
      default:
        return NextResponse.json(
          { error: 'Tipo de relatório inválido' },
          { status: 400 }
        );
    }

    console.log('[Relatórios] Relatório gerado com sucesso:', { 
      tipo, 
      registros: data.length,
      filename 
    });

    const csv = gerarCSV(data, headers);
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (err: any) {
    console.error('[Relatórios] Erro ao gerar relatório:', err);
    return NextResponse.json(
      { 
        error: 'Erro ao gerar relatório',
        details: err.message || 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}
