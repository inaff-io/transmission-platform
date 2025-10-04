'use client';

export function setAuthToken(token: string) {
  // Note: Esta função deve ser chamada apenas no cliente
  document.cookie = `authToken=${token}; path=/; max-age=86400; samesite=strict`;
}

export function getAuthToken(): string | null {
  // Pode ser usado tanto no cliente quanto no servidor
  const authToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('authToken='))
    ?.split('=')[1];
  
  return authToken || null;
}

export function clearAuth() {
  // Remove o cookie definindo uma data de expiração no passado
  document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}
