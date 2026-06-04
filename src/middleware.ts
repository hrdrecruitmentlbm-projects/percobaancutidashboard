import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/my-leave', '/division', '/all-employees'];
const authRoute = '/';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const sessionCookie = request.cookies.get('userSession');
  const isLoggedIn = !!sessionCookie?.value;
  
  if (!isLoggedIn && protectedRoutes.some((route) => pathname.startsWith(route))) {
    const loginUrl = new URL(authRoute, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  if (isLoggedIn && pathname === authRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
