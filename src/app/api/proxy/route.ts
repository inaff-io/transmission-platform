import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Pegar a URL da query string
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL não fornecida' }, { status: 400 });
  }

  try {
    // Fazer fetch da página com os headers corretos
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    // Se não for 2xx, retorna erro
    if (!response.ok) {
      return NextResponse.json({ error: 'Erro ao carregar página' }, { status: response.status });
    }

    // Pegar o conteúdo HTML
    const html = await response.text();

    // Retornar o HTML
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Erro ao fazer proxy:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}