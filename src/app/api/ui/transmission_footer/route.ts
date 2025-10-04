import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Legacy endpoint kept for backward compatibility. It now returns the same
// JSON shape as /api/ui/[block] with key/html/updated_at, reading from ui_blocks
// or falling back to env.

function envFallback(): string {
  const envs = process.env as Record<string, string | undefined>;
  return envs.UI_TRANSMISSAO_FOOTER_HTML || '';
}

function rewriteRelativeUrls(html: string): string {
  if (!html) return html;
  const base = (process.env.NEXT_PUBLIC_UIBLOCK_BASE_URL || process.env.UIBLOCK_BASE_URL || '').trim();
  if (!base) return html;
  const b = base.replace(/\/$/, '');
  return html
    .replace(/src=(["'])(\/(?!\/))/g, (_m, q) => `src=${q}${b}/`)
    .replace(/url\((["']?)(\/(?!\/))/g, (_m, q) => `url(${q}${b}/`);
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('ui_blocks')
      .select('key, html, updated_at')
      .eq('key', 'transmissao_footer')
      .maybeSingle();

    if (error) {
      const html = rewriteRelativeUrls(envFallback());
      return NextResponse.json({ key: 'transmissao_footer', html, updated_at: null });
    }

    const stored = (data?.html ?? '').toString();
    const chosen = stored.trim().length > 0 ? stored : envFallback();
    const html = rewriteRelativeUrls(chosen);
    return NextResponse.json({ key: 'transmissao_footer', html, updated_at: data?.updated_at ?? null });
  } catch {
    const html = rewriteRelativeUrls(envFallback());
    return NextResponse.json({ key: 'transmissao_footer', html, updated_at: null });
  }
}