import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

/**
 * GET - Servir a imagem do logo (rota pública)
 * Esta rota serve o arquivo PNG diretamente para o navegador
 */
export async function GET() {
  try {
    const logoPath = join(process.cwd(), 'public', 'upload', 'evento', 'logo', 'doHKepqoQ8RtQMW5qzQ1IF28zag8.png');
    
    console.log('[Logo Image] Servindo logo de:', logoPath);
    
    // Ler o arquivo de forma síncrona (mais simples para binary data)
    const fileBuffer = readFileSync(logoPath);
    
    console.log('[Logo Image] ✅ Arquivo lido com sucesso! Tamanho:', fileBuffer.length, 'bytes');

    // Retornar com headers corretos para imagem PNG
    const response = new NextResponse(fileBuffer);
    response.headers.set('Content-Type', 'image/png');
    response.headers.set('Cache-Control', 'public, max-age=60');
    response.headers.set('Content-Length', fileBuffer.length.toString());
    
    return response;
  } catch (error) {
    console.error('[Logo Image] ❌ Erro ao servir logo:', error);
    return new NextResponse('Erro ao carregar logo: ' + String(error), { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
