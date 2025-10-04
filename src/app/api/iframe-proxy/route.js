import { NextResponse } from 'next/server';

export async function GET(request) {
  const targetUrl = 'https://inaff.iweventos.com.br/evento/atsmt2025/programacao/lista';
  
  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Origin': 'https://inaff.iweventos.com.br',
        'Referer': 'https://inaff.iweventos.com.br/',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
      },
      redirect: 'follow',
      mode: 'cors',
      credentials: 'include'
    });

    const contentType = response.headers.get('content-type') || 'text/plain';
    const content = await response.text();

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Erro no proxy:', error);
    return new NextResponse('Error fetching content', { status: 500 });
  }
}