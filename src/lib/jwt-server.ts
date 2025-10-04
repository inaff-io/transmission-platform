import { Usuario } from '@/types/database';
import { jwtVerify, SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'dfY37TqTMApFrIvh3nAzOSkiGew7KqhsHvmiXKmPIN/vPB8P3qD46rdrcEVlzzpZXZ3UJtRjOCCLbfjXALqOEg==';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

const secret = new TextEncoder().encode(JWT_SECRET);

export interface CustomJWTPayload {
  userId: string;
  email: string;
  nome: string;
  categoria: string;  // 'admin' ou 'user'
  exp?: number;
  iat?: number;
}

export async function createToken(user: Usuario): Promise<string> {
  const payload: Omit<CustomJWTPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    nome: user.nome,
    categoria: user.categoria
  };

  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(JWT_EXPIRATION)
    .sign(secret);

  return jwt;
}

export async function verifyToken(token: string): Promise<CustomJWTPayload> {
  try {
    const { payload } = await jwtVerify(token, secret);
    const customPayload = payload as unknown as CustomJWTPayload;
    
    // Verifica se o payload tem todos os campos necessários
    if (!customPayload.userId || !customPayload.email || !customPayload.nome || !customPayload.categoria) {
      throw new Error('Token inválido: dados incompletos');
    }
    
    return customPayload;
  } catch (err) {
    console.error('Erro na verificação do token:', err);
    throw new Error('Token inválido ou expirado');
  }
}

export function getTokenFromHeader(header: string | null): string | null {
  if (!header?.startsWith('Bearer ')) {
    return null;
  }
  return header.split(' ')[1];
}
