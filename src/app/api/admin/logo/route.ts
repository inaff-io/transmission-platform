import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { verifyToken } from '@/lib/jwt-server';

const LOGO_DIR = path.join(process.cwd(), 'public', 'upload', 'evento', 'logo');
const LOGO_FILENAME = 'doHKepqoQ8RtQMW5qzQ1IF28zag8.png';
const LOGO_PATH = path.join(LOGO_DIR, LOGO_FILENAME);
// Também salvar na raiz do public para Next.js servir estaticamente
const LOGO_PUBLIC_PATH = path.join(process.cwd(), 'public', 'logo-evento.png');

// Verificar autenticação de admin
async function verifyAdmin(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value;
  
  if (!token) {
    return { authorized: false, error: 'Não autenticado' };
  }

  try {
    const payload = await verifyToken(token);
    if (payload.categoria.toLowerCase() !== 'admin') {
      return { authorized: false, error: 'Acesso negado' };
    }
    return { authorized: true };
  } catch (error) {
    return { authorized: false, error: 'Token inválido' };
  }
}

// POST - Upload do logo
export async function POST(request: NextRequest) {
  // Verificar autenticação
  const auth = await verifyAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Arquivo deve ser uma imagem' },
        { status: 400 }
      );
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo: 5MB' },
        { status: 400 }
      );
    }

    // Criar diretório se não existir
    if (!existsSync(LOGO_DIR)) {
      await mkdir(LOGO_DIR, { recursive: true });
    }

    // Converter arquivo para buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Salvar arquivo em ambos os locais
    await writeFile(LOGO_PATH, buffer);
    await writeFile(LOGO_PUBLIC_PATH, buffer);

    console.log('[AdminLogo] Logo atualizado em:', LOGO_PATH);
    console.log('[AdminLogo] Logo atualizado em:', LOGO_PUBLIC_PATH);

    return NextResponse.json({
      success: true,
      url: '/logo-evento.png',
      message: 'Logo atualizado com sucesso'
    });
  } catch (error) {
    console.error('[AdminLogo] Erro ao fazer upload:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer upload do arquivo' },
      { status: 500 }
    );
  }
}

// DELETE - Remover logo
export async function DELETE(request: NextRequest) {
  // Verificar autenticação
  const auth = await verifyAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: 401 }
    );
  }

  try {
    // Remover de ambos os locais
    if (existsSync(LOGO_PATH)) {
      await unlink(LOGO_PATH);
      console.log('[AdminLogo] Logo removido:', LOGO_PATH);
    }
    if (existsSync(LOGO_PUBLIC_PATH)) {
      await unlink(LOGO_PUBLIC_PATH);
      console.log('[AdminLogo] Logo removido:', LOGO_PUBLIC_PATH);
    }

    return NextResponse.json({
      success: true,
      message: 'Logo removido com sucesso'
    });
  } catch (error) {
    console.error('[AdminLogo] Erro ao remover logo:', error);
    return NextResponse.json(
      { error: 'Erro ao remover logo' },
      { status: 500 }
    );
  }
}

// GET - Verificar se logo existe
export async function GET(request: NextRequest) {
  // Verificar autenticação
  const auth = await verifyAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: 401 }
    );
  }

  try {
    const exists = existsSync(LOGO_PUBLIC_PATH);
    
    return NextResponse.json({
      exists,
      url: exists ? '/logo-evento.png' : null,
      path: LOGO_PUBLIC_PATH
    });
  } catch (error) {
    console.error('[AdminLogo] Erro ao verificar logo:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar logo' },
      { status: 500 }
    );
  }
}
