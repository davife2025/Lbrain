import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
export async function proxy(req) {
    const { pathname } = req.nextUrl;
    // Always allow API routes, static files, and login page
    if (pathname.startsWith('/api/') ||
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/favicon') ||
        pathname === '/login') {
        return NextResponse.next();
    }
    // Check auth for all other routes
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
        return NextResponse.redirect(new URL('/login', req.url));
    }
    return NextResponse.next();
}
export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
//# sourceMappingURL=proxy.js.map