'use client';

import { Usuario } from '@/types/database';

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || 'dfY37TqTMApFrIvh3nAzOSkiGew7KqhsHvmiXKmPIN/vPB8P3qD46rdrcEVlzzpZXZ3UJtRjOCCLbfjXALqOEg==';

export interface CustomJWTPayload {
  userId: string;
  email: string;
  nome: string;
  categoria: string;
  exp?: number;
  iat?: number;
}

// Função auxiliar para codificar em base64
function base64UrlEncode(str: string): string {
  const base64 = btoa(str);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Função auxiliar para converter objeto em string JSON segura para URL
function jsonToBase64Url<T>(obj: T): string {
  const json = JSON.stringify(obj);
  return base64UrlEncode(json);
}

export async function createToken(user: Usuario): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload: CustomJWTPayload = {
    userId: user.id,
    email: user.email,
    nome: user.nome,
    categoria: user.categoria,
    iat: now,
    exp: now + (24 * 60 * 60) // 24 horas
  };

  // Criar string base para assinar (header.payload)
  const headerBase64 = jsonToBase64Url(header);
  const payloadBase64 = jsonToBase64Url(payload);
  const base = `${headerBase64}.${payloadBase64}`;

  // Convertendo a chave secreta para bytes
  const encoder = new TextEncoder();
  const keyData = encoder.encode(JWT_SECRET);

  // Importando a chave para uso com Web Crypto API
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Assinando
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(base)
  );

  // Convertendo assinatura para base64url
  const signatureBase64 = base64UrlEncode(
    Array.from(new Uint8Array(signature)).map(byte => String.fromCharCode(byte)).join('')
  );

  // Retornando o token completo
  return `${base}.${signatureBase64}`;
}

export async function verifyToken(token: string): Promise<CustomJWTPayload> {
  try {
    const [headerBase64, payloadBase64, signatureBase64] = token.split('.');
    
    if (!headerBase64 || !payloadBase64 || !signatureBase64) {
      throw new Error('Token mal formatado');
    }

    // Decodificar payload
    const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));

    // Verificar expiração
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Token expirado');
    }

    return payload as CustomJWTPayload;
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
