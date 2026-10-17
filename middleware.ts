import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/app/lib/mailer/constants';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  if (pathname === '/login') {
    if (hasSession) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }
  if (!hasSession) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/campaign', '/generate'],
};
