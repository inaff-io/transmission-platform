import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt-server';

// Rotas que não precisam de autenticação
const publicRoutes = [
  '/auth/login',
  '/auth/admin',
  '/auth/register',
  '/api/auth/login',
  '/api/auth/login/admin',
  '/api/auth/login/user',
  '/api/auth/register',
  '/api/auth/pre-login',
  '/api/links/active',
  '/api/ui',
  '/api/logo',
  '/api/proxy',
  '/api/proxy-secure',
  '/api/iframe-proxy',
  '/_next',
  '/favicon.ico',
  '/static',
  '/images',
  '/logo-evento.png',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.xml'
];

// Função auxiliar para verificar se a rota é pública
const isPublicRoute = (pathname: string) => {
  return publicRoutes.some(route => pathname.startsWith(route));
};

// Identifica se a rota é de API
const isApiRoute = (pathname: string) => pathname.startsWith('/api/');

export async function middleware(req: NextRequest) {
  try {
    // NÃO interferir com parâmetros internos (_rsc, _vercel_rsc) do Next.js
    // Esses parâmetros são necessários para a renderização de Server Components e
    // removê-los ou reescrevê-los pode causar abortos de requisições no cliente.

    // Se for rota pública, permite acesso
    if (isPublicRoute(req.nextUrl.pathname)) {
      return NextResponse.next();
    }

    // Pega o token do cookie
    const token = req.cookies.get('authToken')?.value;

    if (!token) {
      // Para rotas de API, responde com 401 JSON em vez de redirecionar
      if (isApiRoute(req.nextUrl.pathname)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // Redireciona para login se não houver token (rotas não-API)
      const loginUrl = new URL('/auth/login', req.url);
      return NextResponse.redirect(loginUrl);
    }

    // Valida o token sem consultar o banco
    try {
      await verifyToken(token);
    } catch {
      if (isApiRoute(req.nextUrl.pathname)) {
        const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        response.cookies.delete('authToken');
        return response;
      }
      const response = NextResponse.redirect(new URL('/auth/login', req.url));
      response.cookies.delete('authToken');
      return response;
    }

    // Se o token é válido, permite o acesso
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    
    // Em caso de erro, retorna 401 para API ou redireciona para login
    if (isApiRoute(req.nextUrl.pathname)) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      response.cookies.delete('authToken');
      return response;
    }
    const response = NextResponse.redirect(new URL('/auth/login', req.url));
    response.cookies.delete('authToken');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}