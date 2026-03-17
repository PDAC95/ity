import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const { pathname } = request.nextUrl;

  const authPages = ['/login', '/register', '/forgot-password'];
  const isAuthPage = authPages.some((p) => pathname.startsWith(p));
  const isDashboard = pathname.startsWith('/dashboard');

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!user && isDashboard) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|auth/confirm|callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
