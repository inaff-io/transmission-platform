import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt-server';

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const authToken = await cookieStore.get('authToken')?.value;

    if (!authToken) {
      return null;
    }

    const payload = await verifyToken(authToken);
    if (!payload) {
      return null;
    }

    return {
      user: {
        id: payload.userId,
        categoria: payload.categoria
      }
    };
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
    return null;
  }
}