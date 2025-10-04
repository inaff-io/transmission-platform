import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { checkAuth } from '@/lib/server-auth';

export async function POST(request: Request) {
  try {
    // Verifica autenticação e permissão de admin
    const auth = await checkAuth(['admin']);
    if (!auth.ok) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const formData = await request.formData();
    const file = formData.get('logo') as File;

    if (!file) {
      return NextResponse.json(
        { message: 'Nenhum arquivo enviado' },
        { status: 400 },
      );
    }

    // Valida o tipo do arquivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { message: 'O arquivo deve ser uma imagem' },
        { status: 400 },
      );
    }

    // Converte o arquivo para Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Define o caminho onde o arquivo será salvo
    const logoPath = join(process.cwd(), 'public', 'logo-evento.png');

    // Salva o arquivo
    await writeFile(logoPath, buffer);

    return NextResponse.json({
      message: 'Logo atualizado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao fazer upload do logo:', error);
    return NextResponse.json(
      { message: 'Erro ao fazer upload do logo' },
      { status: 500 },
    );
  }
}