import { NextResponse } from 'next/server';
import pg from 'pg';

// Função para criar um cliente PostgreSQL usando DATABASE_URL do .env
function createPgClient() {
  // Usa DIRECT_URL se disponível (melhor para Vercel/serverless)
  // ou DATABASE_URL como fallback
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  
  return new pg.Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    // Timeout de conexão para evitar espera longa
    connectionTimeoutMillis: 10000,
  });
}

interface PublicLink { id: string; tipo: 'transmissao' | 'programacao' | 'traducao'; url: string; ativo_em: string; atualizado_em: string; }
interface ProgramacaoRow { id: string; titulo: string; url_iframe: string; ordem: number; created_at: string; updated_at: string }

const mapProgramacao = (r: ProgramacaoRow, tipo: 'transmissao' | 'programacao' | 'traducao'): PublicLink => ({
  id: r.id,
  tipo,
  url: sanitizeIframeHtml(r.url_iframe) ?? r.url_iframe,
  ativo_em: r.created_at,
  atualizado_em: r.updated_at
});

async function fetchLinksTable(client: pg.Client) {
  // Prioriza o mais recente por atualizado_em, depois por ativo_em
  const result = await client.query(`
    SELECT * FROM links 
    ORDER BY 
      atualizado_em DESC NULLS LAST,
      ativo_em DESC NULLS LAST
  `);
  return result.rows;
}

async function fetchProgramacoes(client: pg.Client) {
  try {
    const result = await client.query(`
      SELECT id, titulo, url_iframe, ordem, created_at, updated_at 
      FROM programacoes 
      ORDER BY ordem DESC
    `);
    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar programações:', error);
    return [];
  }
}

interface RawLinkRow { id: string; tipo: string; url: string; ativo_em: string; atualizado_em?: string }

