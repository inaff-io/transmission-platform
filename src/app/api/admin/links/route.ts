import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/supabase/session';
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

const linkSchema = z.object({
  tipo: z.enum(['transmissao', 'programacao']),
  url: z.string(),
});

const buildSnippet = (url: string, tipo: string): string => {
  // Se já é um snippet HTML, retorna como está
  if (url.trim().startsWith('<div') || url.trim().startsWith('<iframe')) {
    return url.trim();
  }

  // Se for programação
  if (tipo === 'programacao') {
    // Se for URL do inaff, adiciona /embed no final se não tiver
    if (url.includes('inaff.iweventos.com.br')) {
      const cleanUrl = url.trim().replace(/\/+$/, ''); // Remove barras no final
      const embedUrl = cleanUrl + (cleanUrl.endsWith('/embed') ? '' : '/embed');
  return `<iframe src="${embedUrl}" style="width:100%; height:100%; border:none;" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"></iframe>`;
    }
    // Caso contrário, usa o modelo de iframe genérico
  return `<iframe src="${url}" style="width:100%; height:100%; border:none;" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"></iframe>`;
  }

  try {
    const videoUrl = new URL(url);
    
    // Vimeo
    if (videoUrl.hostname.includes('vimeo.com')) {
      // Se já é um ID do Vimeo, usa diretamente
      if (!videoUrl.pathname.includes('/')) {
  return `<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/${url}?h=&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" style="position:absolute;top:0;left:0;width:100%;height:100%;" title=""></iframe></div>`;
      }
      
      // Extrai ID do vídeo da URL
      const videoId = videoUrl.pathname.split('/')[1];
  return `<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/${videoId}?h=&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" style="position:absolute;top:0;left:0;width:100%;height:100%;" title=""></iframe></div>`;
    }
    
    // YouTube
    if (videoUrl.hostname.includes('youtube.com') || videoUrl.hostname === 'youtu.be') {
      let videoId = '';
      
      // youtube.com/watch?v=VIDEO_ID
      if (videoUrl.pathname === '/watch') {
        videoId = videoUrl.searchParams.get('v') || '';
      }
      // youtu.be/VIDEO_ID
      else if (videoUrl.hostname === 'youtu.be') {
        videoId = videoUrl.pathname.slice(1);
      }
      // youtube.com/embed/VIDEO_ID
      else if (videoUrl.pathname.startsWith('/embed/')) {
        videoId = videoUrl.pathname.split('/embed/')[1];
      }
      
      if (videoId) {
  return `<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" style="position:absolute;top:0;left:0;width:100%;height:100%;"></iframe></div>`;
      }
    }
    
    // Se não é Vimeo nem YouTube, retorna a URL como está
    return url;
  } catch {
    // Se não é uma URL válida, retorna como está
    return url;
  }
};

export async function GET(request: NextRequest) {
  const client = createPgClient();
  
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await client.connect();
    console.log('[Admin Links GET] Conectado ao PostgreSQL');
    
    // Busca todos os links da tabela unificada
    const result = await client.query(`
      SELECT 
        id,
        tipo,
        url,
        ativo_em,
        atualizado_em,
        created_at,
        updated_at
      FROM links
      ORDER BY created_at DESC
    `);
    
    console.log('[Admin Links GET] Links encontrados:', result.rows.length);

    const links = result.rows.map(link => ({
      id: link.id,
      tipo: link.tipo,
      url: link.url,
      titulo: link.tipo === 'transmissao' ? 'Transmissão' : 'Programação',
      created_at: link.created_at,
      ativo_em: link.ativo_em,
      atualizado_em: link.atualizado_em
    }));

    return NextResponse.json(links);
  } catch (error) {
    console.error('[Admin Links GET] Erro ao buscar links:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar links' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}

export async function POST(request: NextRequest) {
  const client = createPgClient();
  
  try {
    console.log('[Admin Links POST] Iniciando processamento');
    
    // Verifica autenticação
    const session = await getSession();
    console.log('[Admin Links POST] Status da sessão:', session ? 'Autenticado' : 'Não autenticado');
    
    if (!session?.user) {
      console.log('[Admin Links POST] Erro: Usuário não autenticado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Lê e valida o payload
    let payload;
    try {
      payload = await request.json();
      console.log('[Admin Links POST] Payload recebido:', payload);
    } catch (error) {
      console.error('[Admin Links POST] Erro ao ler payload:', error);
      return NextResponse.json({ error: 'Erro ao ler dados do formulário' }, { status: 400 });
    }
    
    try {
      const validatedData = linkSchema.parse(payload);
      console.log('[Admin Links POST] Dados validados:', validatedData);

      await client.connect();
      console.log('[Admin Links POST] Conectado ao PostgreSQL');

      // Normaliza a URL em snippet HTML se necessário
      const normalizedUrl = buildSnippet(validatedData.url, validatedData.tipo);
      console.log('[Admin Links POST] URL normalizada:', normalizedUrl.substring(0, 100) + '...');

      const now = new Date().toISOString();
      const linkId = crypto.randomUUID();

      // Insere na tabela links unificada
      console.log('[Admin Links POST] Inserindo na tabela links...');
      const result = await client.query(`
        INSERT INTO links (id, tipo, url, ativo_em, atualizado_em, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [linkId, validatedData.tipo, normalizedUrl, now, now, now, now]);

      console.log('[Admin Links POST] Link inserido com sucesso:', result.rows[0]);
      
      return NextResponse.json({
        id: result.rows[0].id,
        tipo: result.rows[0].tipo,
        url: result.rows[0].url,
        titulo: result.rows[0].tipo === 'transmissao' ? 'Transmissão' : 'Programação',
        created_at: result.rows[0].created_at,
        ativo_em: result.rows[0].ativo_em,
        atualizado_em: result.rows[0].atualizado_em
      });
    } catch (error) {
      console.error('[Admin Links POST] Erro na validação ou processamento:', error);
      if (error instanceof z.ZodError) {
        const firstIssueMessage = error.issues?.[0]?.message || 'Dados inválidos';
        return NextResponse.json({ error: 'Dados inválidos: ' + firstIssueMessage }, { status: 400 });
      }
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao processar dados' }, { status: 500 });
    }
  } catch (error) {
    console.error('[Admin Links POST] Erro ao processar requisição:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao salvar link' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}

export async function DELETE(request: NextRequest) {
  const client = createPgClient();
  
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID não fornecido' },
        { status: 400 }
      );
    }

    await client.connect();
    console.log('[Admin Links DELETE] Deletando link:', id);

    const result = await client.query(`
      DELETE FROM links WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Link não encontrado' },
        { status: 404 }
      );
    }

    console.log('[Admin Links DELETE] Link deletado com sucesso');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin Links DELETE] Erro ao deletar link:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar link' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}
