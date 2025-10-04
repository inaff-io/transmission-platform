import { NextResponse } from 'next/server';
import { performLogin } from '@/lib/auth/login';
import { registerLogin } from '@/lib/auth/loginRegister';
import { logger } from '@/lib/utils/logger';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { email, cpf } = data;

    logger.info({
      message: 'Iniciando processo de login de administrador',
      context: {
        operation: 'adminLogin',
        email: email ? '***' : undefined,
        cpf: cpf ? '***' : undefined
      }
    });

    const result = await performLogin({ email, cpf, mode: 'admin' });
    if (!result.success) {
      logger.warn({
        message: 'Falha na autenticação do administrador',
        context: {
          operation: 'adminLogin',
          error: result.error,
          email: email ? '***' : undefined,
          cpf: cpf ? '***' : undefined
        }
      });

      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: result.status || 400 }
      );
    }

    logger.info({
      message: 'Administrador autenticado com sucesso',
      userId: result.user?.id,
      context: {
        operation: 'adminLogin',
        status: 'success'
      }
    });

    const response = NextResponse.json({
      success: true,
      redirectUrl: result.redirectUrl,
      user: result.user
    });

    response.cookies.set({
      name: 'authToken',
      value: result.token!,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24
    });

    // Registra login em logins para relatórios
    try {
      const headers = new Headers(request.headers);
      const userAgent = headers.get('user-agent') || 'unknown';
      const ip = headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                headers.get('x-real-ip') || 
                request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                'unknown';

      if (!result.user?.id) {
        throw new Error('ID do usuário não encontrado no resultado do login');
      }

      await registerLogin(result.user.id, ip, userAgent);
    } catch (e) {
      logger.error({
        message: 'Falha ao registrar login do administrador',
        error: e,
        userId: result.user?.id,
        context: {
          operation: 'adminLogin',
          step: 'registerLogin',
          headers: Object.fromEntries(request.headers.entries())
        }
      });
    }

    return response;
  } catch (err) {
    logger.error({
      message: 'Erro interno no processo de login',
      error: err,
      context: {
        operation: 'adminLogin',
        headers: Object.fromEntries(request.headers.entries())
      }
    });

    return NextResponse.json(
      { 
        error: 'Erro interno', 
        message: 'Ocorreu um erro ao processar o login. Por favor, tente novamente.',
        details: process.env.NODE_ENV === 'development' ? 
          (err instanceof Error ? err.message : String(err)) : undefined
      },
      { status: 500 }
    );
  }
}
