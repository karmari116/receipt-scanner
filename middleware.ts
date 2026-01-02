import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const authToken = request.cookies.get('auth-token');
    const isLoginPage = request.nextUrl.pathname === '/login';

    // 1. If user is authenticated and tries to visit Login page, send them to Dashboard
    if (authToken && isLoginPage) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // 2. If user is NOT authenticated and tries to visit a protected page, send them to Login
    if (!authToken && !isLoginPage) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (login route must be publicly accessible)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
    ],
};
