import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { callbackLimiter, getClientIp } from '@/lib/ratelimit/limiters';

export async function middleware(request: NextRequest) {
  // Rate-limit /callback before auth processing — pass through without updateSession
  // to preserve the PKCE verifier (getUser() must not run before exchangeCodeForSession)
  if (request.nextUrl.pathname.startsWith('/callback')) {
    const ip = getClientIp(request);
    const { success } = await callbackLimiter.limit(ip);
    if (!success) {
      return NextResponse.redirect(new URL('/login?error=too_many_requests', request.url));
    }
    // Pass through without updateSession — callback handles its own auth
    return NextResponse.next();
  }

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
    const hasSupabaseCookie = request.cookies
      .getAll()
      .some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'));
    if (hasSupabaseCookie) {
      loginUrl.searchParams.set('reason', 'session_expired');
    }
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|auth/confirm|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
