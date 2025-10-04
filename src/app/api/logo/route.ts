import { NextRequest, NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { join } from 'path';

const LOGO_FILENAME = 'doHKepqoQ8RtQMW5qzQ1IF28zag8.png';
const LOGO_DIR = join(process.cwd(), 'public', 'upload', 'evento', 'logo');
const LOGO_PATH = join(LOGO_DIR, LOGO_FILENAME);

/**
 * GET - Verificar se logo existe (rota pública)
 * Esta rota não requer autenticação para que todos os usuários possam ver o logo
 */
export async function GET(request: NextRequest) {
  try {
    const exists = existsSync(LOGO_PATH);
    
    if (exists) {
      return NextResponse.json({
        success: true,
        logoUrl: '/upload/evento/logo/' + LOGO_FILENAME,
        exists: true
      });
    } else {
      return NextResponse.json({
        success: false,
        logoUrl: null,
        exists: false
      });
    }
  } catch (error) {
    console.error('[Logo Public] Erro ao verificar logo:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao verificar logo',
        logoUrl: null,
        exists: false
      },
      { status: 500 }
    );
  }
}
