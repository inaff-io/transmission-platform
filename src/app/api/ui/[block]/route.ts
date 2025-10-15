import { NextRequest, NextResponse } from 'next/server';
import { createClientFromHeaders } from '@/lib/supabase/middleware';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyToken } from '@/lib/jwt-server';

type BlockKey =
  | 'login_header'
  | 'login_footer'
  | 'transmissao_header'
  | 'transmissao_footer'
  | 'help_contact';

const ALLOWED_BLOCKS = new Set<BlockKey>([
  'login_header',
  'login_footer',
  'transmissao_header',
  'transmissao_footer',
  'help_contact',
]);

function envFallback(block: BlockKey): string | null {
  // Map block to env var name, e.g., UI_LOGIN_HEADER_HTML
  const envKey = `UI_${block.toUpperCase()}_HTML` as const;
  const envs = process.env as Record<string, string | undefined>;
  return envs[envKey] ?? null;
}

function rewriteRelativeUrls(html: string): string {
  if (!html) return html;
  const base = (process.env.NEXT_PUBLIC_UIBLOCK_BASE_URL || process.env.UIBLOCK_BASE_URL || '').trim();
  if (!base) return html;
  const b = base.replace(/\/$/, '');
  return html
    // src="/path" or src='/path'
    .replace(/src=(\["])(\/(?!\/))/g, (_m, q) => `src=${q}${b}/`)
    // url(/path) or url('/path') or url("/path")
    .replace(/url\((['"]?)(\/(?!\/))/g, (_m, q) => `url(${q}${b}/`);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ block: string }> }
) {
  const { block } = await params;
  const b = (block || '').toLowerCase() as BlockKey;
  if (!ALLOWED_BLOCKS.has(b)) {
    return NextResponse.json({ error: 'Bloco inválido' }, { status: 400 });
  }

  try {
    const supabase = createClientFromHeaders(_req.headers);
    const { data, error } = await supabase
      .from('ui_blocks')
      .select('key, html, updated_at')
      .eq('key', b)
      .maybeSingle();

    if (error) {
      // Em qualquer erro de DB, responde com fallback de env para evitar 500 na UI
      const html = envFallback(b) || '';
      return NextResponse.json({ key: b, html, updated_at: null }, { status: 200 });
    }

  const stored = (data?.html ?? '').toString();
  const chosen = stored.trim().length > 0 ? stored : (envFallback(b) ?? '');
  const html = rewriteRelativeUrls(chosen);
    return NextResponse.json(
      {
        key: b,
        html,
        updated_at: data?.updated_at ?? null,
      },
      { status: 200 }
    );
  } catch {
  // Em último caso, tenta env (com reescrita de URLs relativas)
  const html = rewriteRelativeUrls(envFallback(b) || '');
    return NextResponse.json({ key: b, html, updated_at: null }, { status: 200 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ block: string }> }
) {
  const { block } = await params;
  const b = (block || '').toLowerCase() as BlockKey;
  if (!ALLOWED_BLOCKS.has(b)) {
    return NextResponse.json({ error: 'Bloco inválido' }, { status: 400 });
  }

  // Requer admin
  const token = req.cookies.get('authToken')?.value;
  if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  try {
    const payload = await verifyToken(token);
    if ((payload.categoria || '').toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const html: string = body?.html ?? '';

  try {
  const supabase = createAdminClient();
    const { error } = await supabase
      .from('ui_blocks')
      .upsert({ key: b, html, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) {
      const msg = String(error.message || '');
      if (
        error.code === '42P01' ||
        msg.includes('does not exist') ||
        (msg.includes('relation') && msg.includes('ui_blocks')) ||
        msg.toLowerCase().includes("could not find the table 'public.ui_blocks' in the schema cache") ||
        (msg.toLowerCase().includes('schema cache') && msg.toLowerCase().includes('ui_blocks'))
      ) {
        return NextResponse.json(
          {
            error: 'Tabela ui_blocks ausente. Crie a tabela no Supabase para salvar conteúdo.',
            hint:
              'CREATE TABLE public.ui_blocks (key text primary key, html text, updated_at timestamptz default now());',
          },
          { status: 501 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = (e as Error)?.message || 'Erro ao salvar';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
