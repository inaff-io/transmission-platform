import { NextResponse } from 'next/server';
import { registerLogout } from '@/lib/auth/loginRegister';
import { logger } from '@/lib/utils/logger';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { verifyToken } from '@/lib/jwt-server';

export async function POST() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('authToken');

    if (!token?.value) {
      logger.warn({
        message: 'Tentativa de logout sem token',
        context: {
          operation: 'adminLogout',
          status: 'noToken'
        }
      });

      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    try {
      const decoded = await verifyToken(token.value);
      if (decoded?.userId) {
        await registerLogout(decoded.userId);

        logger.info({
          message: 'Logout realizado com sucesso',
          userId: decoded.userId,
          context: {
            operation: 'adminLogout',
            status: 'success'
          }
        });
      }
    } catch (e) {
      logger.error({
        message: 'Erro ao registrar logout',
        error: e,
        context: {
          operation: 'adminLogout',
          status: 'error'
        }
      });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: 'authToken',
      value: '',
      expires: new Date(0),
      path: '/'
    });

    return response;
  } catch (err) {
    logger.error({
      message: 'Erro interno no processo de logout',
      error: err,
      context: {
        operation: 'adminLogout',
        status: 'error'
      }
    });

    return NextResponse.json(
      { 
        error: 'Erro interno', 
        message: 'Ocorreu um erro ao processar o logout. Por favor, tente novamente.' 
      },
      { status: 500 }
    );
  }
}