function sanitizeIframeHtml(html: string | undefined | null): string | undefined | null {
  if (!html) return html;
  return html.replace(/\sallowfullscreen(?:\s*=\s*(?:\"[^\"]*\"|'[^']*'|[^\s>]+))?/gi, '');
}

function normalizeTipo(raw: string | undefined | null): 'transmissao' | 'programacao' | 'traducao' | null {
  if (!raw) return null;
  const t = raw
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  if (t.startsWith('trans')) return 'transmissao';
  if (t.startsWith('progr')) return 'programacao';
  if (t.startsWith('trad')) return 'traducao';
  if (t === 'programacao') return 'programacao';
  if (t === 'transmissao') return 'transmissao';
  if (t === 'traducao') return 'traducao';
  return null;
}

function pickFromLinks(list: RawLinkRow[] | null | undefined) {
  let transmissao: PublicLink | null = null;
  let programacao: PublicLink | null = null;
  let traducao: PublicLink | null = null;
  list?.forEach(l => {
    const kind = normalizeTipo(l.tipo);
    if (!transmissao && kind === 'transmissao') {
      const cleaned = sanitizeIframeHtml(l.url);
      transmissao = { id: l.id, tipo: 'transmissao', url: cleaned ?? l.url, ativo_em: l.ativo_em, atualizado_em: l.atualizado_em ?? l.ativo_em };
    }
    if (!programacao && kind === 'programacao') {
      // Se a URL não é um iframe HTML, converte para iframe
      let url = l.url;
      if (url && !url.trim().startsWith('<iframe') && !url.trim().startsWith('<div')) {
  url = `<iframe src="${url}" style="width:100%; height:100%; border:none;" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"></iframe>`;
      }
      const cleanedProgramacao = sanitizeIframeHtml(url);
      programacao = { id: l.id, tipo: 'programacao', url: cleanedProgramacao ?? url, ativo_em: l.ativo_em, atualizado_em: l.atualizado_em ?? l.ativo_em };
    }
    if (!traducao && kind === 'traducao') {
      // Se a URL não é um iframe HTML, converte para iframe
      let url = l.url;
      if (url && !url.trim().startsWith('<iframe') && !url.trim().startsWith('<div')) {
  url = `<iframe src="${url}" style="width:100%; height:100%; border:none;" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"></iframe>`;
      }
      const cleanedTraducao = sanitizeIframeHtml(url);
      traducao = { id: l.id, tipo: 'traducao', url: cleanedTraducao ?? url, ativo_em: l.ativo_em, atualizado_em: l.atualizado_em ?? l.ativo_em };
    }
  });
  return { transmissao, programacao, traducao };
}

function fallbackFromProgramacoes(rows: ProgramacaoRow[] | null | undefined, existing: { transmissao: PublicLink | null; programacao: PublicLink | null; traducao: PublicLink | null }) {
  let source: 'links' | 'programacoes' | 'mixed' = 'links';
  let { transmissao, programacao, traducao } = existing;
  if (!rows) return { transmissao, programacao, traducao, source };
  const list = rows.slice();
  // Preferências por título quando disponíveis
  if (!transmissao) {
    const t = list.find(r => r.titulo?.toLowerCase().startsWith('trans')) || list[0];
    if (t) {
      transmissao = mapProgramacao(t, 'transmissao');
      source = existing.programacao ? 'mixed' : 'programacoes';
    }
  }
  if (!programacao) {
    const p = list.find(r => r.titulo?.toLowerCase().startsWith('progr')) || list.find(r => !transmissao || r.id !== transmissao.id);
    if (p) {
      programacao = mapProgramacao(p, 'programacao');
      if (transmissao && !existing.transmissao) source = 'mixed';
      else if (source === 'links') source = 'programacoes';
    }
  }
  if (!traducao) {
    const trad = list.find(r => r.titulo?.toLowerCase().startsWith('trad')) || list.find(r => (!transmissao || r.id !== transmissao.id) && (!programacao || r.id !== programacao.id));
    if (trad) {
      traducao = mapProgramacao(trad, 'traducao');
      if ((transmissao && !existing.transmissao) || (programacao && !existing.programacao)) source = 'mixed';
      else if (source === 'links') source = 'programacoes';
    }
  }
  return { transmissao, programacao, traducao, source };
}

// Normalize certain programacao URLs to their embeddable variant
function ensureProgramacaoEmbed(url: string | undefined | null): string | undefined | null {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    // Already embeddable if pathname contains '/programacao/lista/embed' (with or without trailing slash)
    const alreadyEmbed = /\/programacao\/lista\/embed(\/|$)/.test(parsed.pathname);
    if (parsed.pathname.includes('/programacao/lista/') && !alreadyEmbed) {
      parsed.pathname = parsed.pathname.replace('/programacao/lista/', '/programacao/lista/embed/');
      return parsed.toString();
    }
    return url;
  } catch {
    // Fallback for non-URL strings (e.g., full iframe HTML)
    // Replace only when the path segment after '/programacao/lista/' does NOT start with 'embed'
    const replaced = url.replace(/(\/programacao\/lista\/)((?!embed).*)/g, (_m, pre, post) => `${pre}embed/${post}`);
    return replaced;
  }
}

function sanitizeLink(link: PublicLink | null): PublicLink | null {
  if (!link?.url) return link;
  const cleaned = sanitizeIframeHtml(link.url);
  if (!cleaned || cleaned === link.url) return link;
  return { ...link, url: cleaned };
}

export async function GET() {
  const client = createPgClient();
  
  try {
    await client.connect();
    console.log('[Links Active] Cliente PostgreSQL conectado');
    
    const linksData = await fetchLinksTable(client);
    console.log('[Links Active] Links encontrados no banco:', linksData.length);
    console.log('[Links Active] Dados dos links:', JSON.stringify(linksData, null, 2));
    
    const picked = pickFromLinks(linksData || []);
    console.log('[Links Active] Links selecionados:', picked);
    let source: 'links' | 'programacoes' | 'mixed' = picked.transmissao || picked.programacao ? 'links' : 'programacoes';
    
    const progList = await fetchProgramacoes(client);
    const fb = fallbackFromProgramacoes(progList, picked);

    // Ensure programacao uses embeddable url when applicable
    if (fb.programacao?.url) {
      const normalized = ensureProgramacaoEmbed(fb.programacao.url);
      if (normalized && normalized !== fb.programacao.url) {
        fb.programacao = { ...fb.programacao, url: normalized };
      }
    }

    // Fallback final via ENV se ainda não houver nada
    if (!fb.transmissao || !fb.programacao) {
      const envs = process.env as Record<string, string | undefined>;
      const envTrans = envs.NEXT_PUBLIC_FALLBACK_TRANSMISSAO_URL || envs.FALLBACK_TRANSMISSAO_URL || '';
      const envProg = envs.NEXT_PUBLIC_FALLBACK_PROGRAMACAO_URL || envs.FALLBACK_PROGRAMACAO_URL || '';
      const envTrad = envs.NEXT_PUBLIC_FALLBACK_TRADUCAO_URL || envs.FALLBACK_TRADUCAO_URL || '';
      if (!fb.transmissao && envTrans) {
        fb.transmissao = { id: 'env-trans', tipo: 'transmissao', url: envTrans, ativo_em: new Date().toISOString(), atualizado_em: new Date().toISOString() };
        fb.source = fb.programacao ? 'mixed' : 'programacoes';
      }
      if (!fb.programacao && envProg) {
        const normalizedEnv = ensureProgramacaoEmbed(envProg) || envProg;
        fb.programacao = { id: 'env-prog', tipo: 'programacao', url: normalizedEnv, ativo_em: new Date().toISOString(), atualizado_em: new Date().toISOString() };
        fb.source = fb.transmissao ? 'mixed' : 'programacoes';
      }
      if (!fb.traducao && envTrad) {
        fb.traducao = { id: 'env-trad', tipo: 'traducao', url: envTrad, ativo_em: new Date().toISOString(), atualizado_em: new Date().toISOString() };
        fb.source = fb.transmissao || fb.programacao ? 'mixed' : 'programacoes';
      }
    }
    if (picked.transmissao !== fb.transmissao || picked.programacao !== fb.programacao) {
      if (picked.transmissao && picked.programacao) source = 'links';
      else source = fb.source;
    }
      const transmissaoSanitized = sanitizeLink(fb.transmissao);
      const programacaoSanitized = sanitizeLink(fb.programacao);
      const traducaoSanitized = sanitizeLink(fb.traducao);
      
      const response = NextResponse.json({ transmissao: transmissaoSanitized, programacao: programacaoSanitized, traducao: traducaoSanitized, source });
      
      // Headers para desabilitar cache completamente
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      return response;
  } catch (err) {
    console.error('GET /api/links/active error:', err);
    // Último fallback: responder com ENV para evitar UI vazia
    const envs = process.env as Record<string, string | undefined>;
    const envTrans = envs.NEXT_PUBLIC_FALLBACK_TRANSMISSAO_URL || envs.FALLBACK_TRANSMISAO_URL || envs.FALLBACK_TRANSMISSAO || '';
    const envProg = envs.NEXT_PUBLIC_FALLBACK_PROGRAMACAO_URL || envs.FALLBACK_PROGRAMACAO_URL || envs.FALLBACK_PROGRAMACAO || '';
    const envTrad = envs.NEXT_PUBLIC_FALLBACK_TRADUCAO_URL || envs.FALLBACK_TRADUCAO_URL || envs.FALLBACK_TRADUCAO || '';
    const now = new Date().toISOString();
    const transmissao = envTrans ? sanitizeLink({ id: 'env-trans', tipo: 'transmissao', url: envTrans, ativo_em: now, atualizado_em: now }) : null;
    const programacaoUrl = ensureProgramacaoEmbed(envProg) || envProg;
    const programacao = envProg ? sanitizeLink({ id: 'env-prog', tipo: 'programacao', url: programacaoUrl, ativo_em: now, atualizado_em: now }) : null;
    const traducao = envTrad ? sanitizeLink({ id: 'env-trad', tipo: 'traducao', url: envTrad, ativo_em: now, atualizado_em: now }) : null;
    
    const errorResponse = NextResponse.json({ transmissao, programacao, traducao, source: 'env' }, { status: 200 });
    
    // Headers para desabilitar cache completamente (também no erro)
    errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    errorResponse.headers.set('Pragma', 'no-cache');
    errorResponse.headers.set('Expires', '0');
    
    return errorResponse;
  } finally {
    await client.end();
  }
}
