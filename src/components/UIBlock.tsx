"use client";

import { useEffect, useState } from 'react';

type Props = Readonly<{
  block: 'login_header' | 'login_footer' | 'transmissao_header' | 'transmissao_footer' | 'help_contact';
  className?: string;
}>;

export default function UIBlock({ block, className }: Props) {
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const resp = await fetch(`/api/ui/${block}`, { cache: 'no-store', keepalive: true });
        if (!resp.ok) {
          if (mounted) setHtml('');
          return;
        }
        const ct = resp.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          if (mounted) setHtml('');
          return;
        }

        let data: unknown = null;
        try {
          data = await resp.json();
        } catch {
          if (mounted) setHtml('');
          return;
        }

        if (!mounted) return;

        const htmlField = (data as { html?: unknown })?.html;
        const raw = typeof htmlField === 'string' ? htmlField : '';
        const base = process.env.NEXT_PUBLIC_UIBLOCK_BASE_URL;
        let processed = raw;
        if (base && processed) {
          // Reescreve URLs relativas comuns (src="/.." e url(/..)) para absolutas com base
          const baseTrimmed = base.replace(/\/$/, '');
          const rewritten = processed
            .replace(/src=(["'])\/(?!\/)/g, `src=$1${baseTrimmed}/`)
            .replace(/url\((["']?)\/(?!\/)/g, `url($1${baseTrimmed}/`);
          processed = rewritten;
        }

        // Se o bloco usa background sem altura definida, injeta min-height para ficar visível
        if (/background/i.test(processed) && !/min-height\s*:/i.test(processed)) {
          processed = processed.replace(
            /style=(["'])([^"']*)\1/i,
            (m, q, styles) => {
              const sep = styles.trim().endsWith(';') || styles.trim().length === 0 ? '' : ';';
              return `style=${q}${styles}${sep} min-height:120px${q}`;
            }
          );
        }

        setHtml(processed);
      } catch (_err) {
        // Ignora erros para não poluir o console; evita abort manual para reduzir net::ERR_ABORTED
        if (mounted) setHtml('');
      }
    })();

    return () => {
      mounted = false;
    };
  }, [block]);

  if (!html) return null;

  return (
    <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
